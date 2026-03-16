import Foundation

@objc(AudioUpload)
class AudioUpload: NSObject {
  @objc
  static func requiresMainQueueSetup() -> Bool {
    false
  }

  @objc
  func upload(
    _ options: NSDictionary,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard
      let uploadUrl = options["uploadUrl"] as? String,
      let localPath = options["localPath"] as? String,
      let mimeType = options["mimeType"] as? String,
      let anonKey = options["anonKey"] as? String,
      !uploadUrl.isEmpty,
      !localPath.isEmpty,
      !anonKey.isEmpty
    else {
      reject("invalid_arguments", "uploadUrl, localPath, and anonKey are required.", nil)
      return
    }

    let accessToken = options["accessToken"] as? String

    let fileUrl = URL(fileURLWithPath: localPath)
    let requestUrl = URL(string: uploadUrl)

    guard let url = requestUrl else {
      reject("invalid_upload_url", "uploadUrl is not a valid URL.", nil)
      return
    }

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue(mimeType, forHTTPHeaderField: "Content-Type")
    request.setValue(anonKey, forHTTPHeaderField: "apikey")
    request.setValue("true", forHTTPHeaderField: "x-upsert")
    if let token = accessToken, !token.isEmpty {
      request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    }

    let session = URLSession(configuration: .default)

    let task = session.uploadTask(with: request, fromFile: fileUrl) { _, response, error in
      if let error = error {
        reject("upload_failed", error.localizedDescription, error)
        return
      }

      guard let http = response as? HTTPURLResponse else {
        reject("upload_failed", "No HTTP response from upload.", nil)
        return
      }

      if !(200 ... 299).contains(http.statusCode) {
        let message = HTTPURLResponse.localizedString(forStatusCode: http.statusCode)
        reject("upload_failed", "Supabase audio upload failed: \(message)", nil)
        return
      }

      resolve(nil)
    }

    task.resume()
  }
}

