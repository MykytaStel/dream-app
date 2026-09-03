import UIKit

/**
 * The alternate-icon work, in Swift.
 *
 * `UIApplication.setAlternateIconName` must run on the main thread and hands
 * back its result through a completion handler; the `.mm` beside this file is
 * only the typed boundary. Icon ids match `appIconService` on the JS side —
 * "default" is the primary icon and maps to a nil alternate name.
 */
@objc(AppIconImpl)
class AppIconImpl: NSObject {
  private static let namesById: [String: String?] = [
    "default": nil,
    "ivory": "AppIcon-Ivory",
    "sage": "AppIcon-Sage",
    "night": "AppIcon-Night",
    "mono": "AppIcon-Mono",
  ]

  private static func id(forAlternateName name: String?) -> String {
    guard let name else { return "default" }
    return namesById.first { $0.value == name }?.key ?? "default"
  }

  @objc
  func isSupported(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      resolve(UIApplication.shared.supportsAlternateIcons)
    }
  }

  @objc
  func getIcon(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      resolve(Self.id(forAlternateName: UIApplication.shared.alternateIconName))
    }
  }

  @objc
  func setIcon(
    _ id: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let entry = Self.namesById.first(where: { $0.key == id }) else {
      reject("unknown_icon", "No app icon with id \"\(id)\".", nil)
      return
    }

    DispatchQueue.main.async {
      guard UIApplication.shared.supportsAlternateIcons else {
        reject("unsupported", "This device cannot change the app icon.", nil)
        return
      }

      let alternateName = entry.value
      if UIApplication.shared.alternateIconName == alternateName {
        resolve(nil)
        return
      }

      UIApplication.shared.setAlternateIconName(alternateName) { error in
        if let error {
          reject("set_failed", error.localizedDescription, error)
        } else {
          resolve(nil)
        }
      }
    }
  }
}
