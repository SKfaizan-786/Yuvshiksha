const { withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin for Cashfree Payment Gateway
 * Only adds Maven repository - lets auto-linking handle the dependency version
 */
module.exports = function withCashfree(config) {
    return withProjectBuildGradle(config, (config) => {
        const { modResults } = config;

        // Only add the Maven Repository
        // DO NOT add the 'implementation' dependency manually
        // The react-native-cashfree-pg-sdk package handles it via auto-linking
        if (!modResults.contents.includes('maven.cashfree.com')) {
            modResults.contents = modResults.contents.replace(
                /allprojects\s*{\s*repositories\s*{/,
                `allprojects {
    repositories {
        maven { url 'https://maven.cashfree.com/release' }`
            );
            console.log('✅ Added Cashfree Maven repository');
        }

        return config;
    });
};
