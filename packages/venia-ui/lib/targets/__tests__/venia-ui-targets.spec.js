const React = require('react');
const {
    mockBuildBus,
    buildModuleWith
} = require('@magento/pwa-buildpack/lib/testHelpers');
import { createTestInstance } from '@magento/peregrine';
const declare = require('../venia-ui-declare');
const intercept = require('../venia-ui-intercept');

const thisDep = {
    name: '@magento/venia-ui',
    declare,
    intercept
};

test('declares a sync target richContentRenderers', () => {
    const bus = mockBuildBus({
        context: __dirname,
        dependencies: [thisDep]
    });
    bus.runPhase('declare');
    const targets = bus.getTargetsOf('@magento/venia-ui');
    expect(targets.richContentRenderers.tap).toBeDefined();
    const hook = jest.fn();
    // no implementation testing in declare phase
    targets.richContentRenderers.tap('test', hook);
    targets.richContentRenderers.call('woah');
    expect(hook).toHaveBeenCalledWith('woah');
});

test('uses RichContentRenderers to inject a default strategy into RichContent', async () => {
    const built = await buildModuleWith('../../components/RichContent', {
        context: __dirname,
        dependencies: ['@magento/peregrine', thisDep]
    });

    const RichContent = built.run();

    const wrapper = createTestInstance(<RichContent html="<h1>word up</h1>" />);
    expect(
        wrapper.root.find(c => c.type.name === 'PlainHtmlRenderer')
    ).toBeTruthy();
    expect(wrapper.toJSON()).toMatchSnapshot();
});
