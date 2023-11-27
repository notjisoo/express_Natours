/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alerts';

// tour.pug中引入了stripe;
const stripe = Stripe(
  'pk_test_51OGLnELDieBNJEvwiCWYKxhN1q9mgRgpjsod4jabUriJSDPzwyw18ZADEqSRlZiAyVPNUyAXZ559E0uhIv1vPOYs00cENDPI81',
);

export const bookTour = async (tourId) => {
  try {
    // 1.Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    // 2.Create checkout form + chanre credit card
    // 创建一个支付页面;
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert('error', err);
  }
};
