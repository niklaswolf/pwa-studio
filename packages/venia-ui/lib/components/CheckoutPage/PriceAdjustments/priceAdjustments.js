import React from 'react';

import { mergeClasses } from '../../../classify';

import { Accordion, Section } from '../../Accordion';
import CouponCode from '../../CartPage/PriceAdjustments/CouponCode';
import GiftCardSection from '../../CartPage/PriceAdjustments/giftCardSection';
import GiftOptions from '../../CartPage/PriceAdjustments/GiftOptions';

import defaultClasses from './priceAdjustments.css';

const PriceAdjustments = props => {
    const classes = mergeClasses(defaultClasses, props.classes);

    const { setIsCartUpdating } = props;

    return (
        <div className={classes.root}>
            <Accordion canOpenMultiple={true}>
                <Section id={'coupon_code'} title={'Enter Coupon Code'}>
                    <CouponCode setIsCartUpdating={setIsCartUpdating} />
                </Section>
                <GiftCardSection setIsCartUpdating={setIsCartUpdating} />
                <Section id={'gift_options'} title={'See Gift Options'}>
                    <GiftOptions />
                </Section>
            </Accordion>
        </div>
    );
};

export default PriceAdjustments;

// TODO: PropTypes
