package com.dreamapp

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
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("widget_update_failed", error.message, error)
    }
  }
}
