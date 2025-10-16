// Local Metro configuration for React Native
const path = require('path')

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')

const config = {
  // Watch the parent folder for monorepo setups
  watchFolders: [path.resolve(__dirname, '..')],

  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, '../node_modules'), // For monorepo
    ],

    // Force resolution to avoid duplicate React instances
    extraResolveFields: ['react-native', 'browser', 'main'],

    // Alternative: Use unstable_enablePackageExports for better resolution
    unstable_enablePackageExports: true,

    // Handle specific module resolution
    resolveRequest: (context, moduleName, platform) => {
      // Force React and React Native to use local node_modules
      if (moduleName === 'react' || moduleName === 'react-native') {
        const resolvedPath = path.resolve(__dirname, 'node_modules', moduleName)
        return {
          filePath: context.resolveRequest(context, resolvedPath, platform)
            ?.filePath,
          type: 'sourceFile',
        }
      }

      // Let Metro handle other modules normally
      return context.resolveRequest(context, moduleName, platform)
    },
  },

  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
}

module.exports = mergeConfig(getDefaultConfig(__dirname), config)

// Default Metro configuration for React Native
// const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')

// const defaultConfig = getDefaultConfig(__dirname)

// /**
//  * Metro configuration
//  * https://reactnative.dev/docs/metro
//  *
//  * @type {import('metro-config').MetroConfig}
//  */
// const config = {}

// module.exports = mergeConfig(defaultConfig, config)
