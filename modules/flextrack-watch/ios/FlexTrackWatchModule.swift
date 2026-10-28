import ExpoModulesCore
import WatchConnectivity

// Hands the latest snapshot to the paired Apple Watch through WatchConnectivity. The application
// context keeps only the newest value and is delivered whenever the watch app next runs.
public class FlexTrackWatchModule: Module {
  private let session = WatchSession()

  public func definition() -> ModuleDefinition {
    Name("FlexTrackWatch")

    Function("isSupported") { () -> Bool in
      WCSession.isSupported()
    }

    AsyncFunction("updateSnapshot") { (json: String) in
      self.session.send(json)
    }
  }
}

private final class WatchSession: NSObject, WCSessionDelegate {
  private var pending: String?

  override init() {
    super.init()
    guard WCSession.isSupported() else { return }
    WCSession.default.delegate = self
    WCSession.default.activate()
  }

  func send(_ json: String) {
    guard WCSession.isSupported() else { return }
    let session = WCSession.default
    // Before activation finishes, keep the value and send it from the activation callback.
    guard session.activationState == .activated else { pending = json; return }
    guard session.isPaired, session.isWatchAppInstalled else { return }
    try? session.updateApplicationContext(["snapshot": json])
  }

  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    if activationState == .activated, let json = pending { pending = nil; send(json) }
  }

  func sessionDidBecomeInactive(_ session: WCSession) {}

  // Re-activate after the user switches to another watch, so the new one gets the snapshot.
  func sessionDidDeactivate(_ session: WCSession) { session.activate() }
}
