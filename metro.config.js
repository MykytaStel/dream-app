const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const whisperEntryFile = path.resolve(__dirname, 'node_modules/whisper.rn/src/index.ts');

const config = {
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'whisper.rn') {
        return {
          type: 'sourceFile',
          filePath: whisperEntryFile,
        };
      }

      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
