const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Booking = require('../models/bookingModel');

exports.getOverview = catchAsync(async (req, res) => {
  // 1.Get tour data from collection
  const tours = await Tour.find();
  // 2.Build template

  // 3.Render that template using tour data from 1

  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const { slug } = req.params;
  // 1.Get the data, for the requested tour (lncluding reviews and guide)
  const tour = await Tour.findOne({ slug }).populate({
    path: 'reviews',
    // 指定需要哪些文件？
    fields: 'review rating user',
  });

  // 例如路径错误 http://127.0.0.1:8000/tour/the-snow-adventureraddwadwadsa
  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }

  // 2.Build template
  // 3.Render template
  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1.Find all bookings 先找到用户id
  const bookings = await Booking.find({ user: req.user.id });
  // 2.Find tours with the returned IDs get Tour array，通过用户ID可以找到tourId
  // 然后通过tourId可以找到tour详情
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const { email, name } = req.body;
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { name, email },
    { new: true, runValidators: true },
  );

  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
});
