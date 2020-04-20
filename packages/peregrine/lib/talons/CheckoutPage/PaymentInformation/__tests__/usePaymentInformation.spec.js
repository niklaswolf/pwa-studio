import React from 'react';
import { useQuery } from '@apollo/react-hooks';

import { usePaymentInformation } from '../usePaymentInformation';
import createTestInstance from '../../../../util/createTestInstance';
import { useAppContext } from '../../../../context/app';

jest.mock('../../../../context/cart', () => ({
    useCartContext: jest.fn().mockReturnValue([{ cartId: '123' }])
}));

jest.mock('../../../../context/app', () => ({
    useAppContext: jest
        .fn()
        .mockReturnValue([
            {},
            { toggleDrawer: () => {}, closeDrawer: () => {} }
        ])
}));

jest.mock('@apollo/react-hooks', () => {
    return { useQuery: jest.fn() };
});

jest.mock('informed', () => {
    return {
        useFieldState: jest.fn().mockReturnValue({ value: 'braintree' })
    };
});

const Component = props => {
    const talonProps = usePaymentInformation(props);

    return <i talonProps={talonProps} />;
};

const getTalonProps = props => {
    const tree = createTestInstance(<Component {...props} />);
    const { talonProps } = tree.root.findByType('i').props;

    const update = newProps => {
        tree.update(<Component {...{ ...props, ...newProps }} />);

        return tree.root.findByType('i').props;
    };

    return { talonProps, tree, update };
};

const getCheckoutStepQuery = 'getCheckoutStepQuery';
const queries = {
    getCheckoutStepQuery
};

const getCheckoutStep = jest.fn().mockReturnValue({
    data: { cart: { checkoutStep: 3 } }
});

beforeAll(() => {
    useQuery.mockImplementation(query => {
        if (query === getCheckoutStepQuery) {
            return getCheckoutStep();
        } else {
            return { data: {} };
        }
    });
});

test('Should return correct shape', () => {
    const { talonProps } = getTalonProps({ queries });

    expect(talonProps).toMatchSnapshot();
});

test('doneEditing should be true if checkoutStep is a greater than 3', () => {
    getCheckoutStep.mockReturnValueOnce({
        data: { cart: { checkoutStep: 3 } }
    });

    const { talonProps, update } = getTalonProps({ queries });

    expect(talonProps.doneEditing).toBeFalsy();

    getCheckoutStep.mockReturnValueOnce({
        data: {
            cart: {
                checkoutStep: 4
            }
        }
    });

    const { talonProps: newTalonProps } = update();

    expect(newTalonProps.doneEditing).toBeTruthy();
});

test('onSave should be called when handlePaymentSuccess is called', () => {
    const onSave = jest.fn();
    const { talonProps, update } = getTalonProps({ queries, onSave });

    expect(onSave).not.toHaveBeenCalled();

    talonProps.handlePaymentSuccess();

    update();

    expect(onSave).toHaveBeenCalled();
});

test('hideEditModal should call closeDrawer from app context', () => {
    const closeDrawer = jest.fn();
    useAppContext.mockReturnValueOnce([
        {},
        { toggleDrawer: () => {}, closeDrawer }
    ]);

    const { talonProps } = getTalonProps({ queries });

    talonProps.hideEditModal();

    expect(closeDrawer).toHaveBeenCalledWith('edit.payment');
});

test('showEditModal should call toggleDrawer from app context', () => {
    const toggleDrawer = jest.fn();
    useAppContext.mockReturnValueOnce([
        {},
        { closeDrawer: () => {}, toggleDrawer }
    ]);

    const { talonProps } = getTalonProps({ queries });

    talonProps.showEditModal();

    expect(toggleDrawer).toHaveBeenCalledWith('edit.payment');
});