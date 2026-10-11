// apps/mobile/metro.config.js
// Expo's default Metro config plus one asset type: CanvasKit's .wasm, which the web preview loads
// for Skia drawings (src/features/common/skiaWeb.web.ts). Native bundles never reference it.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts = [...config.resolver.assetExts, 'wasm'];

module.exports = config;
