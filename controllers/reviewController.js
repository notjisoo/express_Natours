const Review = require('../models/reviewModel');
// 工厂函数
const FactoryFunc = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  /*
    "review":"testestts",
    "rating":4,
    "tour":"6555ca7af41e601634bfe415",
    "user":"6550830847aafc1cb8e01ad5"
   */

  if (!req.body.tour) req.body.tour = req.params.tourId;
  // 有protect中间件，所以可以直接用req.user.id
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

exports.getReview = FactoryFunc.getOne(Review);
exports.getAllReviews = FactoryFunc.getAll(Review);
exports.createReview = FactoryFunc.createOne(Review);
exports.deleteReview = FactoryFunc.deleteOne(Review);
exports.updateReview = FactoryFunc.updateOne(Review);
// 一砖一瓦一红颜，两朝三世六百年
