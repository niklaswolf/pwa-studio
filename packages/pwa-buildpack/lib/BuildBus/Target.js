/**
 * Represents an edge on the graph, or a "route" between stops, created between
 * two extensions when one of them references the target(s) of another. When
 * extension Foo requests targets of extension Bar, the BuildBus provides an
 * Target instead of the literal Tapable instance. This enables
 * better logging, error checking, and validation.
 */
const Trackable = require('./Trackable');

const interceptionTypes = {
    tap: 'sync',
    tapAsync: 'async',
    tapPromise: 'promise'
};

class Target extends Trackable {
    constructor(owner, requestor, targetName, tapableType, tapable) {
        super();
        this._owner = owner;
        this._tapable = tapable;
        this._requestor = requestor;
        this.name = targetName;
        this.identify(`${targetName}[${tapableType}]`, this._owner);
    }
    _invokeTap(method, customName, tap) {
        let interceptor = tap;
        let source = this._requestor;
        if (interceptor) {
            // a custom name was passed!
            source = `${this._requestor}:${customName}`;
        } else {
            interceptor = customName;
        }
        this.track('intercept', { source, type: interceptionTypes[method] });
        return this._tapable[method](source, interceptor);
    }
    call(...args) {
        this.track('beforeCall', { type: 'sync', args });
        const returned = this._tapable.call(...args);
        this.track('afterCall', { type: 'sync', returned });
        return returned;
    }
    callAsync(...incomingArgs) {
        const callbackIndex = incomingArgs.length - 1;
        const callback = incomingArgs[callbackIndex];
        const args = incomingArgs.slice(0, callbackIndex);
        this.track('beforeCall', { type: 'async', args });
        args.push((...returned) => {
            this.track('afterCall', { type: 'async', returned });
            callback(...returned);
        });
        return this._tapable.callAsync(...args);
    }
    intercept(options) {
        this.track('intercept', {
            type: 'intercept',
            source: this._requestor,
            options
        });
        return this._tapable.intercept(options);
    }
    promise(...args) {
        this.track('beforeCall', { type: 'promise', args });
        return this._tapable.promise(...args).then(returned => {
            this.track('afterCall', { type: 'promise', returned });
            return returned;
        });
    }
    tap(name, interceptor) {
        return this._invokeTap('tap', name, interceptor);
    }
    tapAsync(name, interceptor) {
        return this._invokeTap('tapAsync', name, interceptor);
    }
    tapPromise(name, interceptor) {
        return this._invokeTap('tapPromise', name, interceptor);
    }
    toJSON() {
        const json = super.toJSON();
        if (json) {
            json.requestor = this._requestor;
        }
        return json;
    }
}

Target.External = class ExternalTarget extends Target {
    _throwOnExternalInvoke(method) {
        throw new Error(
            `${this._requestor} ran targets.of("${this._owner.name}").${
                this.name
            }.${method}(). Only ${
                this._owner.name
            } can invoke its own targets. ${
                this._requestor
            } can only intercept them.`
        );
    }
    call() {
        this._throwOnExternalInvoke('call');
    }
    callAsync() {
        this._throwOnExternalInvoke('callAsync');
    }
    promise() {
        this._throwOnExternalInvoke('promise');
    }
};

module.exports = Target;
