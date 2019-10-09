var _interopRequireDefault=require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports,"__esModule",{value:true});exports.default=exports.PIPES=exports.checkAndCreateGitignore=exports.checkAndCreateProjectPackage=exports.copyRuntimeAssets=void 0;var _extends2=_interopRequireDefault(require("@babel/runtime/helpers/extends"));var _path=_interopRequireDefault(require("path"));var _fs=_interopRequireDefault(require("fs"));var _chalk=_interopRequireDefault(require("chalk"));var _common=require("../common");var _constants=require("../constants");var _apple=require("../platformTools/apple");var _android=require("../platformTools/android");var _tizen=require("../platformTools/tizen");var _webos=require("../platformTools/webos");var _electron=require("../platformTools/electron");var _firefox=require("../platformTools/firefox");var _web=require("../platformTools/web");var _fileutils=require("../fileutils");var _platform=_interopRequireDefault(require("./platform"));var _buildHooks=require("../buildHooks");var CONFIGURE='configure';var SWITCH='switch';var CREATE='create';var REMOVE='remove';var LIST='list';var INFO='info';var PIPES={APP_CONFIGURE_BEFORE:'app:configure:before',APP_CONFIGURE_AFTER:'app:configure:after'};exports.PIPES=PIPES;var run=function run(c){(0,_common.logTask)('run');switch(c.subCommand){case CONFIGURE:return _runConfigure(c);break;case CREATE:return _runCreate(c);break;default:return Promise.reject("Sub-Command "+c.subCommand+" not supported");}};var _runConfigure=function _runConfigure(c){return new Promise(function(resolve,reject){var p=c.program.platform||'all';(0,_common.logTask)("_runConfigure:"+p);(0,_buildHooks.executePipe)(c,PIPES.APP_CONFIGURE_BEFORE).then(function(){return _checkAndCreatePlatforms(c,c.program.platform);}).then(function(){return copyRuntimeAssets(c);}).then(function(){return _runPlugins(c,c.rnvPluginsFolder);}).then(function(){return _runPlugins(c,c.projectPluginsFolder);}).then(function(){return _isOK(c,p,[_constants.ANDROID,_constants.ANDROID_TV,_constants.ANDROID_WEAR])?(0,_android.configureAndroidProperties)(c):Promise.resolve();}).then(function(){return _isOK(c,p,[_constants.ANDROID])?(0,_android.configureGradleProject)(c,_constants.ANDROID):Promise.resolve();}).then(function(){return _isOK(c,p,[_constants.ANDROID_TV])?(0,_android.configureGradleProject)(c,_constants.ANDROID_TV):Promise.resolve();}).then(function(){return _isOK(c,p,[_constants.ANDROID_WEAR])?(0,_android.configureGradleProject)(c,_constants.ANDROID_WEAR):Promise.resolve();}).then(function(){return _isOK(c,p,[_constants.TIZEN])?(0,_tizen.configureTizenGlobal)(c,_constants.TIZEN):Promise.resolve();}).then(function(){return _isOK(c,p,[_constants.TIZEN])?(0,_tizen.configureTizenProject)(c,_constants.TIZEN):Promise.resolve();}).then(function(){return _isOK(c,p,[_constants.TIZEN_WATCH])?(0,_tizen.configureTizenProject)(c,_constants.TIZEN_WATCH):Promise.resolve();}).then(function(){return _isOK(c,p,[_constants.WEBOS])?(0,_webos.configureWebOSProject)(c,_constants.WEBOS):Promise.resolve();}).then(function(){return _isOK(c,p,[_constants.WEB])?(0,_web.configureWebProject)(c,_constants.WEB):Promise.resolve();}).then(function(){return _isOK(c,p,[_constants.MACOS])?(0,_electron.configureElectronProject)(c,_constants.MACOS):Promise.resolve();}).then(function(){return _isOK(c,p,[_constants.WINDOWS])?(0,_electron.configureElectronProject)(c,_constants.WINDOWS):Promise.resolve();}).then(function(){return _isOK(c,p,[_constants.KAIOS])?(0,_firefox.configureKaiOSProject)(c,_constants.KAIOS):Promise.resolve();}).then(function(){return _isOK(c,p,[_constants.FIREFOX_OS])?(0,_firefox.configureKaiOSProject)(c,_constants.FIREFOX_OS):Promise.resolve();}).then(function(){return _isOK(c,p,[_constants.FIREFOX_TV])?(0,_firefox.configureKaiOSProject)(c,_constants.FIREFOX_TV):Promise.resolve();}).then(function(){return _isOK(c,p,[_constants.IOS])?(0,_apple.configureXcodeProject)(c,_constants.IOS):Promise.resolve();}).then(function(){return _isOK(c,p,[_constants.TVOS])?(0,_apple.configureXcodeProject)(c,_constants.TVOS):Promise.resolve();}).then(function(){return(0,_buildHooks.executePipe)(c,PIPES.APP_CONFIGURE_AFTER);}).then(function(){return resolve();}).catch(function(e){return reject(e);});});};var _isOK=function _isOK(c,p,list){var result=false;list.forEach(function(v){if((0,_common.isPlatformActive)(c,v)&&(p===v||p==='all'))result=true;});return result;};var _runCreate=function _runCreate(c){return new Promise(function(resolve,reject){(0,_common.logTask)('_runCreate');var data={};console.log("\n\n   "+_chalk.default.red('██████╗')+" \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557"+_chalk.default.red('███╗   ██╗')+" \u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2557"+_chalk.default.red('██╗   ██╗')+"\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\n   "+_chalk.default.red('██╔══██╗')+"\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D"+_chalk.default.red('████╗  ██║')+"\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u255A\u2550\u2550\u2588\u2588\u2554\u2550\u2550\u255D\u2588\u2588\u2551"+_chalk.default.red('██║   ██║')+"\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\n   "+_chalk.default.red('██████╔╝')+"\u2588\u2588\u2588\u2588\u2588\u2557  "+_chalk.default.red('██╔██╗ ██║')+"\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2551"+_chalk.default.red('██║   ██║')+"\u2588\u2588\u2588\u2588\u2588\u2557\n   "+_chalk.default.red('██╔══██╗')+"\u2588\u2588\u2554\u2550\u2550\u255D  "+_chalk.default.red('██║╚██╗██║')+"\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2551"+_chalk.default.red('╚██╗ ██╔╝')+"\u2588\u2588\u2554\u2550\u2550\u255D\n   "+_chalk.default.red('██║  ██║')+"\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557"+_chalk.default.red('██║ ╚████║')+"\u2588\u2588\u2551  \u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2551"+_chalk.default.red(' ╚████╔╝ ')+"\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\n   "+_chalk.default.red('╚═╝  ╚═╝')+"\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D"+_chalk.default.red('╚═╝  ╚═══╝')+"\u255A\u2550\u255D  \u255A\u2550\u255D   \u255A\u2550\u255D   \u255A\u2550\u255D"+_chalk.default.red('  ╚═══╝  ')+"\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D\n        \uD83D\uDE80\uD83D\uDE80\uD83D\uDE80 https://www.npmjs.com/package/renative \uD83D\uDE80\uD83D\uDE80\uD83D\uDE80\n      ");(0,_common.askQuestion)("What's your project Name? (no spaces, folder based on ID will be created in this directory)").then(function(v){data.projectName=v;return Promise.resolve(v);}).then(function(v){return(0,_common.askQuestion)("What's your project Title?");}).then(function(v){data.appTitle=v;data.appID="com.mycompany."+data.projectName;return Promise.resolve(v);}).then(function(v){return(0,_common.askQuestion)("What's your App ID? ("+_chalk.default.white(data.appID)+") will be used by default");}).then(function(v){data.teamID='';if(v!==null&&v!==''){data.appID=v.replace(/\s+/g,'-').toLowerCase();}data.supportedPlatformsString='';_common.SUPPORTED_PLATFORMS.forEach(function(v,i){return data.supportedPlatformsString+="-["+(i+1)+"] "+_chalk.default.white(v)+"\n";});return Promise.resolve(v);}).then(function(v){return(0,_common.askQuestion)("What platforms would you like to use? (Add numbers separated by comma or leave blank for all)\n"+data.supportedPlatformsString);}).then(function(v){if(v){var platforms=v.split(',');data.supportedPlatforms=[];platforms.forEach(function(v){var i=parseInt(v,10)-1;data.supportedPlatforms.push(_common.SUPPORTED_PLATFORMS[i]);});}else{data.supportedPlatforms=_common.SUPPORTED_PLATFORMS.slice(0);}data.confirmString=_chalk.default.green("\nApp Folder (project name): "+_chalk.default.white(data.projectName)+"\nApp Title: "+_chalk.default.white(data.appTitle)+"\nApp ID: "+_chalk.default.white(data.appID)+"\nSupported Platforms: "+_chalk.default.white(data.supportedPlatforms.join(','))+"\n\n");}).then(function(v){return(0,_common.askQuestion)("Is All Correct? (press ENTER for yes)\n"+data.confirmString);}).then(function(v){data.defaultAppConfigId=data.projectName+"Example";var base=_path.default.resolve('.');c.projectRootFolder=_path.default.join(base,data.projectName);c.projectPackagePath=_path.default.join(c.projectRootFolder,'package.json');data.packageName=data.appTitle.replace(/\s+/g,'-').toLowerCase();(0,_fileutils.mkdirSync)(c.projectRootFolder);checkAndCreateProjectPackage(c,data);checkAndCreateGitignore(c);checkAndCreateProjectConfig(c);(0,_common.finishQuestion)();(0,_common.logSuccess)("Your project is ready! navigate to project "+_chalk.default.white("cd "+data.projectName)+" and run "+_chalk.default.white('rnv run -p web')+" to see magic happen!");resolve();});});};var checkAndCreateProjectPackage=function checkAndCreateProjectPackage(c,data){(0,_common.logTask)("checkAndCreateProjectPackage:"+data.packageName);var packageName=data.packageName,appTitle=data.appTitle,appID=data.appID,defaultAppConfigId=data.defaultAppConfigId,supportedPlatforms=data.supportedPlatforms,teamID=data.teamID;if(!_fs.default.existsSync(c.projectPackagePath)){(0,_common.logWarning)("Looks like your package.json is missing. Let's create one for you!");var pkgJsonString=_fs.default.readFileSync(_path.default.join(c.rnvHomeFolder,'supportFiles/package-template.json')).toString();var pkgJson=JSON.parse(pkgJsonString);pkgJson.name=packageName;pkgJson.defaultAppId=appID;pkgJson.defaultAppConfigId=defaultAppConfigId;pkgJson.title=appTitle;pkgJson.version='0.1.0';pkgJson.supportedPlatforms=supportedPlatforms;pkgJson.dependencies={renative:c.rnvPackage.version};var pkgJsonStringClean=JSON.stringify(pkgJson,null,2);_fs.default.writeFileSync(c.projectPackagePath,pkgJsonStringClean);}};exports.checkAndCreateProjectPackage=checkAndCreateProjectPackage;var checkAndCreateGitignore=function checkAndCreateGitignore(c){(0,_common.logTask)('checkAndCreateGitignore');var ignrPath=_path.default.join(c.projectRootFolder,'.gitignore');if(!_fs.default.existsSync(ignrPath)){(0,_common.logWarning)("Looks like your .gitignore is missing. Let's create one for you!");(0,_fileutils.copyFileSync)(_path.default.join(c.rnvHomeFolder,'supportFiles/gitignore-template'),ignrPath);}};exports.checkAndCreateGitignore=checkAndCreateGitignore;var checkAndCreateProjectConfig=function checkAndCreateProjectConfig(c){(0,_common.logTask)('checkAndCreateProjectConfig');if(_fs.default.existsSync(c.projectConfigPath)){}else{(0,_common.logWarning)("You're missing "+_constants.RNV_PROJECT_CONFIG_NAME+" file in your root project! Let's create one!");(0,_fileutils.copyFileSync)(_path.default.join(c.rnvRootFolder,_constants.RNV_PROJECT_CONFIG_NAME),_path.default.join(c.projectRootFolder,_constants.RNV_PROJECT_CONFIG_NAME));}};var _checkAndCreatePlatforms=function _checkAndCreatePlatforms(c,platform){return new Promise(function(resolve,reject){(0,_common.logTask)("_checkAndCreatePlatforms:"+platform);if(!_fs.default.existsSync(c.platformBuildsFolder)){(0,_common.logWarning)('Platforms not created yet. creating them for you...');var newCommand=(0,_extends2.default)({},c);newCommand.subCommand='configure';newCommand.program={appConfig:c.defaultAppConfigId,platform:platform};(0,_platform.default)(newCommand).then(function(){return resolve();}).catch(function(e){return reject(e);});return;}if(platform){var appFolder=(0,_common.getAppFolder)(c,platform);if(!_fs.default.existsSync(appFolder)){(0,_common.logWarning)("Platform "+platform+" not created yet. creating them for you...");var _newCommand=(0,_extends2.default)({},c);_newCommand.subCommand='configure';_newCommand.program={appConfig:c.defaultAppConfigId,platform:platform};(0,_platform.default)(_newCommand).then(function(){return resolve();}).catch(function(e){return reject(e);});return;}}else{var platforms=c.appConfigFile.platforms;cmds=[];for(var k in platforms){if(!_fs.default.existsSync(k)){(0,_common.logWarning)("Platform "+k+" not created yet. creating one for you...");var _newCommand2=(0,_extends2.default)({},c);_newCommand2.subCommand='configure';_newCommand2.program={appConfig:c.defaultAppConfigId,platform:platform};cmds.push((0,_platform.default)(_newCommand2));}}Promise.all(cmds).then(function(){return resolve();}).catch(function(e){return reject(e);});return;}resolve();});};var copyRuntimeAssets=function copyRuntimeAssets(c){return new Promise(function(resolve,reject){(0,_common.logTask)('copyRuntimeAssets');var aPath=_path.default.join(c.platformAssetsFolder,'runtime');var cPath=_path.default.join(c.appConfigFolder,'assets/runtime');(0,_fileutils.copyFolderContentsRecursiveSync)(cPath,aPath);_fs.default.writeFileSync(_path.default.join(c.platformAssetsFolder,_constants.RNV_APP_CONFIG_NAME),JSON.stringify(c.appConfigFile,null,2));var fontsObj='export default [';if(c.appConfigFile){if(_fs.default.existsSync(c.fontsConfigFolder)){_fs.default.readdirSync(c.fontsConfigFolder).forEach(function(font){if(font.includes('.ttf')||font.includes('.otf')){var key=font.split('.')[0];var includedFonts=c.appConfigFile.common.includedFonts;if(includedFonts){if(includedFonts.includes('*')||includedFonts.includes(key)){if(font){var fontSource=_path.default.join(c.projectConfigFolder,'fonts',font);if(_fs.default.existsSync(fontSource)){fontsObj+="{\n                                          fontFamily: '"+key+"',\n                                          file: require('../../projectConfig/fonts/"+font+"'),\n                                      },";}else{(0,_common.logWarning)("Font "+_chalk.default.white(fontSource)+" doesn't exist! Skipping.");}}}}}});}}fontsObj+='];';_fs.default.writeFileSync(_path.default.join(c.platformAssetsFolder,'runtime','fonts.js'),fontsObj);var supportFiles=_path.default.resolve(c.rnvHomeFolder,'supportFiles');(0,_fileutils.copyFileSync)(_path.default.resolve(supportFiles,'fontManager.js'),_path.default.resolve(c.platformAssetsFolder,'runtime','fontManager.js'));(0,_fileutils.copyFileSync)(_path.default.resolve(supportFiles,'fontManager.web.js'),_path.default.resolve(c.platformAssetsFolder,'runtime','fontManager.web.js'));resolve();});};exports.copyRuntimeAssets=copyRuntimeAssets;var _runPlugins=function _runPlugins(c,pluginsPath){return new Promise(function(resolve,reject){(0,_common.logTask)('_runPlugins');(0,_fileutils.mkdirSync)(_path.default.resolve(c.platformBuildsFolder,'_shared'));(0,_fileutils.copyFolderContentsRecursiveSync)(_path.default.resolve(c.platformTemplatesFolder,'_shared'),_path.default.resolve(c.platformBuildsFolder,'_shared'));if(!_fs.default.existsSync(pluginsPath)){(0,_common.logWarning)("Your project plugin folder "+pluginsPath+" does not exists. skipping plugin configuration");resolve();return;}_fs.default.readdirSync(pluginsPath).forEach(function(dir){var source=_path.default.resolve(pluginsPath,dir,'overrides');var dest=_path.default.resolve(c.projectRootFolder,'node_modules',dir);if(_fs.default.existsSync(source)){(0,_fileutils.copyFolderContentsRecursiveSync)(source,dest,false);}else{(0,_common.logWarning)("Your plugin configuration has no override path "+source+". skipping");}});resolve();});};var _default=run;exports.default=_default;