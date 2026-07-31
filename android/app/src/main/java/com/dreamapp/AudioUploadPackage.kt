package com.dreamapp

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.dreamapp.specs.NativeAudioUploadSpec

/**
 * Streams a recording to storage without holding it in memory.
 *
 * A TurboModule package: it registers a name and a factory rather than an
 * instance, so the module is built the first time JavaScript reaches for it
 * instead of at every app start.
 */
class AudioUploadPackage : BaseReactPackage() {
  override fun getModule(
    name: String,
    reactContext: ReactApplicationContext,
  ): NativeModule? =
    if (name == NativeAudioUploadSpec.NAME) {
      AudioUploadModule(reactContext)
    } else {
      null
    }

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(
      NativeAudioUploadSpec.NAME to
        ReactModuleInfo(
          NativeAudioUploadSpec.NAME,
          NativeAudioUploadSpec.NAME,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          false, // isCxxModule
          true, // isTurboModule
        ),
    )
  }
}
