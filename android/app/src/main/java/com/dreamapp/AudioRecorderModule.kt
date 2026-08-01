package com.dreamapp

import android.content.Context
import android.media.MediaMetadataRetriever
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.net.Uri
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
  }

  init {
    reactContext.addLifecycleEventListener(this)
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

  override fun cleanupOrphanedAudioFiles(maxAgeDays: Double, promise: Promise) {
    val context = reactApplicationContext
    try {
      val dir = getAudioDirectory(context)
      val files = dir.listFiles() ?: arrayOf()
      val cutoff = System.currentTimeMillis() - (maxAgeDays * 24 * 60 * 60 * 1000).toLong()
      var deleted = 0
      for (f in files) {
        if (!f.isFile) continue
        if (f == currentOutputFile) continue
        if (f.lastModified() < cutoff) {
          if (f.delete()) deleted++
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

  private fun stopRecordingInternal() {
    if (!isRecording || mediaRecorder == null) {
      return
    }

    try {
      mediaRecorder?.apply {
        try {
          stop()
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
    }
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

  override fun onHostPause() {
    stopRecordingInternal()
    stopPlaybackInternal()
  }

  override fun onHostDestroy() {
    stopRecordingInternal()
    stopPlaybackInternal()
    reactApplicationContext.removeLifecycleEventListener(this)
  }
}

