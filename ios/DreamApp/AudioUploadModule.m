#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AudioUpload, NSObject)

RCT_EXTERN_METHOD(
  upload
  : (NSDictionary *)options
  resolver
  : (RCTPromiseResolveBlock)resolve
  rejecter
  : (RCTPromiseRejectBlock)reject)

@end

