/**
 * These targets are available for interception to modules which depend on `@magento/peregrine`.
 *
 * Their implementations are found in `./peregrine-intercept.js`.
 */
module.exports = targets => {
    targets.declare({
        /**
         * Convenience API for running the Buildpack `wrapEsModules` target on
         * Peregrine talons.
         */
        talons: new targets.types.Sync(['talons'])
    });
};
