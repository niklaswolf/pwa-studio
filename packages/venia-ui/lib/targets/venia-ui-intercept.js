const path = require('path');
const loader = require.resolve('./rendererCollectionLoader');

/**
 * TODO: This code intercepts the Webpack module for a specific file in this
 * package. That will be a common enough pattern that it should be turned into
 * a utility function.
 */

// Guard condition for detecting the actual module we want to change.
const isRCR = mod =>
    mod.resource ===
    path.resolve(
        __dirname,
        '../components/RichContent/richContentRenderers.js'
    );

// Webpack can process loaders best when each one has a unique identity.
// We use thie filename, since there should only be one of these loaders
// per compilation.
const ident = __filename;

const name = '@magento/venia-ui';

// Guard condition for whether the loader has already been installed.
const loaderIsInstalled = mod => mod.loaders.some(l => l.ident === ident);

module.exports = targets => {
    const { richContentRenderers } = targets.own;
    richContentRenderers.tap(api =>
        api.add({
            componentName: 'PlainHtmlRenderer',
            importPath: './plainHtmlRenderer'
        })
    );

    const builtins = targets.of('@magento/pwa-buildpack');

    builtins.specialFeatures.tap(featuresByModule => {
        featuresByModule['@magento/venia-ui'] = {
            cssModules: true,
            esModules: true,
            graphqlQueries: true,
            rootComponents: true,
            upward: true
        };
    });

    builtins.webpackCompiler.tap(compiler =>
        compiler.hooks.compilation.tap(name, compilation =>
            compilation.hooks.normalModuleLoader.tap(
                name,
                (loaderContext, mod) => {
                    if (isRCR(mod) && !loaderIsInstalled(mod)) {
                        const renderers = [];
                        const api = {
                            add(renderer) {
                                renderers.push(renderer);
                            }
                        };
                        richContentRenderers.call(api);
                        mod.loaders.push({
                            ident: ident,
                            loader,
                            options: {
                                renderers: renderers.reverse()
                            }
                        });
                    }
                }
            )
        )
    );
};
