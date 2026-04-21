// apps/mobile/metro.config.js

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Force the variable into the transform process
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// 2. This is the "Enterprise Fix": Tell Metro exactly what that variable is
config.transformer.extraHandlers = {
  ...config.transformer.extraHandlers,
  env: {
    EXPO_ROUTER_APP_ROOT: path.resolve(projectRoot, 'app'),
  },
};

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
