/**
 * @module Buildpack/TestHelpers
 */
const mustMock = [
    ['emitWarning', jest.fn()],
    ['emitError', jest.fn()],
    ['addDependency', jest.fn()]
];

/**
 * Test a Webpack loader by simulating Webpack calling it with source code.
 *
 * @async
 * @param {Function} loader - The loader function to test.
 * @param {string} content - Source code to be transformed and/or analyzed.
 * @param {Object} contextValues - Values to use to populate the Webpack
 *   `loaderContext`, the `this` object available in loaders.
 * @returns Output of the loader.
 */
async function runLoader(loader, content, contextValues) {
    return new Promise((res, rej) => {
        let mustReturnSync = true;
        const callback = (err, output) => {
            mustReturnSync = false;
            if (err) {
                rej(err);
            } else {
                res({ context, output });
            }
        };

        const context = Object.assign(
            {
                callback,
                async() {
                    mustReturnSync = false;
                    return callback;
                }
            },
            contextValues
        );
        for (const [method, mock] of mustMock) {
            if (typeof context[method] !== 'function') {
                context[method] = mock;
                mock.mockClear();
            }
        }
        const output = loader.call(context, content);
        if (mustReturnSync) {
            res({ context, output });
        }
    });
}

module.exports = { runLoader };
