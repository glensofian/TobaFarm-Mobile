const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('db', 'bin', 'pte', 'gguf');

module.exports = config;
