// review / rating / createdAt / ref to tour / ref to user

const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },

    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// 为了保证一个用户不能为同一个旅游写多个评论
// 每个用户只能对一个旅游写一个评论和评分
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user', // 填充的那个字段？在tour模型中
    select: 'name photo', // 不要显示哪些数据？-号表示不要
  });
  next();
});

// calcAverageRatings计算评价分，因为每次用户对该旅行评价都会影响该旅行的平均评级分数所以这里要动态的计算一下, 这个方法添加到静态方法中才可以用this
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    // 筛选tour == 传进来的ID，自然就只有唯一一个了
    {
      $match: { tour: tourId },
    },
    // 分组。唯一值是id, 利用$tour方式读取, nRating求和, avgRating求平均值
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats[0].nRating);

  // console.log(tourId);
  // 分完整之后需要同步更新tour旅游信息 stats[0]读取的是当前对象
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// 在添加评论之后，保存之前，调用这函数calcAverageRatings
reviewSchema.post('save', function (next) {
  // this points to current review
  // this.constructor 等于 Review
  this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndUpdate / findByIdAndDelete只是简写，真的是findOneAnd...
// find()出来的是一个数组对象 findOne()出来的是查到的第一个对象 。
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function (next) {
  // await this,findOne(); does not work here, query ha already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);
// console.log(Review);

module.exports = Review;
