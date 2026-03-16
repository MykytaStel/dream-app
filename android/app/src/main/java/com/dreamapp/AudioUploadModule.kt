package com.dreamapp

import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import java.io.BufferedInputStream
import java.io.File
import java.io.FileInputStream
import java.io.OutputStream
import java.net.HttpURLConnection
import java.net.URL

class AudioUploadModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "AudioUpload"

  private fun uploadFileStreaming(
    uploadUrl: String,
    localPath: String,
    mimeType: String,
    anonKey: String,
    accessToken: String?,
  ) {
    val file = File(localPath)
    if (!file.exists()) {
      throw IllegalArgumentException("Local audio file does not exist: $localPath")
    }

    val url = URL(uploadUrl)
    val connection = (url.openConnection() as HttpURLConnection).apply {
      requestMethod = "POST"
      doOutput = true
      doInput = true
      useCaches = false
      setChunkedStreamingMode(64 * 1024)
      setRequestProperty("Content-Type", mimeType)
      setRequestProperty("apikey", anonKey)
      setRequestProperty("x-upsert", "true")
      if (!accessToken.isNullOrBlank()) {
        setRequestProperty("Authorization", "Bearer $accessToken")
      }
    }

    var input: BufferedInputStream? = null
    var output: OutputStream? = null

    try {
      input = BufferedInputStream(FileInputStream(file))
      output = connection.outputStream

      val buffer = ByteArray(64 * 1024)
      while (true) {
        val read = input.read(buffer)
        if (read == -1) break
        output.write(buffer, 0, read)
      }
      output.flush()

      val code = connection.responseCode
      if (code !in 200..299) {
        val errorStream = connection.errorStream
        val errorText =
          if (errorStream != null) {
            errorStream.bufferedReader().use { it.readText() }
          } else {
            "HTTP $code"
          }
        throw RuntimeException("Supabase audio upload failed: $errorText")
      }
    } finally {
      try {
        input?.close()
      } catch (_: Exception) {
      }
      try {
        output?.close()
      } catch (_: Exception) {
      }
      connection.disconnect()
    }
  }

  @ReactMethod
  fun upload(options: ReadableMap, promise: Promise) {
    try {
      val uploadUrl = options.getString("uploadUrl") ?: ""
      val localPath = options.getString("localPath") ?: ""
      val mimeType = options.getString("mimeType") ?: "application/octet-stream"
      val anonKey = options.getString("anonKey") ?: ""
      val accessToken = if (options.hasKey("accessToken")) {
        options.getString("accessToken")
      } else {
        null
      }

      if (uploadUrl.isBlank() || localPath.isBlank() || anonKey.isBlank()) {
        promise.reject(
          "invalid_arguments",
          "uploadUrl, localPath, and anonKey are required.",
        )
        return
      }

      uploadFileStreaming(
        uploadUrl = uploadUrl,
        localPath = localPath,
        mimeType = mimeType,
        anonKey = anonKey,
        accessToken = accessToken,
      )

      promise.resolve(null)
    } catch (error: Exception) {
      Log.e("AudioUploadModule", "upload failed", error)
      promise.reject("upload_failed", error.message, error)
    }
  }
}

