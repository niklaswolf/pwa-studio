/**
 * Helper functions for running extension targets in tests.
 * @module Buildpack/TestHelpers/Targets
 */
const TargetProvider = require('../BuildBus/TargetProvider');
const BuildBus = require('../BuildBus/BuildBus');
const { ExplicitDependency, resolver } = require('pertain');

/** @ignore */
const unimplementedTargetFac = (requestor, requestedName) => {
    throw new Error(`${requestor.constructor.name} received request from "${
        requestor.name
    }" for external targets "${requestedName}", but no function was supplied for getting external targets.

    More details at https://twitter.com/JamesZetlen/status/1244680319267147783`);
};

/**
 * An object representing a dependency with targets that participates in a
 * build.
 * @typedef {Object} MockDependency
 * @property {string} name - Module name of the dependency.
 * @property {Function} declare - Declare function which will receive the simulated target provider.
 * @property {Function} intercept - Intercept function which will receive the simulated target provider.
 */

/**
 * Create a {@link TargetProvider} not bound to a {@link BuildBus}, for testing
 * declare and intercept functions in isolation.
 *
 * @param {string} name
 * @param {Function} [getExternalTargets] Function that returns any
 *   external TargetProviders. To test with an intercept function, which almost
 *   certainly will use external TargetProviders, you must supply a function
 *   here that returns them.
 * @param {Function} [loggingParent=() => {}] Will be called with detailed logging information.
 * @returns {TargetProvider}
 */
function mockTargetProvider(
    name,
    getExternalTargets = unimplementedTargetFac,
    loggingParent = () => {}
) {
    return new TargetProvider(loggingParent, name, getExternalTargets);
}

const INVOKE_FLAG = Symbol.for('FORCE_BUILDBUS_CREATE_FACTORY');
/**
 * A mock BuildBus for testing target integrations. Instead of using the local
 * `package.json` to detect and order the pertaining dependencies, this takes
 * a set of pre-ordered dependencies that can include "virtual dependency"
 * objects.
 *
 * @class MockBuildBus
 * @extends {BuildBus}
 */
class MockBuildBus extends BuildBus {
    /** ignore */
    static clear() {
        throw new Error(
            'MockBuildBus.clear() not supported. More details at https://twitter.com/JamesZetlen/status/1244683087839137792'
        );
    }
    /** ignore */
    static clearAll() {
        throw new Error(
            'MockBuildBus.clearAll() not supported. More details at https://twitter.com/JamesZetlen/status/1244683087839137792'
        );
    }
    /** ignore */
    static for() {
        throw new Error(
            `MockBuildBus.for() not supported. To create a MockBuildBus, use mockBuildBus({ context, dependencies });

            More details at https://twitter.com/JamesZetlen/status/1244680322442280960`
        );
    }
    /** @hideconstructor */
    constructor(invoker, context, dependencies) {
        super(invoker, context);
        this._resolve = resolver(context);
        this._mockDependencies = dependencies;
    }
    _getEnvOverrides() {
        this._depsAdditional = [];
    }
    _getPertaining(phase) {
        /**
         * Always declare buildpack's base targets.
         * If the test declares Buildpack explicitly, don't declare it twice,
         * of course.
         */
        let buildpackDeclared = false;
        const pertaining = [];
        const addPertaining = dep => {
            if (dep.name === '@magento/pwa-buildpack') {
                buildpackDeclared = true;
            }
            pertaining.push(dep);
        };

        this._mockDependencies.forEach((dep, i) => {
            if (typeof dep === 'string') {
                const modulePath = this._resolve(dep);
                if (!modulePath) {
                    throw new Error(
                        `Dependency at index [${i}] is a string "${dep}", indicating a real node_module, but it could not be resolved as a node_module.`
                    );
                }
                const dependency = new ExplicitDependency(modulePath);
                const pertainingScript = dependency.pertains(
                    this._phaseToSubject(phase)
                );
                if (pertainingScript) {
                    addPertaining({
                        name: dep,
                        [phase]: require(pertainingScript)
                    });
                }
            } else if (
                typeof dep === 'object' &&
                typeof dep.name === 'string'
            ) {
                if (typeof dep[phase] === 'function') {
                    addPertaining(dep);
                }
            } else {
                throw new Error(
                    `${dep} is not a valid dependency. Dependencies argued to MockBuildBus must be either the names of resolvable modules, or virtual dependencies (objects with a "name" string and "declare" and/or "intercept" functions).`
                );
            }
        });

        /** Ensure buildpack. */
        if (!buildpackDeclared) {
            pertaining.unshift({
                name: '@magento/pwa-buildpack',
                declare: require('../BuildBus/declare-base'),
                intercept: require('../BuildBus/intercept-base')
            });
        }
        return pertaining;
    }
    /**
     *
     * Get the names of the dependencies that were explicitly argued.
     * @returns string[]
     * @memberof MockBuildBus
     */
    getMockDependencyNames() {
        return this._mockDependencies.map(dep => dep.name || dep);
    }
}

/**
 *
 * Create a mock BuildBus for testing target integrations. Instead of using the
 * local `package.json` to detect and order the pertaining dependencies, this
 * takes a set of pre-ordered dependencies that can include "virtual
 * dependency" objects.
 *
 * You may supply string module names to use the on-disk dependencies, or `{
 * name, declare, intercept }` objects to act as "virtual dependencies".
 *
 * The modules will be run in the order supplied; therefore, if you're testing
 * your own targets, they should come last in the list.
 *
 * @param {Object} setup
 * @param {string} setup.context - Project root, the directory from which
 *   MockBuildBus will resolve any on-disk dependencies that are not mocked.
 * @param {Array.(string|MockDependency)} setup.dependencies - Dependencies to use. P
 * @returns {MockBuildBus}
 */
function mockBuildBus({ context, dependencies }) {
    return new MockBuildBus(INVOKE_FLAG, context, dependencies);
}

module.exports = {
    mockTargetProvider,
    mockBuildBus,
    MockBuildBus
};
