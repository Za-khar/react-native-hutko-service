const path = require('path')

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')

const config = {
  watchFolders: [path.resolve(__dirname, '..')],

  resolver: {
    // CRITICAL: Force single React instance resolution
    extraNodeModules: new Proxy(
      {},
      {
        get: (target, name) => {
          if (name === 'react' || name === 'react-native') {
            return path.join(__dirname, `node_modules/${name}`)
          }
          return path.join(__dirname, `node_modules/${name}`)
        },
      },
    ),

    // Alternative approach - explicitly resolve all dependencies
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'react' || moduleName === 'react-native') {
        return {
          filePath: path.resolve(
            __dirname,
            `node_modules/${moduleName}/index.js`,
          ),
          type: 'sourceFile',
        }
      }
      return context.resolveRequest(context, moduleName, platform)
    },
  },
}

module.exports = mergeConfig(getDefaultConfig(__dirname), config)
