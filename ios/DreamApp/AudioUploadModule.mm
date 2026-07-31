#import <ReactCodegen/AppSpecs/AppSpecs.h>
// Before the Swift header, which describes every @objc class in the app —
// including the app delegate, whose superclass this declares.
#import <React-RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>
#import "DreamApp-Swift.h"

/**
 * The boundary, and nothing else.
 *
 * What this replaces was an RCT_EXTERN_METHOD block declaring `options` as an
 * untyped NSDictionary, which Swift then unpacked key by key. Codegen turns the
 * TypeScript into a struct with typed accessors, so a renamed field is a
 * compile error here rather than a nil at runtime on someone's upload.
 */
@interface AudioUpload : NSObject <NativeAudioUploadSpec>
@end

@implementation AudioUpload {
  AudioUploadImpl *_impl;
}

RCT_EXPORT_MODULE()

- (instancetype)init
{
  if (self = [super init]) {
    _impl = [AudioUploadImpl new];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (void)upload:(JS::NativeAudioUpload::AudioUploadOptions &)options
       resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject
{
  [_impl uploadWithUploadUrl:options.uploadUrl()
                   localPath:options.localPath()
                    mimeType:options.mimeType()
                     anonKey:options.anonKey()
                 accessToken:options.accessToken()
                    resolver:resolve
                    rejecter:reject];
}

- (std::shared_ptr<facebook::react::TurboModule>)
    getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeAudioUploadSpecJSI>(params);
}

@end
