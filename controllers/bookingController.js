/*eslint-disable*/
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('./../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1.Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  // 2.Create checkout session
  // 定义一个产品
  const product = await stripe.products.create({
    name: 'T-shirt',
    description: tour.summary,
    images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
  });

  // 定义价格，product对应的是哪个产品的价格？ 要传入productId
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: tour.price * 100,
    currency: 'usd',
  });

  // 用产品和价格可以创建一个会话，就是一些订单详情，创建成功会返回一个sessionID
  const session = await stripe.checkout.sessions.create({
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    mode: 'payment',
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
  });

  // 3.Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});
