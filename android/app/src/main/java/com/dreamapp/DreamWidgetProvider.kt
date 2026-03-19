package com.dreamapp

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.view.View
import android.widget.RemoteViews
import org.json.JSONObject

class DreamWidgetProvider : AppWidgetProvider() {

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
      val componentName = ComponentName(context, DreamWidgetProvider::class.java)
      val widgetIds = manager.getAppWidgetIds(componentName)
      updateWidgets(context, manager, widgetIds)
    }

    private fun updateWidgets(
      context: Context,
      manager: AppWidgetManager,
      widgetIds: IntArray,
    ) {
      if (widgetIds.isEmpty()) {
        return
      }

      val snapshot = DreamWidgetSnapshotStore.read(context) ?: buildFallbackSnapshot(context)

      widgetIds.forEach { widgetId ->
        manager.updateAppWidget(widgetId, buildRemoteViews(context, snapshot))
      }
    }

    private fun buildFallbackSnapshot(context: Context) = JSONObject().apply {
      put("title", context.getString(R.string.dream_widget_fallback_title))
      put("subtitle", context.getString(R.string.dream_widget_fallback_subtitle))
      put("meta", context.getString(R.string.dream_widget_fallback_meta))
      put(
        "primaryAction",
        JSONObject()
          .put("label", context.getString(R.string.dream_widget_fallback_primary_action))
          .put("url", "dreamapp://capture"),
      )
      put(
        "secondaryAction",
        JSONObject()
          .put("label", context.getString(R.string.dream_widget_fallback_secondary_action))
          .put("url", "dreamapp://memory"),
      )
    }

    private fun buildRemoteViews(context: Context, snapshot: JSONObject): RemoteViews {
      val views = RemoteViews(context.packageName, R.layout.dream_widget)
      val title = snapshot.optString("title")
      val subtitle = snapshot.optString("subtitle")
      val meta = snapshot.optString("meta")
      val primaryAction = snapshot.optJSONObject("primaryAction")
      val secondaryAction = snapshot.optJSONObject("secondaryAction")

      views.setTextViewText(R.id.widget_title, title)
      views.setTextViewText(R.id.widget_subtitle, subtitle)
      views.setTextViewText(R.id.widget_meta, meta)
      views.setViewVisibility(
        R.id.widget_meta,
        if (meta.isBlank()) View.GONE else View.VISIBLE,
      )

      bindAction(
        context = context,
        views = views,
        viewId = R.id.widget_primary_action,
        action = primaryAction,
        fallbackLabel = context.getString(R.string.dream_widget_fallback_primary_action),
        fallbackUrl = "dreamapp://capture",
      )
      bindAction(
        context = context,
        views = views,
        viewId = R.id.widget_secondary_action,
        action = secondaryAction,
        fallbackLabel = context.getString(R.string.dream_widget_fallback_secondary_action),
        fallbackUrl = "dreamapp://memory",
      )

      val rootUrl = primaryAction?.optString("url")?.takeIf { it.isNotBlank() } ?: "dreamapp://capture"
      views.setOnClickPendingIntent(R.id.widget_root, createPendingIntent(context, rootUrl))

      return views
    }

    private fun bindAction(
      context: Context,
      views: RemoteViews,
      viewId: Int,
      action: JSONObject?,
      fallbackLabel: String,
      fallbackUrl: String,
    ) {
      val label = action?.optString("label")?.takeIf { it.isNotBlank() } ?: fallbackLabel
      val url = action?.optString("url")?.takeIf { it.isNotBlank() } ?: fallbackUrl
      views.setTextViewText(viewId, label)
      views.setOnClickPendingIntent(viewId, createPendingIntent(context, url))
    }

    private fun createPendingIntent(context: Context, url: String): PendingIntent {
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url), context, MainActivity::class.java).apply {
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
