import React from 'react';
import { createTestInstance } from '@magento/peregrine';

import CompletedView from '../completedView';

jest.mock('../../../../classify');

test('it renders correctly', () => {
    // Act.
    const instance = createTestInstance(
        <CompletedView
            selectedShippingMethod={'flatrate|flatrate'}
            shippingMethods={[
                {
                    amount: {
                        currency: 'USD',
                        value: 99
                    },
                    available: true,
                    carrier_code: 'flatrate',
                    carrier_title: 'Flat Rate',
                    method_code: 'flatrate',
                    method_title: 'Flat Rate',
                    serializedValue: 'flatrate|flatrate'
                }
            ]}
            showUpdateMode={false}
        />
    );

    // Assert.
    expect(instance.toJSON()).toMatchSnapshot();
});

test('it renders an error when selectedShippingMethod is missing', () => {
    // Act.
    const instance = createTestInstance(
        <CompletedView
            selectedShippingMethod={null}
            shippingMethods={[
                {
                    amount: {
                        currency: 'USD',
                        value: 99
                    },
                    available: true,
                    carrier_code: 'flatrate',
                    carrier_title: 'Flat Rate',
                    method_code: 'flatrate',
                    method_title: 'Flat Rate',
                    serializedValue: 'flatrate|flatrate'
                }
            ]}
            showUpdateMode={false}
        />
    );

    // Assert.
    expect(instance.toJSON()).toMatchSnapshot();
});
