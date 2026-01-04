const { withProjectBuildGradle, withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to manually link Cashfree Payment Gateway SDK
 * This ensures the native Android SDK is compiled into the APK
 */
module.exports = function withCashfree(config) {
    // Add Cashfree dependency to app/build.gradle
    config = withAppBuildGradle(config, (config) => {
        const { modResults } = config;

        // Check if Cashfree dependency is already added
        if (!modResults.contents.includes('com.cashfree.pg:api')) {
            // Find the dependencies block and add Cashfree
            modResults.contents = modResults.contents.replace(
                /dependencies\s*{/,
                `dependencies {
    // Cashfree Payment Gateway SDK
    implementation 'com.cashfree.pg:api:2.1.20'`
            );

            console.log('✅ Added Cashfree SDK dependency to app/build.gradle');
        }

        return config;
    });

    // Add Maven repository to project/build.gradle if needed
    config = withProjectBuildGradle(config, (config) => {
        const { modResults } = config;

        // Ensure maven repository is present
        if (!modResults.contents.includes('maven.cashfree.com')) {
            modResults.contents = modResults.contents.replace(
                /allprojects\s*{\s*repositories\s*{/,
                `allprojects {
    repositories {
        maven { url 'https://maven.cashfree.com/release' }`
            );

            console.log('✅ Added Cashfree Maven repository to project/build.gradle');
        }

        return config;
    });

    return config;
};
