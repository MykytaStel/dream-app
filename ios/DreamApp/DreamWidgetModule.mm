#import <ReactCodegen/AppSpecs/AppSpecs.h>
// Before the Swift header: that header describes every `@objc` class in the
// app, including the app delegate, and the compiler refuses it without the
// superclass this declares.
#import <React-RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>
#import "DreamApp-Swift.h"

/**
 * The boundary, and nothing else.
 *
 * This file replaces a block of RCT_EXTERN_METHOD macros that described each
 * method's signature as text. Nothing checked those strings against the Swift
 * they pointed at, or against the TypeScript that called them — a typo in any
 * of the three produced a method that silently did not exist.
 *
 * Conforming to NativeDreamWidgetSpec makes the compiler do that checking: the
 * protocol is generated from src/specs/NativeDreamWidget.ts, so a method added
 * or renamed there fails the build here until it is implemented.
 *
 * It forwards to Swift rather than doing the work, because WidgetCenter has no
 * Objective-C interface.
 */
@interface DreamWidget : NSObject <NativeDreamWidgetSpec>
@end

@implementation DreamWidget {
  DreamWidgetImpl *_impl;
}

RCT_EXPORT_MODULE()

- (instancetype)init
{
  if (self = [super init]) {
    _impl = [DreamWidgetImpl new];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (void)updateSnapshot:(NSString *)snapshotJson
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject
{
  [_impl updateSnapshot:snapshotJson resolver:resolve rejecter:reject];
}

- (void)getWidgetStatus:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject
{
  [_impl getWidgetStatus:resolve rejecter:reject];
}

- (void)isPinSupported:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject
{
  [_impl isPinSupported:resolve rejecter:reject];
}

- (void)requestPinWidget:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject
{
  [_impl requestPinWidget:resolve rejecter:reject];
}

- (std::shared_ptr<facebook::react::TurboModule>)
    getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeDreamWidgetSpecJSI>(params);
}

@end
