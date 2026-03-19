package com.dreamapp

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.json.JSONObject

class DreamWidgetModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "DreamWidget"

  @ReactMethod
  fun updateSnapshot(snapshotJson: String, promise: Promise) {
    try {
      JSONObject(snapshotJson)
      DreamWidgetSnapshotStore.save(reactApplicationContext, snapshotJson)
      DreamWidgetProvider.updateAll(reactApplicationContext)
      DreamLastDreamWidgetProvider.updateAll(reactApplicationContext)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("widget_update_failed", error.message, error)
    }
  }

  @ReactMethod
  fun isPinSupported(promise: Promise) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val manager = AppWidgetManager.getInstance(reactApplicationContext)
      promise.resolve(manager.isRequestPinAppWidgetSupported)
    } else {
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun requestPinWidget(promise: Promise) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val manager = AppWidgetManager.getInstance(reactApplicationContext)
      if (manager.isRequestPinAppWidgetSupported) {
        val provider = ComponentName(reactApplicationContext, DreamWidgetProvider::class.java)
        manager.requestPinAppWidget(provider, null, null)
        promise.resolve(true)
      } else {
        promise.resolve(false)
      }
    } else {
      promise.resolve(false)
    }
  }
}
