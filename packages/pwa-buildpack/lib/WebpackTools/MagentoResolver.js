const fs = require('fs');
const { CachedInputFileSystem, ResolverFactory } = require('enhanced-resolve');

/**
 * @typedef {Object} CliOption
 * @property {string} name display name
 * @property {string} package npm package name
 * @property {string} binName name of the executable file
 * @property {string} alias shortcut for choice
 * @property {boolean} installed currently installed?
 * @property {boolean} recommended is recommended
 * @property {string} url homepage
 * @property {string} description description
 */

/** @typedef {import("webpack/declarations/WebpackOptions").ResolveOptions} WebpackResolveOptions */

/**
 * @typedef {Object} MagentoResolverOptions
 * @augments WebpackResolveOptions
 * @module MagentoResolver
 * @property {boolean} isEE Resolve Magento Commerce (`*.ee.js`) modules instead of Magento Open Source `*.ce.js` modules
 * @property {Object} paths Filesystem paths to resolve from
 */

class MagentoResolver {
    /**
     * Legacy method for returning Webpack `resolve` config options as before
     *
     * @deprecated Use `new MagentoResolver(options).config` instead
     * @static
     * @param {MagentoResolverOptions} options
     * @returns WebpackResolveOptions
     */
    static async configure(options) {
        const resolver = new MagentoResolver(options);
        return resolver.config;
    }
    /**
     *
     * Lazy loads an EnhancedResolver instance with a cached file system,
     * configured from our constructor options.
     *
     * @ignore
     * @private
     * @readonly
     */
    get myResolver() {
        if (!this._resolver) {
            this._resolver = ResolverFactory.createResolver({
                // Typical usage will consume the `fs` + `CachedInputFileSystem`, which wraps Node.js `fs` to add caching.
                fileSystem: new CachedInputFileSystem(fs, 4000),
                ...this.config
            });
        }
        return this._resolver;
    }
    /**
     * A MagentoResolver can asynchronously resolve `require` and `import`
     * strings the same way the built PWA will.
     * @param {MagentoResolverOptions} options
     */
    constructor(options) {
        const { isEE, paths, ...restOptions } = options;
        if (!paths || typeof paths.root !== 'string') {
            throw new Error(
                'new MagentoResolver(options) requires "options.paths.root" to be a string'
            );
        }
        const extensions = [
            '.wasm',
            '.mjs',
            isEE ? '.ee.js' : '.ce.js',
            '.js',
            '.jsx',
            '.json',
            '.graphql'
        ];
        /** @ignore */
        this._root = paths.root;

        /** @type {WebpackResolveOptions} */
        this.config = {
            alias: {},
            modules: [this._root, 'node_modules'],
            mainFiles: ['index'],
            mainFields: ['esnext', 'es2015', 'module', 'browser', 'main'],
            extensions,
            ...restOptions
        };
        /** @ignore */
        this._context = {};
        /** @ignore */
        this._requestContext = {};
    }
    /**
     *
     * @async
     * @param {string} request A module name or path, as in `require('<request>')` or `import foo from '<request>'`.
     * @returns {Promise<string>} Absolute filesystem location.
     */
    async resolve(request) {
        return new Promise((res, rej) => {
            try {
                this.myResolver.resolve(
                    this._context,
                    this._root,
                    request,
                    this._requestContext,
                    (err, filepath) => {
                        if (err) {
                            return rej(err);
                        }
                        res(filepath);
                    }
                );
            } catch (e) {
                rej(e);
            }
        });
    }
}

module.exports = MagentoResolver;
