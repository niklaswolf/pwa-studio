import React from 'react';
import { useQuery, useApolloClient } from '@apollo/react-hooks';
import { useFormApi, useFormState } from 'informed';

import createTestInstance from '../../../../util/createTestInstance';
import { useCreditCard } from '../useCreditCard';

/**
 * Mock Functions
 */

const getAllCountriesQuery = 'getAllCountriesQuery';
const getBillingAddressQuery = 'getBillingAddressQuery';
const getIsBillingAddressSameQuery = 'getIsBillingAddressSameQuery';
const getPaymentNonceQuery = 'getPaymentNonceQuery';

const billingAddress = {
    firstName: '',
    lastName: '',
    country: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    postalCode: '',
    phoneNumber: ''
};
const billingAddressQueryResult = {
    data: {
        cart: {
            billingAddress: {
                __typename: '',
                ...billingAddress
            }
        }
    }
};
const isBillingAddressSameQueryResult = {
    data: { cart: { isBillingAddressSame: false } }
};
const getAllCountries = jest.fn().mockReturnValue({ data: { countries: {} } });
const getBillingAddress = jest.fn().mockReturnValue(billingAddressQueryResult);
const getIsBillingAddressSame = jest
    .fn()
    .mockReturnValue(isBillingAddressSameQueryResult);
const writeQuery = jest.fn();

const operations = {
    queries: {
        getAllCountriesQuery,
        getBillingAddressQuery,
        getIsBillingAddressSameQuery,
        getPaymentNonceQuery
    }
};

jest.mock('@apollo/react-hooks', () => {
    return { useQuery: jest.fn(), useApolloClient: jest.fn() };
});

jest.mock('../../../../context/cart', () => ({
    useCartContext: jest.fn().mockReturnValue([{ cartId: '123' }])
}));

jest.mock('informed', () => ({
    useFormState: jest.fn().mockReturnValue({
        values: {
            isBillingAddressSame: false,
            firstName: '',
            lastName: '',
            country: '',
            street1: '',
            street2: '',
            city: '',
            state: '',
            postalCode: '',
            phoneNumber: ''
        }
    }),
    useFormApi: jest.fn().mockReturnValue({
        setValue: () => {},
        setValues: () => {}
    })
}));

beforeAll(() => {
    useQuery.mockImplementation(query => {
        if (query === getAllCountriesQuery) {
            return getAllCountries();
        } else if (query === getBillingAddressQuery) {
            return getBillingAddress();
        } else if (query === getIsBillingAddressSameQuery) {
            return getIsBillingAddressSame();
        } else {
            return { data: {} };
        }
    });

    useApolloClient.mockReturnValue({
        writeQuery
    });
});

const Component = props => {
    const talonProps = useCreditCard(props);

    return <i talonProps={talonProps} />;
};

const getTalonProps = props => {
    const tree = createTestInstance(<Component {...props} />);
    const { root } = tree;
    const { talonProps } = root.findByType('i').props;

    const update = newProps => {
        tree.update(<Component {...{ ...props, ...newProps }} />);

        return talonProps;
    };

    return { talonProps, tree, update };
};

/**
 * Tests
 */

test('Snapshot test', () => {
    const { talonProps } = getTalonProps({
        operations,
        isHidden: false,
        onSuccess: () => {},
        onReady: () => {},
        onError: () => {}
    });

    expect(talonProps).toMatchSnapshot();
});

test('Shuold call onReady when payment is ready', () => {
    const onReady = jest.fn();
    const { talonProps } = getTalonProps({
        operations,
        isHidden: false,
        onSuccess: () => {},
        onReady,
        onError: () => {}
    });

    talonProps.onPaymentReady();

    expect(onReady).toHaveBeenCalled();
});

test('Shuold call onError when payment nonce generation errored out', () => {
    const error = 'payment error';
    const onError = jest.fn();
    const { talonProps } = getTalonProps({
        operations,
        isHidden: false,
        onSuccess: () => {},
        onError,
        onReady: () => {}
    });

    talonProps.onPaymentError(error);

    expect(onError).toHaveBeenCalledWith(error);
});

describe('Testing UI restoration', () => {
    const setValue = jest.fn();
    const setValues = jest.fn();

    beforeEach(() => {
        useFormApi.mockReturnValue({
            setValue,
            setValues
        });
    });

    test('UI fields should not be restored if payment method is hidden', () => {
        const { update } = getTalonProps({
            operations,
            isHidden: true,
            onSuccess: () => {},
            onReady: () => {},
            onError: () => {}
        });

        expect(setValue).not.toHaveBeenCalledWith(
            'isBillingAddressSame',
            false
        );
        expect(setValues).not.toHaveBeenCalledWith(billingAddress);
        expect(setValue).toHaveBeenCalledTimes(0);
        expect(setValues).toHaveBeenCalledTimes(0);

        update();

        expect(setValue).not.toHaveBeenCalledWith(
            'isBillingAddressSame',
            false
        );
        expect(setValues).not.toHaveBeenCalledWith(billingAddress);
        expect(setValue).toHaveBeenCalledTimes(0);
        expect(setValues).toHaveBeenCalledTimes(0);
    });

    test('UI fields should be restored if payment is not hidden and is ready, only once', () => {
        const { talonProps, update } = getTalonProps({
            operations,
            isHidden: false,
            onSuccess: () => {},
            onReady: () => {},
            onError: () => {}
        });

        /**
         * Payment is not ready yet, UI restoration should not happen.
         */

        expect(setValue).not.toHaveBeenCalledWith(
            'isBillingAddressSame',
            false
        );
        expect(setValues).not.toHaveBeenCalledWith(billingAddress);
        expect(setValue).toHaveBeenCalledTimes(0);
        expect(setValues).toHaveBeenCalledTimes(0);

        talonProps.onPaymentReady();

        /**
         * Updating the first time after payment ready. Should perform
         * UI restoration.
         */

        update();

        expect(setValue).toHaveBeenCalledWith('isBillingAddressSame', false);
        expect(setValues).toHaveBeenCalledWith(billingAddress);
        expect(setValue).toHaveBeenCalledTimes(1);
        expect(setValues).toHaveBeenCalledTimes(1);

        /**
         * Updating again should not perform UI restoration.
         */

        update();

        expect(setValue).toHaveBeenCalledTimes(1);
        expect(setValues).toHaveBeenCalledTimes(1);
    });

    test('billingAddress should not be restored if it is null or undefined', () => {
        const billingAddressQueryResult = {
            data: {
                cart: {
                    billingAddress: null
                }
            }
        };

        getBillingAddress
            .mockReturnValueOnce(billingAddressQueryResult)
            .mockReturnValueOnce(billingAddressQueryResult);

        const { talonProps, update } = getTalonProps({
            operations,
            isHidden: false,
            onSuccess: () => {},
            onReady: () => {},
            onError: () => {}
        });

        talonProps.onPaymentReady();

        update();

        expect(setValue).toHaveBeenCalledWith('isBillingAddressSame', false);
        expect(setValues).not.toHaveBeenCalled();
    });

    test('UI fields should be restored everytime the payment method is shown after being hidden', () => {
        const { talonProps, update } = getTalonProps({
            operations,
            isHidden: false,
            onSuccess: () => {},
            onReady: () => {},
            onError: () => {}
        });

        /**
         * Payment method ready and component is not hidden.
         */

        talonProps.onPaymentReady();

        update();

        expect(setValue).toHaveBeenCalledWith('isBillingAddressSame', false);
        expect(setValues).toHaveBeenCalledWith(billingAddress);
        expect(setValue).toHaveBeenCalledTimes(1);
        expect(setValues).toHaveBeenCalledTimes(1);

        /**
         * Setting component to hidden state. Hence
         * UI restoration should not happen.
         */

        update({
            isHidden: true
        });

        expect(setValue).toHaveBeenCalledTimes(1);
        expect(setValues).toHaveBeenCalledTimes(1);

        /**
         * Setting component to be visible. But since
         * dropin is not ready yet, UI restoration
         * should not happen.
         */

        update({
            isHidden: false
        });

        expect(setValue).toHaveBeenCalledTimes(1);
        expect(setValues).toHaveBeenCalledTimes(1);

        /**
         * Setting dropin to ready state.
         */

        talonProps.onPaymentReady();

        update();

        expect(setValue).toHaveBeenCalledTimes(2);
        expect(setValues).toHaveBeenCalledTimes(2);
    });
});

describe('Testing payment success workflow', () => {
    test('Should call onSuccess when payment nonce has been generated successfully', () => {
        const nonce = 'payment nonce';
        const onSuccess = jest.fn();
        const { talonProps } = getTalonProps({
            operations,
            isHidden: false,
            onSuccess,
            onReady: () => {},
            onError: () => {}
        });

        talonProps.onPaymentSuccess(nonce);

        expect(onSuccess).toHaveBeenCalledWith(nonce);
    });

    test('Should save payment payment nonce in apollo cache', () => {
        const paymentNonce = 'payment nonce';
        const { talonProps } = getTalonProps({
            operations,
            isHidden: false,
            onSuccess: () => {},
            onReady: () => {},
            onError: () => {}
        });

        talonProps.onPaymentSuccess(paymentNonce);

        const paymentNonceSaveCall = writeQuery.mock.calls.filter(
            call => call[0].query === getPaymentNonceQuery
        )[0];

        expect(paymentNonceSaveCall[0].data.cart.paymentNonce).toBe(
            paymentNonce
        );
    });

    test('Should save billing address in apollo cache', () => {
        const billingAddress = {
            firstName: 'test value',
            lastName: 'test value',
            country: 'test value',
            street1: 'test value',
            street2: 'test value',
            city: 'test value',
            state: 'test value',
            postalCode: 'test value',
            phoneNumber: 'test value'
        };
        useFormState.mockReturnValueOnce({
            values: {
                ...billingAddress,
                isBillingAddressSame: false
            }
        });

        const { talonProps } = getTalonProps({
            operations,
            isHidden: false,
            onSuccess: () => {},
            onReady: () => {},
            onError: () => {}
        });

        talonProps.onPaymentSuccess();

        const billingAddressSaveCall = writeQuery.mock.calls.filter(
            call => call[0].query === getBillingAddressQuery
        )[0];

        expect(billingAddressSaveCall[0].data.cart.billingAddress).toEqual({
            __typename: 'BillingAddress',
            ...billingAddress
        });
    });

    test('Should save isBillingAddressSame in apollo cache', () => {
        useFormState.mockReturnValueOnce({
            values: {
                isBillingAddressSame: true
            }
        });

        const { talonProps } = getTalonProps({
            operations,
            isHidden: false,
            onSuccess: () => {},
            onReady: () => {},
            onError: () => {}
        });

        talonProps.onPaymentSuccess();

        const isBillingAddressSameSaveCall = writeQuery.mock.calls.filter(
            call => call[0].query === getIsBillingAddressSameQuery
        )[0];

        expect(
            isBillingAddressSameSaveCall[0].data.cart.isBillingAddressSame
        ).toBeTruthy();
    });
});