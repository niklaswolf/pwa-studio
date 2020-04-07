import React from 'react';
import { shape, string, func } from 'prop-types';
import { Edit2 as EditIcon } from 'react-feather';
import { useSummary } from '@magento/peregrine/lib/talons/CheckoutPage/PaymentInformation/useSummary';

import Icon from '../../Icon';
import { mergeClasses } from '../../../classify';

import summaryGQLOperations from './summary.gql';

import defaultClasses from './summary.css';

const Summary = props => {
    const { classes: propClasses, onEdit, paymentNonce } = props;

    const classes = mergeClasses(defaultClasses, propClasses);

    const talonProps = useSummary({ operations: summaryGQLOperations });

    const { billingAddress, isBillingAddressSame } = talonProps;

    const billingAddressSummary =
        !isBillingAddressSame && billingAddress ? (
            /**
             * Added ID for tests
             */
            <div
                id={'addressSummary'}
                className={classes.address_summary_container}
            >
                <div>
                    <span className={classes.first_name}>
                        {billingAddress.firstName}
                    </span>
                    <span className={classes.last_name}>
                        {billingAddress.lastName}
                    </span>
                </div>
                <div>
                    <span className={classes.street1}>
                        {billingAddress.street1}
                    </span>
                    <span className={classes.street2}>
                        {billingAddress.street2}
                    </span>
                    <span className={classes.city}>{billingAddress.city}</span>
                    <span className={classes.state}>
                        {billingAddress.state}
                    </span>
                </div>
                <div>
                    <span className={classes.postalCode}>
                        {billingAddress.postalCode}
                    </span>
                    <span className={classes.country}>
                        {billingAddress.country}
                    </span>
                </div>
            </div>
        ) : null;

    return (
        <div className={classes.root}>
            <div className={classes.heading_container}>
                <h5 className={classes.heading}>Payment Information</h5>
                <button className={classes.edit_button} onClick={onEdit}>
                    <Icon size={16} src={EditIcon} attrs={{ fill: 'black' }} />
                </button>
            </div>
            <div className={classes.card_details_container}>
                <span className={classes.payment_type}>Credit Card</span>
                <span className={classes.payment_details}>{`${
                    paymentNonce.details.cardType
                } ending in ${paymentNonce.details.lastFour}`}</span>
            </div>
            {billingAddressSummary}
        </div>
    );
};

export default Summary;

Summary.propTypes = {
    classes: shape({
        root: string,
        heading_container: string,
        heading: string,
        edit_button: string,
        card_details_container: string,
        address_summary_container: string,
        first_name: string,
        last_name: string,
        street1: string,
        street2: string,
        city: string,
        postalCode: string,
        country: string,
        payment_type: string,
        payment_details: string
    }),
    paymentNonce: shape({
        paymentNonce: {
            nonce: string,
            type: string,
            description: string,
            details: {
                cardType: string,
                lastFour: string,
                lastTwo: string
            },
            binData: {
                prepaid: string,
                healthcare: string,
                debit: string,
                durbinRegulated: string,
                commercial: string,
                payroll: string,
                issuingBank: string,
                countryOfIssuance: string,
                productId: string
            }
        }
    }).isRequired,
    onEdit: func.isRequired
};