#import <ReactCodegen/AppSpecs/AppSpecs.h>
// Before the Swift header, for the same reason DreamWidgetModule.mm imports it
// first: that header describes every `@objc` class in the app, including the
// app delegate, and the compiler refuses it without the superclass this
// declares.
#import <React-RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>
#import "DreamApp-Swift.h"

/**
 * The boundary, and nothing else.
 *
 * Conforming to NativeAudioRecorderSpec makes the compiler check this against
 * src/specs/NativeAudioRecorder.ts: a method added or renamed there fails the
 * build here until it is implemented.
 *
 * It inherits NativeAudioRecorderSpecBase rather than only conforming to the
 * protocol, because that base is where codegen puts the event emitters. The
 * AVFoundation work lives in Swift, which reaches them through the two blocks
 * set below — Swift cannot subclass a generated Objective-C++ class that holds
 * a C++ member, so the emitting has to happen on this side.
 */
@interface AudioRecorder : NativeAudioRecorderSpecBase <NativeAudioRecorderSpec>
@end

@implementation AudioRecorder {
  AudioRecorderImpl *_impl;
}

RCT_EXPORT_MODULE()

- (instancetype)init
{
  if (self = [super init]) {
    _impl = [AudioRecorderImpl new];

    __weak AudioRecorder *weakSelf = self;

    _impl.onPlaybackProgress = ^(double positionMs, double durationMs) {
      [weakSelf emitOnPlaybackProgress:@{
        @"positionMs" : @(positionMs),
        @"durationMs" : @(durationMs),
      }];
    };

    _impl.onPlaybackFinished = ^{
      [weakSelf emitOnPlaybackFinished];
    };

    _impl.onRecordingInterrupted = ^(NSString *uri) {
      [weakSelf emitOnRecordingInterrupted:@{@"uri" : uri}];
    };
  }
  return self;
}

/**
 * NO, because nothing here touches UIKit at construction.
 *
 * AVAudioSession and AVAudioPlayer are thread-safe to configure off the main
 * queue; the one thing that is not — scheduling the progress timer, which needs
 * a run loop — hops to main itself inside the Swift.
 */
+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (void)startRecording:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject
{
  [_impl startRecording:resolve rejecter:reject];
}

- (void)stopRecording:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject
{
  [_impl stopRecording:resolve rejecter:reject];
}

- (void)play:(NSString *)filePath
     resolve:(RCTPromiseResolveBlock)resolve
      reject:(RCTPromiseRejectBlock)reject
{
  [_impl play:filePath resolver:resolve rejecter:reject];
}

- (void)stop:(RCTPromiseResolveBlock)resolve
      reject:(RCTPromiseRejectBlock)reject
{
  [_impl stop:resolve rejecter:reject];
}

- (void)getDuration:(NSString *)filePath
            resolve:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject
{
  [_impl getDuration:filePath resolver:resolve rejecter:reject];
}

- (void)cleanupOrphanedAudioFiles:(double)maxAgeDays
                  protectedUris:(NSArray<NSString *> *)protectedUris
                         resolve:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject
{
  [_impl cleanupOrphanedAudioFiles:maxAgeDays
                    protectedUris:protectedUris
                          resolver:resolve
                           rejecter:reject];
}

- (std::shared_ptr<facebook::react::TurboModule>)
    getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeAudioRecorderSpecJSI>(params);
}

@end
