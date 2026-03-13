package com.dreamapp

import android.content.Context
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.net.Uri
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.LifecycleEventListener
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class AudioRecorderModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

  private var mediaRecorder: MediaRecorder? = null
  private var mediaPlayer: MediaPlayer? = null
  private var currentOutputFile: File? = null
  private var isRecording: Boolean = false
  private var isPlaying: Boolean = false

  init {
    reactContext.addLifecycleEventListener(this)
  }

  override fun getName(): String = "AudioRecorder"

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

  @ReactMethod
  fun cleanupOrphanedAudioFiles(maxAgeDays: Double, promise: Promise) {
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

  @ReactMethod
  fun startRecording(promise: Promise) {
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
      recorder.setAudioChannels(1)
      recorder.setAudioSamplingRate(44100)
      recorder.setAudioEncodingBitRate(128_000)
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

  @ReactMethod
  fun stopRecording(promise: Promise) {
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

  @ReactMethod
  fun play(filePath: String, promise: Promise) {
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

      promise.resolve(null)
    } catch (error: Exception) {
      Log.e("AudioRecorderModule", "play failed", error)
      releasePlayer()
      isPlaying = false
      promise.reject("play_failed", error.message, error)
    }
  }

  @ReactMethod
  fun stop(promise: Promise) {
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
    if (!isPlaying || mediaPlayer == null) {
      return
    }

    try {
      mediaPlayer?.apply {
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

