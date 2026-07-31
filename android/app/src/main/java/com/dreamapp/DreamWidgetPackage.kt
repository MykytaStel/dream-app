package com.dreamapp

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.dreamapp.specs.NativeDreamWidgetSpec

/**
 * A TurboModule package rather than a `ReactPackage`.
 *
 * The old one built every module it owned the moment the app started, because
 * `createNativeModules` returns instances. This one hands over a name and a
 * factory, so the module is constructed the first time JavaScript actually
 * calls it — which for a widget is often never in a given session.
 */
class DreamWidgetPackage : BaseReactPackage() {
  override fun getModule(
    name: String,
    reactContext: ReactApplicationContext,
  ): NativeModule? =
    if (name == NativeDreamWidgetSpec.NAME) {
      DreamWidgetModule(reactContext)
    } else {
      null
    }

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(
      NativeDreamWidgetSpec.NAME to
        ReactModuleInfo(
          NativeDreamWidgetSpec.NAME,
          NativeDreamWidgetSpec.NAME,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          false, // isCxxModule
          true, // isTurboModule
        ),
    )
  }
}
