import Foundation
import WidgetKit

private let appGroupID = "group.com.kaleidoscopedreams"
private let snapshotKey = "widget-snapshot"

/**
 * The widget work itself, still in Swift.
 *
 * `WidgetCenter` has no Objective-C interface, so this cannot move into the
 * `.mm` that conforms to the generated TurboModule protocol. The two are split
 * deliberately: this file holds everything WidgetKit, and the wrapper beside it
 * holds nothing but the boundary.
 *
 * Named `Impl` because the module name `DreamWidget` now belongs to that
 * wrapper — the class React Native looks for is the one implementing the
 * generated protocol.
 */
@objc(DreamWidgetImpl)
class DreamWidgetImpl: NSObject {
  @objc
  func updateSnapshot(
    _ snapshotJson: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let defaults = UserDefaults(suiteName: appGroupID) else {
      reject("app_group_unavailable", "App Group not configured.", nil)
      return
    }

    defaults.set(snapshotJson, forKey: snapshotKey)
    WidgetCenter.shared.reloadAllTimelines()
    resolve(nil)
  }

  @objc
  func getWidgetStatus(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    WidgetCenter.shared.getCurrentConfigurations { result in
      switch result {
      case .success(let widgets):
        resolve(["hasWidget": !widgets.isEmpty])
      case .failure:
        resolve(["hasWidget": false])
      }
    }
  }

  /**
   * iOS has no API for asking the system to place a widget — the user does it
   * from the home screen. Answered rather than omitted, because the spec is one
   * interface for both platforms and a missing method used to read as
   * `undefined` in JavaScript and quietly do nothing.
   */
  @objc
  func isPinSupported(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(false)
  }

  @objc
  func requestPinWidget(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(false)
  }
}
