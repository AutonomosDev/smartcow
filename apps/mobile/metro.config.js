const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Monorepo: watch the full repo and resolve packages from both node_modules
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.disableHierarchicalLookup = true;

// Force react and react-native to always resolve from apps/mobile/node_modules
// to prevent the monorepo root (which has different versions) from winning.
const PINNED = ['react', 'react-native', 'react-native/'];
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const shouldPin = PINNED.some(
    (pkg) => moduleName === pkg || moduleName.startsWith(pkg + '/')
  );
  if (shouldPin) {
    const overrideContext = {
      ...context,
      originModulePath: path.join(projectRoot, 'index.js'),
    };
    return overrideContext.resolveRequest(overrideContext, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
