package com.dreamapp

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import org.json.JSONObject

class DreamLastDreamWidgetProvider : AppWidgetProvider() {

  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    super.onUpdate(context, appWidgetManager, appWidgetIds)
    updateWidgets(context, appWidgetManager, appWidgetIds)
  }

  override fun onEnabled(context: Context) {
    super.onEnabled(context)
    updateAll(context)
  }

  companion object {
    fun updateAll(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      val componentName = ComponentName(context, DreamLastDreamWidgetProvider::class.java)
      val widgetIds = manager.getAppWidgetIds(componentName)
      updateWidgets(context, manager, widgetIds)
    }

    private fun updateWidgets(
      context: Context,
      manager: AppWidgetManager,
      widgetIds: IntArray,
    ) {
      if (widgetIds.isEmpty()) return

      val snapshot = DreamWidgetSnapshotStore.read(context)
      val lastDream = snapshot?.optJSONObject("lastDream")

      widgetIds.forEach { widgetId ->
        manager.updateAppWidget(widgetId, buildRemoteViews(context, lastDream))
      }
    }

    private fun buildRemoteViews(context: Context, lastDream: JSONObject?): RemoteViews {
      val views = RemoteViews(context.packageName, R.layout.dream_last_dream_widget)

      if (lastDream != null) {
        val title = lastDream.optString("title").takeIf { it.isNotBlank() }
          ?: context.getString(R.string.dream_last_dream_widget_untitled)
        val id = lastDream.optString("id")
        val url = if (id.isNotBlank()) "dreamapp://dream/$id" else "dreamapp://capture"

        views.setTextViewText(R.id.last_dream_title, title)
        views.setOnClickPendingIntent(R.id.last_dream_root, createPendingIntent(context, url))
      } else {
        views.setTextViewText(
          R.id.last_dream_title,
          context.getString(R.string.dream_last_dream_widget_empty_title),
        )
        views.setOnClickPendingIntent(
          R.id.last_dream_root,
          createPendingIntent(context, "dreamapp://capture"),
        )
      }

      return views
    }

    private fun createPendingIntent(context: Context, url: String): PendingIntent {
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url), context, MainActivity::class.java)
        .apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
      return PendingIntent.getActivity(
        context,
        url.hashCode(),
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
    }
  }
}
