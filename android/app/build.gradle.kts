plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }
android { namespace="com.dpa.authenticator"; compileSdk=35
 defaultConfig { applicationId="com.dpa.authenticator"; minSdk=28; targetSdk=35; versionCode=1; versionName="1.0" } }
dependencies {
 implementation("androidx.core:core-ktx:1.15.0")
 implementation("androidx.appcompat:appcompat:1.7.0")
 implementation("androidx.biometric:biometric:1.2.0-alpha05")
 implementation("com.google.android.material:material:1.12.0")
}