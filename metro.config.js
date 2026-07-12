const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : [config.resolver.blockList]),
  /\.codegraph[\\/].*/,
];

module.exports = config;