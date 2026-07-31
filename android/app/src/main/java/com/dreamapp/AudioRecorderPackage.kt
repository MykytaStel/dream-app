package com.dreamapp

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.dreamapp.specs.NativeAudioRecorderSpec

/**
 * Native recording and playback on Android.
 *
 * A TurboModule package: it registers a name and a factory rather than an
 * instance, so the module is built the first time JavaScript reaches for it
 * instead of at every app start.
 */
class AudioRecorderPackage : BaseReactPackage() {
  override fun getModule(
    name: String,
    reactContext: ReactApplicationContext,
  ): NativeModule? =
    if (name == NativeAudioRecorderSpec.NAME) {
      AudioRecorderModule(reactContext)
    } else {
      null
    }

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(
      NativeAudioRecorderSpec.NAME to
        ReactModuleInfo(
          NativeAudioRecorderSpec.NAME,
          NativeAudioRecorderSpec.NAME,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          false, // isCxxModule
          true, // isTurboModule
        ),
    )
  }
}
