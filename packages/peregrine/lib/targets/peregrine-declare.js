/**
 * These targets are available for interception to modules which depend on `@magento/peregrine`.
 *
 * Their implementations are found in `./peregrine-intercept.js`.
 */
module.exports = targets => {
    targets.declare({
        /**
         * @callback talonIntercept
         * @param {Peregrine/Targets.TalonWrapperConfig} talons - Registry of talon namespaces, talons, and Sets of interceptors
         * @returns {undefined} - Interceptors of `talons` should add to the
         * sets on passed TalonWrapperConfig instance. Any returned value will
         * be ignored.
         */

        /**
         * Collects requests to intercept and "wrap" individual Peregrine
         * talons in decorator functions. Use it to add your own code to run
         * when Peregrine talons are invoked, and/or to modify the behavior and
         * output of those talons.
         *
         * This target is a convenience wrapper around the
         * `@magento/pwa-buildpack` target `wrapEsModules`. That target uses
         * filenames, which are not guaranteed to be semantically versioned.
         * This target publishes talons as functions to wrap, rather than as
         * files to decorate.
         *
         * @type {webpack.SyncHook}
         * @param {talonIntercept}
         *
         * @example <caption>Increment a number exported by some file.</caption>
         * targets.of('@magento/pwa-buildpack').wrapEsModules.tap(wrappers => {
         *   wrappers
         *     .getWrappersForExport('@other-module/path/to/someFile', 'answer')
         *     .add('./targets/decorators/increment.js')
         * })
         */
        talons: new targets.types.Sync(['talons'])
    });
};
