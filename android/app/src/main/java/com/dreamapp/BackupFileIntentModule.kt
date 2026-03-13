package com.dreamapp

import android.content.ClipData
import android.content.Intent
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File

class BackupFileIntentModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "BackupFileIntent"

  @ReactMethod
  fun open(filePath: String, mimeType: String, promise: Promise) {
    try {
      val file = File(filePath)
      if (!file.exists()) {
        promise.reject("file_missing", "File does not exist: $filePath")
        return
      }

      val contentUri = FileProvider.getUriForFile(
        reactApplicationContext,
        "${reactApplicationContext.packageName}.fileprovider",
        file,
      )
      val intent = Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(contentUri, mimeType)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }

      if (intent.resolveActivity(reactApplicationContext.packageManager) == null) {
        promise.reject("no_handler", "No app can open this file type.")
        return
      }

      reactApplicationContext.startActivity(intent)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("open_failed", error.message, error)
    }
  }

  @ReactMethod
  fun share(filePath: String, mimeType: String, title: String?, promise: Promise) {
    try {
      val file = File(filePath)
      if (!file.exists()) {
        promise.reject("file_missing", "File does not exist: $filePath")
        return
      }

      val contentUri = FileProvider.getUriForFile(
        reactApplicationContext,
        "${reactApplicationContext.packageName}.fileprovider",
        file,
      )
      val sendIntent = Intent(Intent.ACTION_SEND).apply {
        type = mimeType
        putExtra(Intent.EXTRA_STREAM, contentUri)
        if (!title.isNullOrBlank()) {
          putExtra(Intent.EXTRA_SUBJECT, title)
        }
        clipData = ClipData.newUri(
          reactApplicationContext.contentResolver,
          title ?: file.name,
          contentUri,
        )
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }
      val chooserIntent = Intent.createChooser(sendIntent, title ?: file.name).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }

      reactApplicationContext.startActivity(chooserIntent)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("share_failed", error.message, error)
    }
  }
}
