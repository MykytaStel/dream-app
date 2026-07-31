import Foundation

/**
 * The upload itself, still in Swift.
 *
 * Named `Impl` because the module name belongs to the `.mm` beside it, which
 * conforms to the generated TurboModule protocol and forwards here.
 *
 * The parameters used to arrive as an `NSDictionary` and be pulled out with
 * `as? String` one key at a time — five casts that could each fail at runtime
 * over names typed twice, once here and once in JavaScript. Codegen types the
 * boundary now, so they arrive as strings and the guard only has to check that
 * they are not empty.
 */
@objc(AudioUploadImpl)
class AudioUploadImpl: NSObject {
  @objc
  func upload(
    uploadUrl: String,
    localPath: String,
    mimeType: String,
    anonKey: String,
    accessToken: String?,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard !uploadUrl.isEmpty, !localPath.isEmpty, !anonKey.isEmpty else {
      reject("invalid_arguments", "uploadUrl, localPath, and anonKey are required.", nil)
      return
    }

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

