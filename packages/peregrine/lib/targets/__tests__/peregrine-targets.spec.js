const {
    buildModuleWith,
    mockTargetProvider
} = require('@magento/pwa-buildpack/lib/testHelpers');
const declare = require('../peregrine-declare');
const intercept = require('../peregrine-intercept');

test('declares a sync target talons and intercepts wrapEsModules', () => {
    const targets = mockTargetProvider(
        '@magento/peregrine',
        (_, dep) =>
            ({
                '@magento/pwa-buildpack': {
                    specialFeatures: {
                        tap: jest.fn()
                    },
                    wrapEsModules: {
                        tap: jest.fn()
                    }
                }
            }[dep])
    );
    declare(targets);
    expect(targets.own.talons.tap).toBeDefined();
    const hook = jest.fn();
    // no implementation testing in declare phase
    targets.own.talons.tap('test', hook);
    targets.own.talons.call('woah');
    expect(hook).toHaveBeenCalledWith('woah');

    intercept(targets);
    const buildpackTargets = targets.of('@magento/pwa-buildpack');
    expect(buildpackTargets.wrapEsModules.tap).toHaveBeenCalled();
});

test('enables third parties to wrap talons', async () => {
    jest.setTimeout(10000); // sorry, buildModuleWith is slow
    const talonIntegratingDep = {
        name: 'goose-app',
        declare() {},
        intercept(targets) {
            targets.of('@magento/peregrine').talons.tap(talons => {
                talons.ProductFullDetail.useProductFullDetail.add(
                    'src/usePFDIntercept'
                );
                talons.App.useApp.add('src/useAppIntercept');
                talons.App.useApp.add('src/swedish');
            });
        }
    };
    const built = await buildModuleWith('src/index.js', {
        context: __dirname,
        dependencies: [
            {
                name: '@magento/peregrine',
                declare,
                intercept
            },
            talonIntegratingDep
        ],
        mockFiles: {
            'src/index.js': `
 import { useApp } from '@magento/peregrine/lib/talons/App/useApp';
 import { useProductFullDetail } from '@magento/peregrine/lib/talons/ProductFullDetail/useProductFullDetail';
 export default useApp() + useProductFullDetail()`,
            'src/usePFDIntercept': `export default function usePFDIntercept(original) { return function usePFD() { return 'BEEP >o'; } };`,
            'src/useAppIntercept': `export default function useAppIntercept(original) {
     return function useApp() {
         return 'o< HONK';
     };
 }
 `,
            'src/swedish': `export default function swedish(impl) {
    return function() {
        return impl().replace("O", "Ö")
    }
}`
        }
    });

    expect(built.run()).toBe('o< HÖNKBEEP >o');
});
