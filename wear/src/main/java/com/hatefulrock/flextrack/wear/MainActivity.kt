package com.hatefulrock.flextrack.wear

import android.app.Activity
import android.graphics.Color
import android.graphics.Typeface
import android.net.Uri
import android.os.Bundle
import android.util.TypedValue
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import com.google.android.gms.wearable.DataClient
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.PutDataRequest
import com.google.android.gms.wearable.Wearable
import org.json.JSONObject
import java.time.LocalDate
import java.time.format.TextStyle
import java.time.temporal.ChronoUnit
import java.util.Locale

// Shows the streak and today's routine sent by the phone (modules/flextrack-watch).
class MainActivity : Activity(), DataClient.OnDataChangedListener {
  private lateinit var content: LinearLayout
  private val chalk = Color.parseColor("#F2F1EC")
  private val muted = Color.parseColor("#A3A59F")

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    content = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      val pad = dp(24)
      setPadding(pad, pad, pad, pad * 2)
    }
    val scroll = ScrollView(this).apply {
      setBackgroundColor(Color.parseColor("#141516"))
      isVerticalScrollBarEnabled = true
      addView(content)
    }
    setContentView(scroll)
    scroll.requestFocus() // lets the crown or bezel scroll the list
    render(null)
  }

  override fun onResume() {
    super.onResume()
    val client = Wearable.getDataClient(this)
    client.addListener(this)
    // The Data Layer keeps the last item locally, so this works while the phone is away too.
    client.getDataItems(Uri.Builder().scheme(PutDataRequest.WEAR_URI_SCHEME).path(SNAPSHOT_PATH).build())
      .addOnSuccessListener { items ->
        val json = items.firstOrNull()?.let { DataMapItem.fromDataItem(it).dataMap.getString("snapshot") }
        items.release()
        render(json)
      }
  }

  override fun onPause() {
    super.onPause()
    Wearable.getDataClient(this).removeListener(this)
  }

  override fun onDataChanged(events: DataEventBuffer) {
    val json = events.firstOrNull { it.type == DataEvent.TYPE_CHANGED && it.dataItem.uri.path == SNAPSHOT_PATH }
      ?.let { DataMapItem.fromDataItem(it.dataItem).dataMap.getString("snapshot") }
    events.release()
    if (json != null) render(json)
  }

  // Same rules as the phone widgets (utils/widgetData.ts): yesterday's session keeps the streak alive,
  // and today's routine shows until a session is logged today.
  private fun render(json: String?) {
    content.removeAllViews()
    val snapshot = json?.let { runCatching { JSONObject(it) }.getOrNull() }
    val today = LocalDate.now()
    val lastDay = snapshot?.optString("lastDay")?.takeIf { it.isNotEmpty() && it != "null" }?.let { runCatching { LocalDate.parse(it) }.getOrNull() }
    val gap = lastDay?.let { ChronoUnit.DAYS.between(it, today) } ?: Long.MAX_VALUE
    val trainedToday = gap == 0L
    val streak = if (gap <= 1) snapshot?.optInt("streakAtLastDay") ?: 0 else 0

    text(streak.toString(), 44f, chalk, bold = true)
    text(if (trainedToday) "day streak · trained today" else "day streak", 13f, muted)

    val routines = snapshot?.optJSONArray("routines")
    for (offset in (if (trainedToday) 1 else 0)..7) {
      val date = today.plusDays(offset.toLong())
      val weekday = date.dayOfWeek.value % 7 // 0 = Sunday, as in the app
      val routine = (0 until (routines?.length() ?: 0)).map { routines!!.getJSONObject(it) }
        .firstOrNull { r -> r.optJSONArray("days")?.let { d -> (0 until d.length()).any { d.getInt(it) == weekday } } == true }
        ?: continue
      val label = when (offset) { 0 -> "Today"; 1 -> "Tomorrow"; else -> date.dayOfWeek.getDisplayName(TextStyle.FULL, Locale.getDefault()) }
      text(label.uppercase(Locale.getDefault()), 12f, muted, top = 16)
      text(routine.optString("name"), 18f, chalk, bold = true)
      val items = routine.optJSONArray("items")
      for (i in 0 until (items?.length() ?: 0)) {
        val item = items!!.getJSONObject(i)
        text(item.optString("name"), 15f, chalk, top = 8)
        text(item.optString("detail"), 13f, muted)
      }
      return
    }
    text(if (snapshot == null) "Open FlexTrack on your phone to sync." else "Nothing scheduled. Pick days on a routine in FlexTrack.", 13f, muted, top = 16)
  }

  private fun text(value: String, sizeSp: Float, color: Int, bold: Boolean = false, top: Int = 0) {
    content.addView(TextView(this).apply {
      text = value
      setTextColor(color)
      setTextSize(TypedValue.COMPLEX_UNIT_SP, sizeSp)
      gravity = Gravity.CENTER_HORIZONTAL
      if (bold) typeface = Typeface.create("sans-serif-condensed", Typeface.BOLD)
      layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { topMargin = dp(top) }
    })
  }

  private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()

  companion object {
    // Must match FlexTrackWatchModule.SNAPSHOT_PATH on the phone.
    const val SNAPSHOT_PATH = "/flextrack/snapshot"
  }
}
