const path = require('path');
const WrapLoaderConfig = require('@magento/pwa-buildpack/lib/WebpackTools/WrapLoaderConfig');

/**
 *
 *
 * @class TalonWrapperConfig
 * @extends {WrapLoaderConfig}
 * @hideconstructor
 */
class TalonWrapperConfig extends WrapLoaderConfig {
    /**
     * @private
     */
    _provideSet(modulePath, ...rest) {
        return super._provideSet(
            path.resolve(__dirname, '../talons/', modulePath),
            ...rest
        );
    }
    get ProductFullDetail() {
        return {
            /**
             * @type {Set}
             * Paths to all the interceptors that will wrap the `ProductFullDetail/useProductFullDetail`
             * talon. They will execute in order as a composed function.
             *
             * @readonly
             * @memberof TalonWrapperConfig.ProductFullDetail
             */
            useProductFullDetail: this._provideSet(
                'ProductFullDetail/useProductFullDetail.js',
                'useProductFullDetail'
            )
        };
    }
    get App() {
        return {
            /**
             * @type {Set}
             * Paths to all the interceptors that will wrap the `useApp` talon. They
             * will execute in order as a composed function.
             *
             * @readonly
             * @memberof TalonWrapperConfig.App
             */
            useApp: this._provideSet('App/useApp.js', 'useApp')
        };
    }
}

module.exports = targets => {
    const builtins = targets.of('@magento/pwa-buildpack');

    builtins.specialFeatures.tap(featuresByModule => {
        featuresByModule['@magento/peregrine'] = {
            cssModules: true,
            esModules: true,
            graphQlQueries: true
        };
    });

    builtins.wrapEsModules.tap(wrapConfig => {
        const talonWrapperConfig = new TalonWrapperConfig(wrapConfig);
        targets.own.talons.call(talonWrapperConfig);
        return wrapConfig;
    });
};
