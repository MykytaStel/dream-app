import Foundation
import WidgetKit

private let appGroupID = "group.com.cherven.dreamapp"
private let snapshotKey = "widget-snapshot"

@objc(DreamWidget)
class DreamWidget: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { false }

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
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.getCurrentConfigurations { result in
        switch result {
        case .success(let widgets):
          resolve(["hasWidget": !widgets.isEmpty])
        case .failure:
          resolve(["hasWidget": false])
        }
      }
    } else {
      resolve(["hasWidget": false])
    }
  }
}
