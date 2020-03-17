const { inspect } = require('util');

const inspectable = {
    [inspect.custom](depth, options) {
        if (depth < 0) {
            return options.stylize(this.toString(), 'special');
        }
        return this;
    },
    toString() {
        return `${this.type}<${this.id}>`;
    }
};

const liveMethods = {
    toJSON() {
        const json = Object.create(inspectable);
        json.type = this.constructor.name;
        json.id = this._ensureIdentifier();
        if (this._parent) {
            json.parent = this._parent.toJSON();
        }
        return json;
    },
    track(...args) {
        if (!this._out) {
            throw new Error(
                'Trackable must be initialized with tracker.identify'
            );
        }
        return this._out(this.toJSON(), ...args);
    }
};

const deadMethods = {
    toJSON() {},
    track() {}
};

class Trackable {
    static enableTracking() {
        Object.assign(Trackable.prototype, liveMethods);
    }
    static disableTracking() {
        Object.assign(Trackable.prototype, deadMethods);
    }
    _ensureIdentifier() {
        if (!this.hasOwnProperty('_identifier')) {
            throw new Error(
                'Trackable must be initialized with tracker.identify'
            );
        }
        return this._identifier;
    }
    identify(identifier, owner) {
        this._identifier = identifier;
        if (owner instanceof Trackable) {
            this._parent = owner;
            this._out = (...args) => this._parent._out(...args);
        } else {
            this._out = owner;
        }
    }
}

Trackable.disableTracking();

module.exports = Trackable;
