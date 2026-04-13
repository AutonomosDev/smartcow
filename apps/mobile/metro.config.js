const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force Metro to resolve modules from the project root first
config.resolver.disableHierarchicalLookup = true;

// 4. Disable expo-router URL rewriting (not using expo-router)
config.server = config.server || {};
config.server.rewriteRequestUrl = (url) => url;

module.exports = config;
