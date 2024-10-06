const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
	...config.resolver.extraNodeModules,
	buffer: require.resolve("buffer"),
	crypto: require.resolve("expo-crypto"),
};

// Remova o transformer personalizado
// delete config.transformer.babelTransformerPath;

module.exports = config;
