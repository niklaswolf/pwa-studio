/**
 * @module Buildpack/BuildBus
 */

const path = require('path');
const pertain = require('pertain');
const TargetProvider = require('./TargetProvider');
const Trackable = require('./Trackable');

/**
 * @ignore
 * A given project root (context) should always produce the same bus, so we can
 * cache the heavy pertain operation.
 */
const busCache = new Map();

/**
 * @ignore
 * A way to strongly encourage users to use the BuildBus.for factory and not the
 * BuildBus constructor.
 */
const INVOKE_FLAG = Symbol.for('FORCE_BUILDBUS_CREATE_FACTORY');

/**
 * Broker for dependencies with Targets to interact with each other.
 *
 * @example <caption>Get or create the BuildBus for the package.json file in `./project-dir`, then bind targets, then call a target.</caption>
 * const bus = BuildBus.for('./project-dir);
 * bus.init();
 * bus.getTargetsOf('my-extension').myTarget.call();
 *
 * @class BuildBus
 * @extends {Trackable}
 */
class BuildBus extends Trackable {
    /**
     * Remove the cached BuildBus for the given context.
     *
     * @static
     * @hideconstructor
     * @param {string} context
     * @memberof BuildBus
     */
    static clear(context) {
        const absContext = path.resolve(context);
        busCache.delete(absContext);
    }
    /**
     * Remove all cached BuildBus objects.
     *
     * @static
     * @memberof BuildBus
     */
    static clearAll() {
        busCache.clear();
    }
    /**
     * Get or create the BuildBus for the given context.
     * This factory is the supported way to construct BuildBuses.
     * It caches BuildBuses and connects them to the logging infrastructure.
     *
     * @static
     * @param {string} context
     * @returns {BuildBus}
     * @memberof BuildBus
     */
    static for(context) {
        const absContext = path.resolve(context);
        if (busCache.has(absContext)) {
            return busCache.get(absContext);
        }
        const bus = new BuildBus(INVOKE_FLAG, absContext);
        busCache.set(absContext, bus);
        bus.identify(context, console.log); //usually replaced w/ webpack logger
        return bus;
    }
    /**
     * @hideconstructor
     */
    constructor(invoker, context) {
        super();
        if (invoker !== INVOKE_FLAG) {
            throw new Error(
                `BuildBus must not be created with its constructor. Use the static factory method BuildBus.for(context) instead.`
            );
        }
        this._requestTargets = this._requestTargets.bind(this);
        this._hasRun = {};
        this.context = context;
        this.targetProviders = new Map();
        this._getEnvOverrides();
    }
    _getEnvOverrides() {
        const envDepsAdditional = process.env.BUILDBUS_DEPS_ADDITIONAL;
        this._depsAdditional = envDepsAdditional
            ? envDepsAdditional.split(',')
            : [];
    }
    _getPertaining(phase) {
        return pertain(this.context, this._phaseToSubject(phase), foundDeps =>
            foundDeps.concat(this._depsAdditional)
        ).map(dep => ({
            name: dep.name,
            [phase]: require(dep.path)
        }));
    }
    _getTargets(depName) {
        const targetProvider = this.targetProviders.get(depName);
        if (!targetProvider) {
            throw new Error(
                `${
                    this._identifier
                }: Cannot getTargetsOf("${depName}"): ${depName} has not yet declared`
            );
        }
        return targetProvider;
    }
    _phaseToSubject(phase) {
        return `pwa-studio.targets.${phase}`;
    }
    _requestTargets(requestor, requested) {
        const source = requestor.name;
        this.track('requestTargets', { source, requested });

        const targets = {};
        const targetProvider = this._getTargets(requested);
        for (const [name, tapable] of Object.entries(
            targetProvider._tapables
        )) {
            targets[name] = targetProvider._linkTarget(source, name, tapable);
        }
        return targets;
    }
    /**
     * Get {@link module:Buildpack/BuildBus/TargetProvider TargetProvider} for
     * the given named dependency.
     * Use this to retrieve and run targets in top-level code, when you have
     * a reference to the BuildBus.
     * Declare and intercept functions should not, and cannot, use this method.
     * Instead, they retrieve external targets through their `targets.of()`
     * methods.
     *
     * @param {string} depName
     * @returns {module:Buildpack/BuildBus/TargetProvider}
     * @memberof BuildBus
     */
    getTargetsOf(depName) {
        return this._getTargets(depName).own;
    }
    /**
     * Run the two defined phases, `declare` and `intercept`, in order.
     * This binds all targets which the BuildBus can find by analyzing
     * dependencies in the project package file..
     *
     * @chainable
     * @memberof BuildBus
     */
    init() {
        this.runPhase('declare');
        this.runPhase('intercept');
        return this;
    }
    /**
     * Run the specified phase. The BuildBus finds all dependencies which say
     * in their `package.json` that they need to run code in this phase.
     *
     * @example <caption>Find all dependencies whith have `pwa-studio: { targets: { declare: './path/to/js' }} defined, and run those functions.
     * bus.runPhase('declare')
     *
     * @param {string} phase 'declare' or 'intercept'
     * @memberof BuildBus
     */
    runPhase(phase) {
        if (this._hasRun[phase]) {
            return;
        }
        this._hasRun[phase] = true;
        this.track('runPhase', { phase });
        const pertaining = this._getPertaining(phase);
        pertaining.forEach(dep => {
            let targetProvider = this.targetProviders.get(dep.name);
            if (!targetProvider) {
                targetProvider = new TargetProvider(
                    this,
                    dep,
                    this._requestTargets
                );
                this.targetProviders.set(dep.name, targetProvider);
            }
            targetProvider.phase = phase;
            this.track('requireDep', { phase, dep });
            dep[phase](targetProvider);
            targetProvider.phase = null;
        });
    }
}

module.exports = BuildBus;
