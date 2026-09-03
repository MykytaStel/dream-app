#import <ReactCodegen/AppSpecs/AppSpecs.h>
// Before the Swift header: it describes every `@objc` class in the app,
// including the app delegate, and will not compile without this superclass.
#import <React-RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>
#import "DreamApp-Swift.h"

/**
 * The typed boundary for the alternate-icon module. Conforms to the spec
 * generated from src/specs/NativeAppIcon.ts and forwards to Swift, which is
 * where the UIApplication work lives.
 */
@interface AppIcon : NSObject <NativeAppIconSpec>
@end

@implementation AppIcon {
  AppIconImpl *_impl;
}

RCT_EXPORT_MODULE()

- (instancetype)init
{
  if (self = [super init]) {
    _impl = [AppIconImpl new];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (void)isSupported:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject
{
  [_impl isSupported:resolve rejecter:reject];
}

- (void)getIcon:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject
{
  [_impl getIcon:resolve rejecter:reject];
}

- (void)setIcon:(NSString *)id
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject
{
  [_impl setIcon:id resolver:resolve rejecter:reject];
}

- (std::shared_ptr<facebook::react::TurboModule>)
    getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeAppIconSpecJSI>(params);
}

@end
