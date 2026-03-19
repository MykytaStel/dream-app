package com.dreamapp

import android.content.Context
import org.json.JSONObject

object DreamWidgetSnapshotStore {
  private const val PREFS_NAME = "dream_widget"
  private const val SNAPSHOT_KEY = "dream_widget_snapshot"

  fun save(context: Context, snapshotJson: String) {
    context
      .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .edit()
      .putString(SNAPSHOT_KEY, snapshotJson)
      .apply()
  }

  fun read(context: Context): JSONObject? {
    val raw =
      context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).getString(SNAPSHOT_KEY, null)
        ?: return null

    return try {
      JSONObject(raw)
    } catch (_: Exception) {
      null
    }
  }
}
