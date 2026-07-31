package com.dreamapp

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.dreamapp.specs.NativeDreamWidgetSpec
import org.json.JSONObject

/**
 * Extends the class codegen writes from `src/specs/NativeDreamWidget.ts`, so
 * the compiler rejects any drift between this file and the TypeScript. The name
 * is no longer a string returned from `getName()` that had to match one written
 * separately in JavaScript.
 */
class DreamWidgetModule(
  reactContext: ReactApplicationContext,
) : NativeDreamWidgetSpec(reactContext) {

  override fun updateSnapshot(snapshotJson: String, promise: Promise) {
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

  override fun isPinSupported(promise: Promise) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val manager = AppWidgetManager.getInstance(reactApplicationContext)
      promise.resolve(manager.isRequestPinAppWidgetSupported)
    } else {
      promise.resolve(false)
    }
  }

  override fun requestPinWidget(promise: Promise) {
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

  /**
   * Was never exported on Android, and JavaScript hard-coded `false` for it —
   * so Android could invite someone to add a widget they already had. The spec
   * requires it, and AppWidgetManager knows the answer.
   */
  override fun getWidgetStatus(promise: Promise) {
    try {
      val manager = AppWidgetManager.getInstance(reactApplicationContext)
      val placed = listOf(
        DreamWidgetProvider::class.java,
        DreamLastDreamWidgetProvider::class.java,
      ).any { provider ->
        manager
          .getAppWidgetIds(ComponentName(reactApplicationContext, provider))
          .isNotEmpty()
      }

      promise.resolve(
        Arguments.createMap().apply { putBoolean("hasWidget", placed) },
      )
    } catch (error: Exception) {
      promise.reject("widget_status_failed", error.message, error)
    }
  }
}
