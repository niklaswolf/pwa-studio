/**
 * @module Buildpack/WebpackTools
 */
const { inspect } = require('util');

/**
 * @typedef {Set} WrapperModulePaths
 * A Set of string paths for the decorator functions which will be applied to
 * a particular exported value of a particular file.
 */

/**
 * @typedef {Object.<string, WrapperModulePaths>} FileExportWrappers
 * A map of export names to WrapperModulePath sets for a particular file. Wrap
 * the default export by setting `defaultExport`.
 */

/**
 * @typedef {Object.<string, FileExportWrappers>} WrapLoaderConfigSerialized
 * A map of filenames of modules to be wrapped, to FileExportWrappers declaring
 * which exports of those modules will be wrapped with what.
 */

/**
 * Configuration facade that constructs a map of maps of sets. The structure
 * goes like this:
 *
 * Configuration is an object of wrappable filenames to FileExportWrappers.
 * FileExportWrapper is an object of export names (or 'defaultExport') to
 * WrapperModulePaths.
 * WrapperModulePaths is a Set of
 * which will be applied to that exported value.
 *
 */
class WrapLoaderConfig {
    /**
     *
     * @param {(WrapLoaderConfig | Object)} [passedConfig] - Another instance
     *   to clone
     */
    constructor(passedConfig) {
        if (passedConfig === undefined) {
            this._setsForExports = Object.create(null);
        } else if (passedConfig instanceof WrapLoaderConfig) {
            this._setsForExports = passedConfig._setsForExports;
        } else {
            throw new Error(
                `A WrapLoaderConfig can only be constructed from another WrapLoaderConfig or from nothing, but the passed argument was: ${inspect(
                    passedConfig
                )}`
            );
        }
    }
    _ensureOn(obj, name, Thing) {
        let prop = obj[name];
        if (!(name in obj)) {
            prop = new Thing();
            obj[name] = prop;
        }
        return prop;
    }
    /**
     * Get the configuration object which maps named exports of a particular
     *   file to lists of decorator file paths.
     *
     * @param {string} modulePath - The module to be wrapped
     * @param {string} exportName - The named export to be wrapped, or `defaultExport`
     * @returns {FileExportWrapper}
     * @memberof WrapLoaderConfig
     */
    getWrappersForExport(modulePath, exportName) {
        return this._ensureOn(
            this._ensureOn(this._setsForExports, modulePath, Object),
            exportName,
            Set
        );
    }
    /**
     * Emit the entire configuration as JSON. Cast the Sets to Arrays and build
     * a hierarchical object.
     */
    toLoaderOptions() {
        const wrap = {};
        for (const [modulePath, setForExport] of Object.entries(
            this._setsForExports
        )) {
            wrap[modulePath] = {};
            for (const [exportName, wrappers] of Object.entries(setForExport)) {
                wrap[modulePath][exportName] = [...wrappers];
            }
        }
        return { wrap };
    }
}

module.exports = WrapLoaderConfig;
