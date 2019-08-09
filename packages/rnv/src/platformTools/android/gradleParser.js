import path from 'path';
import os from 'os';
import fs from 'fs';
import net from 'net';
import chalk from 'chalk';
import shell from 'shelljs';
import child_process from 'child_process';
import inquirer from 'inquirer';
import {
    logTask,
    logError,
    getAppFolder,
    isPlatformActive,
    copyBuildsFolder,
    getAppVersion,
    getAppTitle,
    getAppVersionCode,
    writeCleanFile,
    getAppId,
    getAppTemplateFolder,
    getBuildFilePath,
    getEntryFile,
    logWarning,
    logDebug,
    getConfigProp,
    logInfo,
    logSuccess,
    getBuildsFolder,
} from '../../common';
import { copyFolderContentsRecursiveSync, copyFileSync, mkdirSync, readObjectSync } from '../../systemTools/fileutils';
import { getMergedPlugin, parsePlugins } from '../../pluginTools';

export const parseBuildGradleSync = (c, platform) => {
    const appFolder = getAppFolder(c, platform);

    writeCleanFile(getBuildFilePath(c, platform, 'build.gradle'), path.join(appFolder, 'build.gradle'), [
        { pattern: '{{COMPILE_SDK_VERSION}}', override: c.pluginConfigAndroid.compileSdkVersion },
        { pattern: '{{SUPPORT_LIB_VERSION}}', override: c.pluginConfigAndroid.supportLibVersion },
        { pattern: '{{BUILD_TOOLS_VERSION}}', override: c.pluginConfigAndroid.buildToolsVersion },
        { pattern: '{{PLUGIN_INJECT_ALLPROJECTS_REPOSITORIES}}', override: c.pluginConfigAndroid.buildGradleAllProjectsRepositories },
        { pattern: '{{PLUGIN_INJECT_BUILDSCRIPT_REPOSITORIES}}', override: c.pluginConfigAndroid.buildGradleBuildScriptRepositories },
        { pattern: '{{PLUGIN_INJECT_BUILDSCRIPT_DEPENDENCIES}}', override: c.pluginConfigAndroid.buildGradleBuildScriptDependencies }
    ]);
};

export const parseAppBuildGradleSync = (c, platform) => {
    const appFolder = getAppFolder(c, platform);

    // ANDROID PROPS
    c.pluginConfigAndroid.minSdkVersion = getConfigProp(c, platform, 'minSdkVersion', 21);
    c.pluginConfigAndroid.targetSdkVersion = getConfigProp(c, platform, 'targetSdkVersion', 28);
    c.pluginConfigAndroid.compileSdkVersion = getConfigProp(c, platform, 'compileSdkVersion', 28);
    c.pluginConfigAndroid.supportLibVersion = getConfigProp(c, platform, 'supportLibVersion', '28.0.0');
    c.pluginConfigAndroid.buildToolsVersion = getConfigProp(c, platform, 'buildToolsVersion', '28.0.0');

    // SIGNING CONFIGS
    const debugSigning = `
    debug {
        storeFile file('debug.keystore')
        storePassword "android"
        keyAlias "androiddebugkey"
        keyPassword "android"
    }`;

    c.pluginConfigAndroid.appBuildGradleSigningConfigs = `${debugSigning}
    release`;
    c.pluginConfigAndroid.localProperties = '';
    c.files.privateConfig = _getPrivateConfig(c, platform);

    if (c.files.privateConfig && c.files.privateConfig[platform]) {
        const keystorePath = c.files.privateConfig[platform].storeFile;
        let keystorePathFull;
        if (keystorePath) {
            if (keystorePath.startsWith('./')) {
                keystorePathFull = path.join(c.files.privateConfig.parentFolder, keystorePath);
            } else {
                keystorePathFull = keystorePath;
            }
        }

        if (fs.existsSync(keystorePathFull)) {
            const genPropsPath = path.join(appFolder, 'keystore.properties');
            fs.writeFileSync(genPropsPath, `# auto generated by ReNative
storeFile=${keystorePathFull}
keyAlias=${c.files.privateConfig[platform].keyAlias}
storePassword=${c.files.privateConfig[platform].storePassword}
keyPassword=${c.files.privateConfig[platform].keyPassword}`);

            c.pluginConfigAndroid.appBuildGradleSigningConfigs = `${debugSigning}
            release {
                storeFile file(keystoreProps['storeFile'])
                storePassword keystoreProps['storePassword']
                keyAlias keystoreProps['keyAlias']
                keyPassword keystoreProps['keyPassword']
            }`;

            c.pluginConfigAndroid.localProperties = `
          def keystorePropsFile = rootProject.file("keystore.properties")
          def keystoreProps = new Properties()
          keystoreProps.load(new FileInputStream(keystorePropsFile))`;
        } else {
            logWarning(
                `Your ${chalk.white(keystorePathFull)} does not exist. You won't be able to make production releases without it!`,
            );
        }
    }

    // BUILD_TYPES
    const debugBuildTypes = c.files.pluginConfig?.android?.gradle?.buildTypes?.debug ?? [];
    const releaseBuildTypes = c.files.pluginConfig?.android?.gradle?.buildTypes?.release ?? [];
    c.pluginConfigAndroid.buildTypes = `
    debug {
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        ${debugBuildTypes.join('\n        ')}
    }
    release {
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        signingConfig signingConfigs.release
        ${releaseBuildTypes.join('\n        ')}
    }`;


    // MULTI APK
    const isMultiApk = getConfigProp(c, platform, 'multipleAPKs', false) === true;
    c.pluginConfigAndroid.multiAPKs = '';
    if (isMultiApk) {
        c.pluginConfigAndroid.multiAPKs = `
      ext.abiCodes = ["armeabi-v7a": 1, "x86": 2, "arm64-v8a": 3, "x86_64": 4]
      import com.android.build.OutputFile

      android.applicationVariants.all { variant ->
        variant.outputs.each { output ->
          def bavc = project.ext.abiCodes.get(output.getFilter(OutputFile.ABI))
          if (bavc != null) {
            output.versionCodeOverride = Integer.parseInt(Integer.toString(variant.versionCode) + Integer.toString(bavc))
          }
        }
      }`;
    }

    // SPLITS
    c.pluginConfigAndroid.splits = '';
    if (isMultiApk) {
        c.pluginConfigAndroid.splits = `
    splits {
      abi {
          reset()
          enable true
          include "armeabi-v7a", "x86", "arm64-v8a", "x86_64"
          universalApk false
      }
    }
`;
    }


    // PACKAGING OPTIONS
    c.pluginConfigAndroid.packagingOptions = `
    exclude 'META-INF/DEPENDENCIES.txt'
    exclude 'META-INF/DEPENDENCIES'
    exclude 'META-INF/dependencies.txt'
    exclude 'META-INF/LICENSE.txt'
    exclude 'META-INF/LICENSE'
    exclude 'META-INF/license.txt'
    exclude 'META-INF/LGPL2.1'
    exclude 'META-INF/NOTICE.txt'
    exclude 'META-INF/NOTICE'
    exclude 'META-INF/notice.txt'
    pickFirst 'lib/armeabi-v7a/libc++_shared.so'
    pickFirst 'lib/x86_64/libc++_shared.so'
    pickFirst 'lib/x86/libc++_shared.so'
    pickFirst 'lib/arm64-v8a/libc++_shared.so'
    pickFirst 'lib/arm64-v8a/libjsc.so'
    pickFirst 'lib/x86_64/libjsc.so'`;

    // COMPILE OPTIONS
    c.pluginConfigAndroid.compileOptions = `
    sourceCompatibility 1.8
    targetCompatibility 1.8`;


    writeCleanFile(getBuildFilePath(c, platform, 'app/build.gradle'), path.join(appFolder, 'app/build.gradle'), [
        { pattern: '{{PLUGIN_APPLY}}', override: c.pluginConfigAndroid.applyPlugin },
        { pattern: '{{APPLICATION_ID}}', override: getAppId(c, platform) },
        { pattern: '{{VERSION_CODE}}', override: getAppVersionCode(c, platform) },
        { pattern: '{{VERSION_NAME}}', override: getAppVersion(c, platform) },
        { pattern: '{{PLUGIN_IMPLEMENTATIONS}}', override: c.pluginConfigAndroid.appBuildGradleImplementations },
        { pattern: '{{PLUGIN_AFTER_EVALUATE}}', override: c.pluginConfigAndroid.appBuildGradleAfterEvaluate },
        { pattern: '{{PLUGIN_SIGNING_CONFIGS}}', override: c.pluginConfigAndroid.appBuildGradleSigningConfigs },
        { pattern: '{{PLUGIN_SPLITS}}', override: c.pluginConfigAndroid.splits },
        { pattern: '{{PLUGIN_PACKAGING_OPTIONS}}', override: c.pluginConfigAndroid.packagingOptions },
        { pattern: '{{PLUGIN_BUILD_TYPES}}', override: c.pluginConfigAndroid.buildTypes },
        { pattern: '{{PLUGIN_MULTI_APKS}}', override: c.pluginConfigAndroid.multiAPKs },
        { pattern: '{{MIN_SDK_VERSION}}', override: c.pluginConfigAndroid.minSdkVersion },
        { pattern: '{{TARGET_SDK_VERSION}}', override: c.pluginConfigAndroid.targetSdkVersion },
        { pattern: '{{COMPILE_SDK_VERSION}}', override: c.pluginConfigAndroid.compileSdkVersion },
        { pattern: '{{PLUGIN_COMPILE_OPTIONS}}', override: c.pluginConfigAndroid.compileOptions },
        { pattern: '{{PLUGIN_LOCAL_PROPERTIES}}', override: c.pluginConfigAndroid.localProperties },
    ]);
};

export const parseSettingsGradleSync = (c, platform) => {
    const appFolder = getAppFolder(c, platform);

    writeCleanFile(getBuildFilePath(c, platform, 'settings.gradle'), path.join(appFolder, 'settings.gradle'), [
        { pattern: '{{PLUGIN_INCLUDES}}', override: c.pluginConfigAndroid.pluginIncludes },
        { pattern: '{{PLUGIN_PATHS}}', override: c.pluginConfigAndroid.pluginPaths },
    ]);
};

export const parseGradlePropertiesSync = (c, platform) => {
    const appFolder = getAppFolder(c, platform);
    // GRADLE.PROPERTIES
    let pluginGradleProperties = '';
    const pluginConfigAndroid = c.files.pluginConfig?.android || {};

    const gradleProps = pluginConfigAndroid['gradle.properties'];
    if (gradleProps) {
        for (const key in gradleProps) {
            pluginGradleProperties += `${key}=${gradleProps[key]}\n`;
        }
    }
    const gradleProperties = 'gradle.properties';
    writeCleanFile(getBuildFilePath(c, platform, gradleProperties), path.join(appFolder, gradleProperties), [
        { pattern: '{{PLUGIN_GRADLE_PROPERTIES}}', override: pluginGradleProperties }
    ]);
};

export const injectPluginGradleSync = (c, plugin, key, pkg) => {
    const className = pkg ? pkg.split('.').pop() : null;
    let packageParams = '';
    if (plugin.packageParams) {
        packageParams = plugin.packageParams.join(',');
    }

    const pathFixed = plugin.path ? `${plugin.path}` : `node_modules/${key}/android`;
    const modulePath = `../../${pathFixed}`;

    // APP/BUILD.GRADLE
    if (plugin.projectName) {
        c.pluginConfigAndroid.pluginIncludes += `, ':${plugin.projectName}'`;
        c.pluginConfigAndroid.pluginPaths += `project(':${
            plugin.projectName
        }').projectDir = new File(rootProject.projectDir, '${modulePath}')\n`;
        if (!plugin.skipImplementation) {
            if (plugin.implementation) {
                c.pluginConfigAndroid.appBuildGradleImplementations += `${plugin.implementation}\n`;
            } else {
                c.pluginConfigAndroid.appBuildGradleImplementations += `    implementation project(':${plugin.projectName}')\n`;
            }
        }
    } else {
        c.pluginConfigAndroid.pluginIncludes += `, ':${key}'`;
        c.pluginConfigAndroid.pluginPaths += `project(':${key}').projectDir = new File(rootProject.projectDir, '${modulePath}')\n`;
        if (!plugin.skipImplementation) {
            if (plugin.implementation) {
                c.pluginConfigAndroid.appBuildGradleImplementations += `${plugin.implementation}\n`;
            } else {
                c.pluginConfigAndroid.appBuildGradleImplementations += `    implementation project(':${key}')\n`;
            }
        }
    }

    if (plugin.implementations) {
        plugin.implementations.forEach((v) => {
            c.pluginConfigAndroid.appBuildGradleImplementations += `    implementation ${v}\n`;
        });
    }

    const appBuildGradle = plugin['app/build.gradle'];
    if (appBuildGradle) {
        if (appBuildGradle.apply) {
            appBuildGradle.apply.forEach((v) => {
                c.pluginConfigAndroid.applyPlugin += `apply ${v}\n`;
            });
        }
    }

    if (plugin.afterEvaluate) {
        plugin.afterEvaluate.forEach((v) => {
            c.pluginConfigAndroid.appBuildGradleAfterEvaluate += ` ${v}\n`;
        });
    }
    _fixAndroidLegacy(c, pathFixed);

    // BUILD.GRADLE
    const buildGradle = plugin.BuildGradle;
    const allProjRepos = buildGradle?.allprojects?.repositories;
    if (allProjRepos) {
        for (k in allProjRepos) {
            if (allProjRepos[k] === true) {
                c.pluginConfigAndroid.buildGradleAllProjectsRepositories += `${k}\n`;
            }
        }
    }

    const buildscriptRepos = buildGradle?.buildscript?.repositories;
    if (buildscriptRepos) {
        for (k in buildscriptRepos) {
            if (buildscriptRepos[k] === true) {
                c.pluginConfigAndroid.buildGradleBuildScriptRepositories += `${k}\n`;
            }
        }
    }

    const buildscriptDeps = buildGradle?.buildscript?.dependencies;
    if (buildscriptDeps) {
        for (k in buildscriptDeps) {
            if (buildscriptDeps[k] === true) {
                c.pluginConfigAndroid.buildGradleBuildScriptDependencies += `${k}`;
            }
        }
    }
};

const _fixAndroidLegacy = (c, modulePath) => {
    const buildGradle = path.join(c.paths.projectRootFolder, modulePath, 'build.gradle');

    if (fs.existsSync(buildGradle)) {
        logDebug('FIX:', buildGradle);
        writeCleanFile(buildGradle, buildGradle, [
            { pattern: " compile '", override: "  implementation '" },
            { pattern: ' compile "', override: '  implementation "' },
            { pattern: ' testCompile "', override: '  testImplementation "' },
            { pattern: " provided '", override: "  compileOnly '" },
            { pattern: ' provided "', override: '  compileOnly "' },
            { pattern: ' compile fileTree', override: '  implementation fileTree' },
        ]);
    }
};

const _getPrivateConfig = (c, platform) => {
    const privateConfigFolder = path.join(c.paths.globalConfigFolder, c.files.projectPackage.name, c.files.appConfigFile.id);
    const appConfigSPP = c.files.appConfigFile.platforms[platform] ? c.files.appConfigFile.platforms[platform].signingPropertiesPath : null;
    const appConfigSPPClean = appConfigSPP ? appConfigSPP.replace('{globalConfigFolder}', c.paths.globalConfigFolder) : null;
    const privateConfigPath = appConfigSPPClean || path.join(privateConfigFolder, 'config.private.json');
    c.paths.privateConfigPath = privateConfigPath;
    c.paths.privateConfigDir = privateConfigPath.replace('/config.private.json', '');
    if (fs.existsSync(privateConfigPath)) {
        try {
            const output = JSON.parse(fs.readFileSync(privateConfigPath));
            output.parentFolder = c.paths.privateConfigDir;
            output.path = privateConfigPath;
            logInfo(
                `Found ${chalk.white(privateConfigPath)}. Will use it for production releases!`,
            );
            return output;
        } catch (e) {
            logError(e);
            return null;
        }
    } else {
        logWarning(
            `You're missing ${chalk.white(privateConfigPath)} for this app: . You won't be able to make production releases without it!`,
        );
        return null;
    }
};
