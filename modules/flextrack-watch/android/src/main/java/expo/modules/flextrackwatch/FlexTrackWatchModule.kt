package expo.modules.flextrackwatch

import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Publishes the latest snapshot as a Data Layer item. Wear OS syncs it to every paired watch
// running FlexTrack, and keeps it for watches that connect later. It never leaves the user's devices.
class FlexTrackWatchModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("FlexTrackWatch")

    Function("isSupported") { true }

    AsyncFunction("updateSnapshot") { json: String ->
      val context = appContext.reactContext ?: return@AsyncFunction
      val request = PutDataMapRequest.create(SNAPSHOT_PATH).apply {
        dataMap.putString("snapshot", json)
      }.asPutDataRequest().setUrgent()
      Wearable.getDataClient(context).putDataItem(request)
    }
  }

  companion object {
    // Must match the path the Wear OS app listens on (wear/src/main/java/.../MainActivity.kt).
    const val SNAPSHOT_PATH = "/flextrack/snapshot"
  }
}
