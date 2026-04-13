const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Monorepo: watch the full repo so shared packages are visible
config.watchFolders = [workspaceRoot];

// Resolve node_modules from app first, then monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Block Metro from ever picking up react / react-native from the monorepo root.
// The root has react-native@0.81.5 (Next.js transitive dep) which conflicts
// with the mobile app's react-native@0.76.9.
const rnRoot = path.resolve(workspaceRoot, 'node_modules', 'react-native');
const reactRoot = path.resolve(workspaceRoot, 'node_modules', 'react');
config.resolver.blockList = [
  new RegExp(`^${rnRoot.replace(/[/\\]/g, '[/\\\\]')}.*$`),
  new RegExp(`^${reactRoot.replace(/[/\\]/g, '[/\\\\]')}.*$`),
];

// Explicitly pin react and react-native to the app's own node_modules
config.resolver.extraNodeModules = {
  'react': path.resolve(projectRoot, 'node_modules', 'react'),
  'react-native': path.resolve(projectRoot, 'node_modules', 'react-native'),
};

config.resolver.disableHierarchicalLookup = true;

module.exports = config;
