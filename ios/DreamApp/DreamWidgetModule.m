#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(DreamWidget, NSObject)

RCT_EXTERN_METHOD(
  updateSnapshot
  : (NSString *)snapshotJson
  resolver
  : (RCTPromiseResolveBlock)resolve
  rejecter
  : (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(
  getWidgetStatus
  : (RCTPromiseResolveBlock)resolve
  rejecter
  : (RCTPromiseRejectBlock)reject)

@end
