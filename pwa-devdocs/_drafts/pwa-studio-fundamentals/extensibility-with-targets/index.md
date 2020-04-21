---
title: Extensibility in PWA Studio with Targets
---

# Overview

Ever used a multi-bit screwdriver? Kinda weak, parts rust, kinda heavy.
What if you could 3D print a superstrong screwdriver of any type, instead of fiddling with switching bits while you worked?

That's the promise of **build-time extensibility** with PWA Studio.

# Quick Start



# Concepts

## Targets
Targets are Tapable Hooks. Hooks are a type of high-performance interceptor pattern, similar to event subscriptions, but with an API more specific to modifying or decorating the original functionality of the target.

We call them Targets because the term "Hook" is more common in React.

### Targets in PWA Studio
The components and tools in PWA Studio are loosely coupled with one other via Targets.
Objects like `envVarDefinitions`, the Webpack compiler, and many React components and hooks declare targets related to their functionality.
They **intercept** their own targets (see below) to implement that functionality, thereby "eating their own dog food".
Core components can therefore serve as examples of target-intercept code.
We can put targets nearly anywhere
Targets of backend and tooling code run during builds and other command line operations
Targets of frontend code also run during builds, using tools for code modification, sealing up customizations into the built PWA
Base targets in Buildpack are low-level
Other targets, like Peregrine talon targets, are higher-level APIs--under the hood, they utilize base Buildpack targets and Webpack hooks (which are targets!)
Most targets concern the build process, which uses Webpack
Webpack has its own rich system of targets, which it calls Hooks _(see above)_
Many interceptors use the Buildpack `webpackCompiler` target to bootstrap into Webpack world, and then write their Webpack customization code like any other Webpack plugin

### Using Targets

Targets provide a way for third-party code to enhance your PWA at build time, without you having to manually change your code and import the new stuff
Like Magento's XML dialects, targets let the different dependencies of your storefront detect each other, combine and merge functionality, all just from being installed in your vendor directory (node_modules)
PWA Studio finds and invokes this third-party code using the **BuildBus**

#### BuildBus
For every build, in dev, staging, and production, the Buildpack tools in your package scripts create a manager object called a BuildBus.
BuildBus is responsible for scanning installed dependencies, finding code that uses Targets, and running that code in an integrated pipeline
It reads every **top-level dependency** (declared in `package.json`, not transitive/deep) and looks for special BuildBus-specific declarations in that dependency
In `package.json`, add a custom key called `"pwa-studio"`. It should be an object with a property `"targets"`
(Note: The `"pwa-studio"` object may gain other special properties in later versions)
The `"targets"` property must be an object with a property `"intercept"`, and optionally, another property `"declare"`
Each property value must be a relative path to a JavaScript file that will run during that phase

```json
{
  "name": "my-pwa-extension",
  "version": "0.0.1",
  "pwa-studio": {
    "targets": {
      "declare": "lib/declareMyTargets.js",
      "intercept": "lib/interceptTargets.js"
    }
  }
}
```

If an NPM module has those BuildBus-specific declarations, then it is a PWA Studio extension
Those two properties `"declare"` and `"intercept"` refer to BuildBus **phases** (see below)

#### Declaring targets
To build an extension with targets, you must first declare those targets in the BuildBus `declare` phase, 
