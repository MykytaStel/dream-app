import AVFoundation
import Foundation

/**
 * The AVFoundation delegates, kept off the exported class on purpose.
 *
 * `AudioRecorderImpl` is `@objc`, so every protocol it adopts is written into
 * the generated `DreamApp-Swift.h` — by name, without importing what defines
 * it. Adopting `AVAudioPlayerDelegate` there put `AVFoundation` on the import
 * list of every `.mm` that includes that header, including ones with no
 * interest in audio. A private class is not exported, so the conformance stays
 * where it belongs.
 */
private final class PlaybackDelegate: NSObject, AVAudioPlayerDelegate {
  var onFinished: (() -> Void)?
  var onDecodeError: (() -> Void)?

  func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
    onFinished?()
  }

  func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
    onDecodeError?()
  }
}

private final class RecordingDelegate: NSObject, AVAudioRecorderDelegate {
  var onEncodeError: (() -> Void)?

  func audioRecorderEncodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
    onEncodeError?()
  }
}

/**
 * Recording and playback on iOS, in AVFoundation rather than a library.
 *
 * The counterpart of `android/app/src/main/java/com/dreamapp/AudioRecorderModule.kt`,
 * and deliberately close to it: the same directory layout, the same file naming,
 * the same rejection codes. Two platforms that disagree about any of those turn
 * one bug report into two investigations.
 *
 * Named `Impl` for the same reason `DreamWidgetImpl` is — the module name
 * `AudioRecorder` belongs to the Objective-C++ wrapper that conforms to the
 * generated spec, and this holds the AVFoundation work it forwards to.
 */
@objc(AudioRecorderImpl)
class AudioRecorderImpl: NSObject {

  /**
   * Set by the wrapper, which forwards them to the codegen'd event emitters.
   *
   * Closures rather than a delegate protocol because the wrapper is the only
   * subscriber and the emitters it calls are C++ under the hood — a Swift
   * protocol would need a second bridging type to say the same thing.
   */
  @objc var onPlaybackProgress: ((Double, Double) -> Void)?
  @objc var onPlaybackFinished: (() -> Void)?

  private var recorder: AVAudioRecorder?
  private var player: AVAudioPlayer?
  private let playbackDelegate = PlaybackDelegate()
  private let recordingDelegate = RecordingDelegate()
  private var progressTimer: Timer?
  private var currentOutputURL: URL?

  /**
   * How often playback position is reported.
   *
   * Four times a second: enough that a progress bar does not visibly step, few
   * enough that it is not competing with the UI for the main thread. The event
   * is documented as a hint, so nothing downstream may treat this as a clock.
   */
  private static let progressInterval: TimeInterval = 0.25

  override init() {
    super.init()

    playbackDelegate.onFinished = { [weak self] in
      guard let self else { return }
      self.stopProgressTimer()
      self.player = nil
      self.deactivateSession()
      // Only the natural end emits. `stop()` clears the player before this can
      // run, and the caller that pressed stop does not need telling.
      self.onPlaybackFinished?()
    }

    playbackDelegate.onDecodeError = { [weak self] in
      self?.releasePlayer()
    }

    recordingDelegate.onEncodeError = { [weak self] in
      self?.releaseRecorder()
    }
  }

  // MARK: - Paths

  /**
   * `Documents/audio`, which is where recordings already live.
   *
   * It has to stay Documents rather than move somewhere tidier: the previous
   * implementation wrote here through `RNFS.DocumentDirectoryPath`, and every
   * recording an existing user has made is stored under this path. Changing it
   * would orphan all of them.
   */
  private func audioDirectory() throws -> URL {
    let documents = try FileManager.default.url(
      for: .documentDirectory,
      in: .userDomainMask,
      appropriateFor: nil,
      create: true
    )
    let directory = documents.appendingPathComponent("audio", isDirectory: true)

    if !FileManager.default.fileExists(atPath: directory.path) {
      try FileManager.default.createDirectory(
        at: directory,
        withIntermediateDirectories: true
      )
    }

    return directory
  }

  private func createOutputURL() throws -> URL {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyyMMdd_HHmmss_SSS"
    formatter.locale = Locale(identifier: "en_US_POSIX")

    let name = "dream_audio_\(formatter.string(from: Date())).m4a"
    return try audioDirectory().appendingPathComponent(name)
  }

  /** Guards against a name that escapes the directory it is meant to be in. */
  private func isUnderAudioDirectory(_ url: URL) -> Bool {
    guard let directory = try? audioDirectory() else {
      return false
    }
    return url.standardizedFileURL.path.hasPrefix(
      directory.standardizedFileURL.path
    )
  }

  // MARK: - Session

  private func activateSession(forRecording: Bool) throws {
    let session = AVAudioSession.sharedInstance()
    // `.playAndRecord` for both cases rather than switching category between
    // them: recording immediately after playback was tearing the category down
    // and rebuilding it, and the first half second of the recording was lost
    // while the route settled.
    try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker])
    try session.setActive(true)
  }

  private func deactivateSession() {
    // Best effort. A session that will not deactivate is not a reason to fail
    // an operation that has already produced its file.
    try? AVAudioSession.sharedInstance().setActive(
      false,
      options: [.notifyOthersOnDeactivation]
    )
  }

  private func requestPermission(_ completion: @escaping (Bool) -> Void) {
    if #available(iOS 17.0, *) {
      AVAudioApplication.requestRecordPermission(completionHandler: completion)
    } else {
      AVAudioSession.sharedInstance().requestRecordPermission(completion)
    }
  }

  // MARK: - Recording

  @objc
  func startRecording(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if recorder != nil {
      reject("already_recording", "Audio recording is already in progress.", nil)
      return
    }

    stopPlaybackInternal()

    requestPermission { [weak self] granted in
      guard let self else {
        reject("record_start_failed", "Recorder went away before it started.", nil)
        return
      }

      guard granted else {
        // Matches the code the Android path produces, so the composer shows one
        // message for one situation rather than branching on platform.
        reject(
          "audio_permission_denied",
          "Microphone permission is required to record.",
          nil
        )
        return
      }

      do {
        let url = try self.createOutputURL()

        guard self.isUnderAudioDirectory(url) else {
          reject(
            "invalid_output_path",
            "Recording output must be under app audio directory.",
            nil
          )
          return
        }

        try self.activateSession(forRecording: true)

        // Kept in step with src/features/dreams/model/audioRecordingSettings.ts,
        // which explains the numbers and the measurements behind them. A test
        // reads this file and the Kotlin one and fails if either drifts from
        // the shared constants, because the two platforms silently recording at
        // different sizes is exactly how this started.
        let settings: [String: Any] = [
          AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
          AVSampleRateKey: 22050,
          AVNumberOfChannelsKey: 1,
          AVEncoderBitRateKey: 32000,
        ]

        let recorder = try AVAudioRecorder(url: url, settings: settings)
        recorder.delegate = self.recordingDelegate

        guard recorder.record() else {
          self.releaseRecorder()
          try? FileManager.default.removeItem(at: url)
          reject("record_start_failed", "The recorder refused to start.", nil)
          return
        }

        self.recorder = recorder
        self.currentOutputURL = url

        resolve("file://\(url.path)")
      } catch {
        self.releaseRecorder()
        if let url = self.currentOutputURL {
          try? FileManager.default.removeItem(at: url)
        }
        self.currentOutputURL = nil
        reject("record_start_failed", error.localizedDescription, error)
      }
    }
  }

  @objc
  func stopRecording(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let recorder else {
      reject("not_recording", "No active audio recording to stop.", nil)
      return
    }

    let url = currentOutputURL

    recorder.stop()
    self.recorder = nil
    deactivateSession()

    guard let url, FileManager.default.fileExists(atPath: url.path) else {
      currentOutputURL = nil
      reject("record_stop_failed", "Recording file is missing after stop.", nil)
      return
    }

    resolve("file://\(url.path)")
  }

  // MARK: - Playback

  @objc
  func play(
    _ filePath: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard !filePath.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
      reject("invalid_path", "Audio file path is empty.", nil)
      return
    }

    stopRecordingInternal()
    stopPlaybackInternal()

    let path =
      filePath.hasPrefix("file://")
      ? String(filePath.dropFirst("file://".count))
      : filePath

    guard FileManager.default.fileExists(atPath: path) else {
      reject("file_missing", "Audio file does not exist: \(path)", nil)
      return
    }

    do {
      try activateSession(forRecording: false)

      let player = try AVAudioPlayer(contentsOf: URL(fileURLWithPath: path))
      player.delegate = playbackDelegate

      guard player.prepareToPlay(), player.play() else {
        releasePlayer()
        reject("play_failed", "The player refused to start.", nil)
        return
      }

      self.player = player
      startProgressTimer()

      resolve(nil)
    } catch {
      releasePlayer()
      reject("play_failed", error.localizedDescription, error)
    }
  }

  @objc
  func stop(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    // Resolving when nothing is playing rather than rejecting: "stop what is
    // not running" is a no-op the caller is allowed to ask for, and the Android
    // module answers the same way.
    stopPlaybackInternal()
    resolve(nil)
  }

  private func startProgressTimer() {
    stopProgressTimer()

    // Timers need a run loop, and React Native calls this module on its own
    // queue, which has none. Main is the run loop that is certain to exist —
    // and the work inside is reading two properties.
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }

      let timer = Timer.scheduledTimer(
        withTimeInterval: Self.progressInterval,
        repeats: true
      ) { [weak self] _ in
        guard let self, let player = self.player, player.isPlaying else {
          return
        }

        self.onPlaybackProgress?(
          player.currentTime * 1000,
          player.duration * 1000
        )
      }

      self.progressTimer = timer
    }
  }

  private func stopProgressTimer() {
    let timer = progressTimer
    progressTimer = nil

    guard let timer else { return }

    if Thread.isMainThread {
      timer.invalidate()
    } else {
      DispatchQueue.main.async { timer.invalidate() }
    }
  }

  // MARK: - Teardown

  private func stopRecordingInternal() {
    guard let recorder else { return }
    recorder.stop()
    self.recorder = nil
    deactivateSession()
  }

  private func stopPlaybackInternal() {
    stopProgressTimer()

    guard let player else { return }
    player.stop()
    self.player = nil
    deactivateSession()
  }

  private func releaseRecorder() {
    recorder?.stop()
    recorder = nil
  }

  private func releasePlayer() {
    stopProgressTimer()
    player?.stop()
    player = nil
    deactivateSession()
  }

  // MARK: - Housekeeping

  @objc
  func cleanupOrphanedAudioFiles(
    _ maxAgeDays: Double,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    do {
      let directory = try audioDirectory()
      let cutoff = Date().addingTimeInterval(-maxAgeDays * 24 * 60 * 60)

      let contents = try FileManager.default.contentsOfDirectory(
        at: directory,
        includingPropertiesForKeys: [.contentModificationDateKey, .isRegularFileKey]
      )

      var deleted = 0

      for url in contents {
        let values = try? url.resourceValues(
          forKeys: [.contentModificationDateKey, .isRegularFileKey]
        )

        guard values?.isRegularFile == true else { continue }
        // The recording in progress is not orphaned, however old its timestamp
        // looks once a long session has been running.
        guard url.standardizedFileURL != currentOutputURL?.standardizedFileURL else {
          continue
        }
        guard let modified = values?.contentModificationDate, modified < cutoff else {
          continue
        }

        if (try? FileManager.default.removeItem(at: url)) != nil {
          deleted += 1
        }
      }

      resolve(deleted)
    } catch {
      reject("cleanup_failed", error.localizedDescription, error)
    }
  }
}
