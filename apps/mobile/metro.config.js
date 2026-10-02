// Expo loads this configuration in Node before transforming app modules.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// The web app can use a newer React patch. Every native import, including shared
// hooks and hoisted React Native modules, must resolve the SDK's one React copy.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName.startsWith('react/')) {
    return { type: 'sourceFile', filePath: require.resolve(moduleName, { paths: [__dirname] }) };
  }
  return context.resolveRequest(context, moduleName, platform);
};
module.exports = config;
