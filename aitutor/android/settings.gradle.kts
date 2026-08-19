pluginManagement {
    val flutterSdkPath =
        run {
            val properties = java.util.Properties()
            val file = file("local.properties")
            if (file.exists()) {
                file.inputStream().use { properties.load(it) }
            }
            val path = properties.getProperty("flutter.sdk") ?: System.getenv("FLUTTER_ROOT")
            require(path != null) { "flutter.sdk not set in local.properties" }
            path
        }

    includeBuild("$flutterSdkPath/packages/flutter_tools/gradle")

    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

plugins {
    id("dev.flutter.flutter-plugin-loader") version "1.0.0"
    id("com.android.application") version "8.3.0" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
}

include(":app")
