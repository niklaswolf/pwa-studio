/**
 * @module Buildpack/WebpackTools
 */
const WrapLoaderConfig = require('../WrapLoaderConfig');

/**
 * Create a Webpack
 * [module rules object](https://webpack.js.org/configuration/module/#rule) for
 * processing all the filetypes that the project will contain.
 *
 * @param {Buildpack/WebpackTools~WebpackConfigHelper} helper
 * @returns {Object[]} Array of Webpack rules.
 */
function getModuleRules(helper) {
    return [
        getModuleRules.graphql(helper),
        getModuleRules.js(helper),
        getModuleRules.css(helper),
        getModuleRules.files(helper)
    ];
}

/**
 * @param {Buildpack/WebpackTools~WebpackConfigHelper} helper
 * @returns Rule object for Webpack `module` configuration which parses
 *   `.graphql` files
 */
getModuleRules.graphql = ({ paths, hasFlag }) => ({
    test: /\.graphql$/,
    include: [paths.src, ...hasFlag('graphqlQueries')],
    use: [
        {
            loader: 'graphql-tag/loader'
        }
    ]
});

/**
 * @param {Buildpack/WebpackTools~WebpackConfigHelper} helper
 * @returns Rule object for Webpack `module` configuration which parses
 *   JavaScript files
 */
getModuleRules.js = ({ mode, paths, hasFlag, babelRootMode, bus }) => ({
    test: /\.(mjs|js|jsx)$/,
    include: [paths.src, ...hasFlag('esModules')],
    sideEffects: false,
    use: [
        {
            loader: 'babel-loader',
            options: {
                envName: mode,
                root: paths.root,
                rootMode: babelRootMode
            }
        },
        {
            loader: 'wrap-esm-loader',
            options: bus
                .getTargetsOf('@magento/pwa-buildpack')
                .wrapEsModules.call(new WrapLoaderConfig())
                .toLoaderOptions()
        }
    ]
});

/**
 * @param {Buildpack/WebpackTools~WebpackConfigHelper} helper
 * @returns Rule object for Webpack `module` configuration which parses
 *   CSS files
 */
getModuleRules.css = ({ paths, hasFlag }) => ({
    test: /\.css$/,
    oneOf: [
        {
            test: [paths.src, ...hasFlag('cssModules')],
            use: [
                'style-loader',
                {
                    loader: 'css-loader',
                    options: {
                        localIdentName: '[name]-[local]-[hash:base64:3]',
                        modules: true
                    }
                }
            ]
        },
        {
            include: /node_modules/,
            use: [
                'style-loader',
                {
                    loader: 'css-loader',
                    options: {
                        modules: false
                    }
                }
            ]
        }
    ]
});

/**
 * @param {Buildpack/WebpackTools~WebpackConfigHelper} helper
 * @returns Rule object for Webpack `module` configuration which parses
 *   and inlines binary files below a certain size
 */
getModuleRules.files = () => ({
    test: /\.(jpg|svg|png)$/,
    use: [
        {
            loader: 'file-loader',
            options: {
                name: '[name]-[hash:base58:3].[ext]'
            }
        }
    ]
});

module.exports = getModuleRules;
