package com.dreamapp

import android.content.ComponentName
import android.content.pm.PackageManager
import com.dreamapp.specs.NativeAppIconSpec
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext

/**
 * Swapping the launcher icon by toggling activity-aliases.
 *
 * Each id maps to one `<activity-alias>` in the manifest; exactly one is
 * enabled at a time. `DONT_KILL_APP` keeps the current session alive, though
 * some launchers take a moment — or a relaunch — to redraw the icon. Ids match
 * `appIconService` on the JS side and iOS's `AppIconImpl`.
 */
class AppIconModule(
  reactContext: ReactApplicationContext,
) : NativeAppIconSpec(reactContext) {

  // The aliases are declared as ".launcher.X" in the manifest, so their class
  // names resolve against the module's namespace (com.dreamapp), not the
  // applicationId (com.kaleidoscopedreams) that ComponentName's first arg wants.
  private val aliasPackage = javaClass.`package`?.name ?: reactContext.packageName

  private val aliasClassById = linkedMapOf(
    "default" to "$aliasPackage.launcher.DefaultIcon",
    "ivory" to "$aliasPackage.launcher.IvoryIcon",
    "sage" to "$aliasPackage.launcher.SageIcon",
    "night" to "$aliasPackage.launcher.NightIcon",
    "mono" to "$aliasPackage.launcher.MonoIcon",
  )

  override fun isSupported(promise: Promise) {
    promise.resolve(true)
  }

  override fun getIcon(promise: Promise) {
    val pm = reactApplicationContext.packageManager
    val pkg = reactApplicationContext.packageName

    val current = aliasClassById.entries.firstOrNull { (_, className) ->
      pm.getComponentEnabledSetting(ComponentName(pkg, className)) ==
        PackageManager.COMPONENT_ENABLED_STATE_ENABLED
    }?.key ?: "default"

    promise.resolve(current)
  }

  override fun setIcon(id: String, promise: Promise) {
    if (!aliasClassById.containsKey(id)) {
      promise.reject("unknown_icon", "No app icon with id \"$id\".")
      return
    }

    try {
      val pm = reactApplicationContext.packageManager
      val pkg = reactApplicationContext.packageName

      aliasClassById.forEach { (aliasId, className) ->
        val state = if (aliasId == id) {
          PackageManager.COMPONENT_ENABLED_STATE_ENABLED
        } else {
          PackageManager.COMPONENT_ENABLED_STATE_DISABLED
        }
        pm.setComponentEnabledSetting(
          ComponentName(pkg, className),
          state,
          PackageManager.DONT_KILL_APP,
        )
      }

      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("set_failed", error.message, error)
    }
  }
}
