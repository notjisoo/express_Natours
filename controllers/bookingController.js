/*eslint-disable*/
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const Booking = require('../models/bookingModel');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1.Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  // 2.Create checkout session
  // 定义一个产品
  const product = await stripe.products.create({
    name: tour.name,
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
    // 成功返回的路径
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
  });

  // 3.Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only TEMPORARY, because it's unsecure: everyone can make bookings without paying

  const { tour, user, price } = req.query;

  if (!tour && !user && !price) return next();

  await Booking.create({ tour, user, price });

  // 重定向首页，相当于刷新
  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
