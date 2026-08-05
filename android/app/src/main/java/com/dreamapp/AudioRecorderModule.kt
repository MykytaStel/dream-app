package com.dreamapp

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaMetadataRetriever
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.LifecycleEventListener
import com.dreamapp.specs.NativeAudioRecorderSpec
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class AudioRecorderModule(
  reactContext: ReactApplicationContext,
) : NativeAudioRecorderSpec(reactContext), LifecycleEventListener {

  private var mediaRecorder: MediaRecorder? = null
  private var mediaPlayer: MediaPlayer? = null
  private var currentOutputFile: File? = null
  private var isRecording: Boolean = false
  private var isPlaying: Boolean = false

  /**
   * Drives the playback progress events.
   *
   * MediaPlayer has no progress callback — it can only be asked where it is —
   * so position has to be polled. Four times a second, matching the iOS timer,
   * because two platforms reporting progress at different rates makes the same
   * progress bar behave differently for no reason anyone could find in the UI
   * code.
   */
  private val progressHandler = Handler(Looper.getMainLooper())
  private val progressTicker =
    object : Runnable {
      override fun run() {
        val player = mediaPlayer
        if (!isPlaying || player == null) {
          return
        }

        try {
          emitPlaybackProgress(
            player.currentPosition.toDouble(),
            player.duration.toDouble(),
          )
        } catch (error: IllegalStateException) {
          // The player was torn down between the check and the read. Nothing to
          // report and nothing to fix; the next stop call cleans up.
          return
        }

        progressHandler.postDelayed(this, PROGRESS_INTERVAL_MS)
      }
    }

  private companion object {
    const val PROGRESS_INTERVAL_MS = 250L
    const val MILLIS_PER_DAY = 86_400_000.0
  }

  init {
    reactContext.addLifecycleEventListener(this)
  }

  private val audioManager: AudioManager
    get() =
      reactApplicationContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager

  private var focusRequest: AudioFocusRequest? = null

  /**
   * Another app taking the audio hardware while we are still in the foreground.
   *
   * Both kinds of loss end the recording. Transient is the one a phone call
   * produces, and although the name invites resuming afterwards, we do not:
   * starting again on our own would record a room nobody had agreed to record
   * twice. Ducking is ignored — it is a playback idea and means nothing to a
   * microphone.
   *
   * The iOS counterpart is `handleSessionInterruption` in
   * `AudioRecorderModule.swift`, which reports the same event for the same
   * reason.
   */
  private val focusListener =
    AudioManager.OnAudioFocusChangeListener { change ->
      if (
        change == AudioManager.AUDIOFOCUS_LOSS ||
          change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT
      ) {
        finishInterruptedRecording()
      }
    }

  /**
   * Best effort: a denied request is not a reason to refuse to record.
   *
   * Asked for exclusively so whatever the person had playing pauses for the
   * length of the recording rather than being captured along with them.
   */
  private fun requestAudioFocus() {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val request =
          AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
            .setAudioAttributes(
              AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build()
            )
            .setOnAudioFocusChangeListener(focusListener)
            .build()
        focusRequest = request
        audioManager.requestAudioFocus(request)
      } else {
        @Suppress("DEPRECATION")
        audioManager.requestAudioFocus(
          focusListener,
          AudioManager.STREAM_MUSIC,
          AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE,
        )
      }
    } catch (error: Exception) {
      Log.e("AudioRecorderModule", "Audio focus request failed", error)
    }
  }

  private fun abandonAudioFocus() {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        focusRequest?.let { audioManager.abandonAudioFocusRequest(it) }
        focusRequest = null
      } else {
        @Suppress("DEPRECATION")
        audioManager.abandonAudioFocus(focusListener)
      }
    } catch (error: Exception) {
      Log.e("AudioRecorderModule", "Abandoning audio focus failed", error)
    }
  }

  /**
   * Ends a recording the person did not end, and says so.
   *
   * The stopping already happened here before this existed — `onHostPause` has
   * always torn the recorder down, because Android does not let a backgrounded
   * app hold the microphone. What it did not do was tell anyone: the finished
   * file sat in the audio directory with nothing referring to it, and the
   * composer went on drawing a timer for a recording that had ended.
   */
  private fun finishInterruptedRecording() {
    if (!isRecording) {
      return
    }

    val uri = stopRecordingInternal()
    val payload = Arguments.createMap()
    payload.putString("uri", uri ?: "")
    emitOnRecordingInterrupted(payload)
  }

  private fun emitPlaybackProgress(positionMs: Double, durationMs: Double) {
    val payload = Arguments.createMap()
    payload.putDouble("positionMs", positionMs)
    // MediaPlayer reports -1 for a duration it does not know. Zero is the
    // honest translation for a consumer dividing by it.
    payload.putDouble("durationMs", if (durationMs < 0) 0.0 else durationMs)
    emitOnPlaybackProgress(payload)
  }

  private fun startProgressTicker() {
    stopProgressTicker()
    progressHandler.postDelayed(progressTicker, PROGRESS_INTERVAL_MS)
  }

  private fun stopProgressTicker() {
    progressHandler.removeCallbacks(progressTicker)
  }

  private fun getAudioDirectory(context: Context): File {
    val dir = File(context.filesDir, "audio")
    if (!dir.exists()) {
      dir.mkdirs()
    }
    return dir
  }

  private fun createOutputFile(context: Context): File {
    val timestamp =
      SimpleDateFormat("yyyyMMdd_HHmmss_SSS", Locale.US).format(Date())
    val fileName = "dream_audio_$timestamp.m4a"
    return File(getAudioDirectory(context), fileName)
  }

  private fun isUnderAudioDir(context: Context, file: File?): Boolean {
    if (file == null) return false
    val audioDir = getAudioDirectory(context).absolutePath
    val path = file.absolutePath
    return path.startsWith(audioDir)
  }

  private fun protectedAudioPaths(
    audioDirectory: File,
    protectedUris: ReadableArray,
  ): Set<String> {
    val paths = mutableSetOf<String>()

    for (index in 0 until protectedUris.size()) {
      val value = protectedUris.getString(index)?.trim().orEmpty()
      if (value.isEmpty()) continue

      val rawPath =
        when {
          value.startsWith("file://") -> Uri.parse(value).path
          value.startsWith("/") -> value
          else -> null
        } ?: continue

      val candidate = runCatching { File(rawPath).canonicalFile }.getOrNull() ?: continue
      val parent = runCatching { candidate.parentFile?.canonicalFile }.getOrNull()

      // Cleanup owns only direct children of filesDir/audio. A malformed,
      // external or content URI cannot protect or delete anything outside it.
      if (parent == audioDirectory) {
        paths.add(candidate.path)
      }
    }

    return paths
  }

  override fun cleanupOrphanedAudioFiles(
    maxAgeDays: Double,
    protectedUris: ReadableArray,
    promise: Promise,
  ) {
    if (!maxAgeDays.isFinite() || maxAgeDays < 0) {
      promise.reject(
        "cleanup_invalid_age",
        "Audio cleanup age must be a finite non-negative number.",
      )
      return
    }

    val context = reactApplicationContext
    try {
      val directory = getAudioDirectory(context).canonicalFile
      val protectedPaths = protectedAudioPaths(directory, protectedUris)
      val currentPath =
        currentOutputFile?.let { runCatching { it.canonicalPath }.getOrNull() }
      val ageMillis = maxAgeDays * MILLIS_PER_DAY
      val now = System.currentTimeMillis()
      val cutoff =
        if (!ageMillis.isFinite() || ageMillis >= now.toDouble()) {
          Long.MIN_VALUE
        } else {
          now - ageMillis.toLong()
        }
      var deleted = 0

      for (rawFile in directory.listFiles() ?: emptyArray()) {
        val file = runCatching { rawFile.canonicalFile }.getOrNull() ?: continue
        val parent = runCatching { file.parentFile?.canonicalFile }.getOrNull()

        if (!file.isFile || parent != directory) continue
        if (file.path == currentPath) continue
        if (protectedPaths.contains(file.path)) continue

        val modified = file.lastModified()
        if (modified <= 0 || modified >= cutoff) continue

        if (file.delete()) {
          deleted += 1
        }
      }
      promise.resolve(deleted)
    } catch (e: Exception) {
      Log.e("AudioRecorderModule", "cleanupOrphanedAudioFiles failed", e)
      promise.reject("cleanup_failed", e.message, e)
    }
  }

  override fun getDuration(filePath: String, promise: Promise) {
    if (filePath.isBlank()) {
      promise.resolve(0.0)
      return
    }

    val cleanPath =
      if (filePath.startsWith("file://")) filePath.removePrefix("file://") else filePath

    if (!File(cleanPath).exists()) {
      promise.resolve(0.0)
      return
    }

    // MediaMetadataRetriever holds a native handle, so it is released whatever
    // happens — leaking one per saved dream would be a slow drip nothing points
    // at later.
    val retriever = MediaMetadataRetriever()
    try {
      retriever.setDataSource(cleanPath)
      val raw = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
      promise.resolve(raw?.toDoubleOrNull() ?: 0.0)
    } catch (error: Exception) {
      // A file that cannot be read has no duration to report, and this is
      // called to label a button. Zero says "unknown" and the screen carries on.
      Log.e("AudioRecorderModule", "getDuration failed", error)
      promise.resolve(0.0)
    } finally {
      try {
        retriever.release()
      } catch (ignored: Exception) {
        // Best effort.
      }
    }
  }

  override fun startRecording(promise: Promise) {
    val context = reactApplicationContext

    if (isRecording) {
      promise.reject("already_recording", "Audio recording is already in progress.")
      return
    }

    stopPlaybackInternal()

    try {
      val outputFile = createOutputFile(context)
      if (!isUnderAudioDir(context, outputFile)) {
        promise.reject("invalid_output_path", "Recording output must be under app audio directory.")
        return
      }
      currentOutputFile = outputFile

      val recorder = MediaRecorder()
      mediaRecorder = recorder

      recorder.setAudioSource(MediaRecorder.AudioSource.MIC)
      recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
      recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
      // Kept in step with src/features/dreams/model/audioRecordingSettings.ts,
      // which explains the numbers and the measurements behind them. A test
      // reads both files and fails if they drift, because the two platforms
      // silently recording at different sizes is exactly how this started.
      recorder.setAudioChannels(1)
      recorder.setAudioSamplingRate(22050)
      recorder.setAudioEncodingBitRate(32_000)
      recorder.setOutputFile(outputFile.absolutePath)

      recorder.prepare()
      requestAudioFocus()
      recorder.start()

      isRecording = true

      // Return a file:// URI, which the JS layer already knows how to handle
      val uri = "file://${outputFile.absolutePath}"
      promise.resolve(uri)
    } catch (error: Exception) {
      Log.e("AudioRecorderModule", "startRecording failed", error)
      releaseRecorder()
      currentOutputFile?.delete()
      currentOutputFile = null
      isRecording = false
      promise.reject("record_start_failed", error.message, error)
    }
  }

  override fun stopRecording(promise: Promise) {
    if (!isRecording || mediaRecorder == null) {
      promise.reject("not_recording", "No active audio recording to stop.")
      return
    }

    val outputFile = currentOutputFile

    try {
      mediaRecorder?.apply {
        try {
          stop()
        } catch (error: RuntimeException) {
          Log.e("AudioRecorderModule", "Recorder stop failed", error)
          outputFile?.delete()
          throw error
        } finally {
          release()
        }
      }
      mediaRecorder = null
      isRecording = false
      abandonAudioFocus()

      if (outputFile == null || !outputFile.exists()) {
        promise.reject("record_stop_failed", "Recording file is missing after stop.")
        return
      }

      val uri = "file://${outputFile.absolutePath}"
      promise.resolve(uri)
    } catch (error: Exception) {
      Log.e("AudioRecorderModule", "stopRecording failed", error)
      releaseRecorder()
      currentOutputFile?.delete()
      currentOutputFile = null
      isRecording = false
      promise.reject("record_stop_failed", error.message, error)
    }
  }

  override fun play(filePath: String, promise: Promise) {
    if (filePath.isBlank()) {
      promise.reject("invalid_path", "Audio file path is empty.")
      return
    }

    stopRecordingInternal()
    stopPlaybackInternal()

    val context = reactApplicationContext

    try {
      val cleanPath =
        if (filePath.startsWith("file://")) filePath.removePrefix("file://") else filePath
      val file = File(cleanPath)

      if (!file.exists()) {
        promise.reject("file_missing", "Audio file does not exist: $cleanPath")
        return
      }

      val player = MediaPlayer()
      mediaPlayer = player

      player.setDataSource(context, Uri.fromFile(file))
      player.setOnCompletionListener {
        isPlaying = false
        releasePlayer()
        // Only the natural end emits. `stop()` goes through
        // stopPlaybackInternal, which clears the listener first, so pressing
        // stop and reaching the end stay two different events.
        emitOnPlaybackFinished()
      }
      player.setOnErrorListener { _, what, extra ->
        Log.e("AudioRecorderModule", "MediaPlayer error: what=$what extra=$extra")
        isPlaying = false
        releasePlayer()
        true
      }

      player.prepare()
      player.start()
      isPlaying = true
      startProgressTicker()

      promise.resolve(null)
    } catch (error: Exception) {
      Log.e("AudioRecorderModule", "play failed", error)
      releasePlayer()
      isPlaying = false
      promise.reject("play_failed", error.message, error)
    }
  }

  override fun stop(promise: Promise) {
    if (!isPlaying || mediaPlayer == null) {
      promise.resolve(null)
      return
    }

    try {
      stopPlaybackInternal()
      promise.resolve(null)
    } catch (error: Exception) {
      Log.e("AudioRecorderModule", "stop playback failed", error)
      promise.reject("stop_failed", error.message, error)
    }
  }

  /**
   * Stops a running recording and answers with the file it produced.
   *
   * Returns null when there was nothing recording, or when stopping failed
   * before the container was closed — a file MediaRecorder never finished
   * writing has no usable header and is not worth handing back.
   *
   * The return value is what lets an interruption keep the audio; this used to
   * return nothing, so every caller that was not `stopRecording` dropped the
   * recording on the floor.
   */
  private fun stopRecordingInternal(): String? {
    if (!isRecording || mediaRecorder == null) {
      return null
    }

    val outputFile = currentOutputFile
    var stopped = false

    try {
      mediaRecorder?.apply {
        try {
          stop()
          stopped = true
        } catch (error: RuntimeException) {
          Log.e("AudioRecorderModule", "Recorder stop (internal) failed", error)
        } finally {
          release()
        }
      }
    } catch (ignored: Exception) {
      // Ignore – best effort
    } finally {
      mediaRecorder = null
      isRecording = false
      currentOutputFile = null
      abandonAudioFocus()
    }

    if (!stopped || outputFile == null || !outputFile.exists()) {
      return null
    }

    return "file://${outputFile.absolutePath}"
  }

  private fun stopPlaybackInternal() {
    stopProgressTicker()

    if (!isPlaying || mediaPlayer == null) {
      return
    }

    try {
      mediaPlayer?.apply {
        // Cleared before stopping so the completion listener cannot fire and
        // report a finish that was really a stop.
        setOnCompletionListener(null)
        try {
          stop()
        } catch (error: IllegalStateException) {
          Log.e("AudioRecorderModule", "Player stop failed", error)
        } finally {
          release()
        }
      }
    } catch (ignored: Exception) {
      // Ignore – best effort
    } finally {
      mediaPlayer = null
      isPlaying = false
    }
  }

  private fun releaseRecorder() {
    try {
      mediaRecorder?.release()
    } catch (ignored: Exception) {
    } finally {
      mediaRecorder = null
      isRecording = false
      abandonAudioFocus()
    }
  }

  private fun releasePlayer() {
    stopProgressTicker()
    try {
      mediaPlayer?.release()
    } catch (ignored: Exception) {
    } finally {
      mediaPlayer = null
      isPlaying = false
    }
  }

  override fun onHostResume() {
    // no-op
  }

  /**
   * Backgrounding takes the microphone away, so a recording in progress ends
   * here — and now reports itself, rather than disappearing quietly.
   */
  override fun onHostPause() {
    finishInterruptedRecording()
    stopPlaybackInternal()
  }

  override fun onHostDestroy() {
    stopRecordingInternal()
    stopPlaybackInternal()
    reactApplicationContext.removeLifecycleEventListener(this)
  }
}
