import SwiftUI
import WidgetKit

// Written by the app (utils/widgetBridge.ios.ts); the app group must match app.json.
private let appGroup = "group.com.HatefulRock.flextrack"

struct Snapshot: Decodable {
  struct Routine: Decodable { let name: String; let days: [Int]; let exercises: Int }
  let lastDay: String?
  let streakAtLastDay: Int
  let schedule: [Routine]

  static func load() -> Snapshot? {
    guard let json = UserDefaults(suiteName: appGroup)?.string(forKey: "snapshot"), let data = json.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(Snapshot.self, from: data)
  }
}

// Same rules as widgetView in utils/widgetData.ts: yesterday's session keeps the streak alive today,
// and today's routine shows until a session is logged today.
struct WidgetState {
  let streak: Int
  let trainedToday: Bool
  let next: (name: String, when: String, exercises: Int)?

  init(_ snapshot: Snapshot?, now: Date) {
    let calendar = Calendar.current
    let today = calendar.startOfDay(for: now)
    var gap = Int.max
    if let lastDay = snapshot?.lastDay {
      let parser = DateFormatter()
      parser.calendar = calendar; parser.locale = Locale(identifier: "en_US_POSIX"); parser.dateFormat = "yyyy-MM-dd"
      if let last = parser.date(from: lastDay) { gap = calendar.dateComponents([.day], from: last, to: today).day ?? Int.max }
    }
    trainedToday = gap == 0
    streak = gap <= 1 ? (snapshot?.streakAtLastDay ?? 0) : 0
    var found: (name: String, when: String, exercises: Int)?
    for offset in (trainedToday ? 1 : 0)...7 {
      guard let date = calendar.date(byAdding: .day, value: offset, to: today) else { continue }
      let weekday = calendar.component(.weekday, from: date) - 1 // 0 = Sunday, as in the app
      guard let routine = snapshot?.schedule.first(where: { $0.days.contains(weekday) }) else { continue }
      let when = offset == 0 ? "Today" : offset == 1 ? "Tomorrow" : date.formatted(.dateTime.weekday(.wide))
      found = (routine.name, when, routine.exercises)
      break
    }
    next = found
  }
}

struct Entry: TimelineEntry { let date: Date; let snapshot: Snapshot? }

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> Entry { Entry(date: .now, snapshot: nil) }
  func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) { completion(Entry(date: .now, snapshot: Snapshot.load())) }
  // One entry now and one at each of the next midnights, so the day rolls over without the app opening.
  func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
    let snapshot = Snapshot.load(), calendar = Calendar.current, today = calendar.startOfDay(for: .now)
    let midnights = (1...2).compactMap { calendar.date(byAdding: .day, value: $0, to: today) }
    completion(Timeline(entries: [Entry(date: .now, snapshot: snapshot)] + midnights.map { Entry(date: $0, snapshot: snapshot) }, policy: .after(midnights.last!)))
  }
}

private let chalk = Color(red: 0xF2 / 255, green: 0xF1 / 255, blue: 0xEC / 255)
private let muted = Color(red: 0xA3 / 255, green: 0xA5 / 255, blue: 0x9F / 255)
private let rubber = Color(red: 0x14 / 255, green: 0x15 / 255, blue: 0x16 / 255)

private struct Eyebrow: View {
  let text: String
  var body: some View { Text(text.uppercased()).font(.caption.weight(.semibold)).tracking(1).foregroundStyle(muted) }
}

struct StreakView: View {
  let entry: Entry
  var body: some View {
    let state = WidgetState(entry.snapshot, now: entry.date)
    let status = state.trainedToday ? "Trained today" : state.streak > 0 ? "Train today to keep it" : "Start one today"
    VStack(alignment: .leading, spacing: 0) {
      Eyebrow(text: "Streak")
      Spacer(minLength: 0)
      Text("\(state.streak)").font(.system(size: 56, weight: .heavy).width(.compressed)).foregroundStyle(chalk).contentTransition(.numericText())
      Text(state.streak == 1 ? "day" : "days").font(.subheadline.weight(.semibold)).foregroundStyle(chalk)
      Spacer(minLength: 0)
      Text(status).font(.caption).foregroundStyle(muted).lineLimit(1)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    .accessibilityElement(children: .ignore)
    .accessibilityLabel("\(state.streak) day streak. \(status)")
  }
}

struct NextWorkoutView: View {
  let entry: Entry
  var body: some View {
    let next = WidgetState(entry.snapshot, now: entry.date).next
    VStack(alignment: .leading, spacing: 4) {
      Eyebrow(text: next?.when ?? "Next workout")
      Spacer(minLength: 0)
      Text(next?.name ?? "Nothing scheduled").font(.system(size: 30, weight: .heavy).width(.compressed)).foregroundStyle(chalk).lineLimit(2).minimumScaleFactor(0.7)
      Text(next.map { "\($0.exercises) exercise\($0.exercises == 1 ? "" : "s")" } ?? "Pick days on a routine to see it here")
        .font(.caption).foregroundStyle(muted).lineLimit(2)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    .accessibilityElement(children: .combine)
  }
}

struct StreakWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "Streak", provider: Provider()) { entry in
      StreakView(entry: entry).containerBackground(rubber, for: .widget).widgetURL(URL(string: "flextrack://"))
    }
    .configurationDisplayName("Streak")
    .description("Your training streak in days.")
    .supportedFamilies([.systemSmall])
  }
}

struct NextWorkoutWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "NextWorkout", provider: Provider()) { entry in
      NextWorkoutView(entry: entry).containerBackground(rubber, for: .widget).widgetURL(URL(string: "flextrack://"))
    }
    .configurationDisplayName("Next workout")
    .description("Today's routine, or the next one on your schedule.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

@main
struct FlexTrackWidgets: WidgetBundle {
  var body: some Widget {
    StreakWidget()
    NextWorkoutWidget()
  }
}
