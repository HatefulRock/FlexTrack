import SwiftUI
import WatchConnectivity

// Sent by the phone (modules/flextrack-watch) whenever routines or history change.
struct Snapshot: Decodable {
  struct Item: Decodable, Hashable { let name: String; let detail: String }
  struct Routine: Decodable { let name: String; let days: [Int]; let items: [Item] }
  let lastDay: String?
  let streakAtLastDay: Int
  let routines: [Routine]
}

@MainActor
final class Store: NSObject, ObservableObject, WCSessionDelegate {
  @Published private(set) var snapshot: Snapshot?
  private let key = "snapshot"

  override init() {
    super.init()
    snapshot = decode(UserDefaults.standard.string(forKey: key))
    guard WCSession.isSupported() else { return }
    WCSession.default.delegate = self
    WCSession.default.activate()
  }

  private func decode(_ json: String?) -> Snapshot? {
    guard let data = json?.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(Snapshot.self, from: data)
  }

  private func apply(_ context: [String: Any]) {
    guard let json = context[key] as? String, let next = decode(json) else { return }
    UserDefaults.standard.set(json, forKey: key)
    snapshot = next
  }

  nonisolated func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    let context = session.receivedApplicationContext
    Task { @MainActor in self.apply(context) }
  }

  nonisolated func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
    Task { @MainActor in self.apply(applicationContext) }
  }
}

// Same rules as the phone widgets (utils/widgetData.ts): yesterday's session keeps the streak alive,
// and today's routine shows until a session is logged today.
struct Today {
  let streak: Int
  let trainedToday: Bool
  let routine: Snapshot.Routine?
  let when: String

  init(_ snapshot: Snapshot?, now: Date = .now) {
    let calendar = Calendar.current, today = calendar.startOfDay(for: now)
    var gap = Int.max
    if let lastDay = snapshot?.lastDay {
      let parser = DateFormatter()
      parser.calendar = calendar; parser.locale = Locale(identifier: "en_US_POSIX"); parser.dateFormat = "yyyy-MM-dd"
      if let last = parser.date(from: lastDay) { gap = calendar.dateComponents([.day], from: last, to: today).day ?? Int.max }
    }
    trainedToday = gap == 0
    streak = gap <= 1 ? (snapshot?.streakAtLastDay ?? 0) : 0
    var found: (Snapshot.Routine, String)?
    for offset in (trainedToday ? 1 : 0)...7 {
      guard let date = calendar.date(byAdding: .day, value: offset, to: today) else { continue }
      let weekday = calendar.component(.weekday, from: date) - 1
      guard let routine = snapshot?.routines.first(where: { $0.days.contains(weekday) }) else { continue }
      found = (routine, offset == 0 ? "Today" : offset == 1 ? "Tomorrow" : date.formatted(.dateTime.weekday(.wide)))
      break
    }
    routine = found?.0
    when = found?.1 ?? "Next workout"
  }
}

private let muted = Color(red: 0xA3 / 255, green: 0xA5 / 255, blue: 0x9F / 255)

struct ContentView: View {
  @EnvironmentObject var store: Store

  var body: some View {
    // Re-evaluated every minute so the day rolls over while the app stays open.
    TimelineView(.everyMinute) { context in
      let today = Today(store.snapshot, now: context.date)
      List {
        Section {
          VStack(alignment: .leading, spacing: 0) {
            Text("\(today.streak)").font(.system(size: 44, weight: .heavy).width(.compressed))
            Text(today.trainedToday ? "day streak · trained today" : "day streak").font(.footnote).foregroundStyle(muted)
          }
          .accessibilityElement(children: .combine)
        }
        Section(today.when) {
          if let routine = today.routine {
            Text(routine.name).font(.headline)
            ForEach(routine.items, id: \.self) { item in
              VStack(alignment: .leading) {
                Text(item.name)
                Text(item.detail).font(.footnote).foregroundStyle(muted)
              }
              .accessibilityElement(children: .combine)
            }
          } else {
            Text(store.snapshot == nil ? "Open FlexTrack on your iPhone to sync." : "Nothing scheduled. Pick days on a routine in FlexTrack.")
              .font(.footnote).foregroundStyle(muted)
          }
        }
      }
      .navigationTitle("FlexTrack")
    }
  }
}

@main
struct FlexTrackWatchApp: App {
  @StateObject private var store = Store()
  var body: some Scene {
    WindowGroup { NavigationStack { ContentView() }.environmentObject(store) }
  }
}
