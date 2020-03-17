/**
 * Helpers for testing PWA Studio extensions and projects.
 * @module Buildpack/TestHelpers
 */

module.exports = {
    ...require('./testWebpackCompiler'),
    ...require('./evaluateScripts'),
    ...require('./testWebpackLoader'),
    ...require('./testFullBuild'),
    ...require('./testTargets')
};
