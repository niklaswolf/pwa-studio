/**
 * Target definitions for Buildpack.
 *
 * Since Buildpack implements the BuildBus itself, Buildpack's own targets can
 * be considered the "base targets". Most other targets will be called in
 * interceptors to other targets. However, Buildpack code has access to the
 * BuildBus instance directly, so it can and does call the below targets
 * directly in its module code using `bus.getTargetsOf`.
 *
 * @module Buildpack/Targets
 */
module.exports = targets => {
    targets.declare({
        /**
         * @callback envVarIntercept
         * @param {Object} defs - The envVarDefinitions.json structure.
         * @returns {undefined} - Interceptors do not need to return.
         */

        /**
         * Collects definitions and documentation for project-wide configuration
         * values. The environment variable schema in `envVarDefinitions.json`
         * is extensible. Extensions are often configurable, and they can
         * integrate their configuration with the project-wide environment
         * variables system by tapping `envVarDefinitions`.
         *
         * @type {webpack.SyncHook}
         * @param {envVarIntercept} callback
         *
         * @example <caption>Add config fields for your extension</caption>
         * targets.of('@magento/pwa-buildpack').envVarDefinitions.tap(defs => {
         *   defs.sections.push({
         *     name: 'My Extension Settings',
         *     variables: [
         *       {
         *         name: 'MY_EXTENSION_API_KEY',
         *         type: 'str',
         *         desc: 'API key for remote service access.'
         *       }
         *     ]
         *   })
         * });
         *
         */
        envVarDefinitions: new targets.types.Sync(['definitions']),

        /**
         * @callback wrapModuleIntercept
         * @param {WrapLoaderConfig} wrappers - Wrapper configuration API to
         *   register wrapper functions on the module files they should wrap.
         * @returns {WrapLoaderConfig} - Interceptors must return a config
         *   object, either by modifying and returning the argument or by
         *   generating a new one.
         */

        /**
         * Collects requests to intercept and "wrap" individual JavaScript
         * module files in decorator functions. With `wrapEsModules` an
         * extension can enhance or modify the behavior of any other file in
         * the project. **This is a very low-level extension point; it should
         * be used as a building block for higher-level extensions that expose
         * functional areas rather than files on disk.**
         *
         * @type {webpack.SyncWaterfallHook}
         * @param {wrapModuleIntercept}
         *
         * @example <caption>Increment a number exported by some file.</caption>
         * targets.of('@magento/pwa-buildpack').wrapEsModules.tap(wrappers => {
         *   wrappers
         *     .getWrappersForExport('@other-module/path/to/someFile', 'answer')
         *     .add('./targets/decorators/increment.js')
         * })
         */
        wrapEsModules: new targets.types.SyncWaterfall(['wrapRequests']),

        /**
         * @callback webpackCompilerIntercept
         * @param {webpack.Compiler} compiler - The Webpack compiler instance
         * @returns {undefined} - Intereptors do not need to return.
         */

        /**
         *
         * Calls interceptors whenever a Webpack Compiler object is created.
         * This almost always happens once per build, even in dev mode.
         *
         * @type {webpack.SyncHook}
         * @param {webpackCompilerIntercept} callack
         */
        webpackCompiler: new targets.types.Sync(['compiler']),

        /**
         * @callback specialFeaturesIntercept
         * @param {Object.<string, SpecialBuildFlags>}
         * @returns {undefined} - Interceptors do no need to return.
         */

        /**
         * Collects flags for special build features that dependency packages
         * want to use. If your extension uses ES Modules instead of CommonJS in
         * its frontend code (as most should), Webpack will not parse and build
         * the modules by default; it will expect extension code to be CommonJS
         * style and will not process the ES Modules.
         *
         * @example <caption>Declare that your extension contains CSS modules.</caption>
         * targets.of('@magento/pwa-buildpack').specialFeatures.tap(special => {
         *   specialFeatures['my-module'] = { cssModules: true };
         * })
         *
         *
         * @see {@link configureWebpack}
         * @type {webpack.SyncHook}
         */
        specialFeatures: new targets.types.Sync(['special'])
    });
};
