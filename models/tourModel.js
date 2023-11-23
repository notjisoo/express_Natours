// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require('mongoose');
// eslint-disable-next-line import/no-extraneous-dependencies
const slugify = require('slugify');
// eslint-disable-next-line import/no-extraneous-dependencies
// const validator = require('validator');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [
        40,
        'A tour name must have less or equal then 40 characters ',
      ],
      minlength: [5, 'A tour name must have more or equal then 5 characters '],
      // 也可以按照上面的方法利用简写
      // validate: {
      //   validator: validator.isAlpha,
      //   message: 'Tour name must only contain characters',
      // },
    },

    slug: String,

    duration: {
      type: Number,
      required: [true, 'A tour must have a durations'],
    },

    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },

    difficulty: {
      type: String,
      requried: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either either: easy, medium, difficult',
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be above 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    priceDiscount: {
      // 自定义验证器
      validate: {
        validator: function (val) {
          // this only points to current doc on New Document creation,update的时候是不会触发这个验证的
          return val < this.price;
        },
        message: 'Discount price({VALUE}) should be below regular price',
      },
      type: Number,
    },

    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a desciption'],
    },

    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },

    description: {
      type: String,
      trim: true,
    },

    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },

    images: [String],

    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // 这个表示从请求的API中永远不会看到这个createdAt
    },

    startDates: [Date],

    secretTour: {
      type: Boolean,
      default: false,
    },

    startLocation: {
      // GeoJson
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },

    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        // ref 参考, 引用, 指定引另一个模型，它会用唯一值去User模型中找对应的数据，当然这里的唯一值就是ID, 必须是mongoose的对象ID这种类型
        ref: 'User',
      },
    ],
    // 使用虚拟填充
    // reviews: [
    //   {
    //     type: mongoose.Schema.ObjectId,
    //     ref: 'Review',
    //   },
    // ],
  },
  // 每次是JSON或者Object格式输出的时候，虚拟属性才会显示
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// 添加索引, 索引就是排好序的数据结构，这里就是按价格升序排好的数据
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// 向这个对象添加一个虚拟属性名为 durationWeeks,值是 这个对象中的duration / 7
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review', // 关联的模型
  foreignField: 'tour', //外键,关联模型Review中的tour字段
  localField: '_id', // 内键,schema对应的模型tour中的_id
  // justOne: false, // 只查询一条数据
});

// Document Middleware: runs before .save() and .create() 只有这个两个才可以触发
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', async function (next) {
//   // guidesPromise 返回的是Promise数组
//   const guidesPromise = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromise);
//   next();
// });

//#endregion
// tourSchema.pre('save', (next) => {
//   console.log('Will doc save...');
//   next();
// });

// // runs after / doc is bestNewDoc
// tourSchema.post('save', (doc, next) => {
//   console.log('best new doc', doc);
//   next();
// });
//#region

// Query Middleware
// find开头的都会执行,find,findOne,findOneAndDelete,findOneAndReplace,findOneAndUpdate
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  // this == query, populate函数是填充函数，这里guides的ref是User所以它就是等于填充User这个模型
  this.populate({
    path: 'guides', // 填充的那个字段？在tour模型中
    select: '-__v -passwordChangeAt', // 不要显示哪些数据？-号表示不要
  });

  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  next();
});

// Aggregation Middleware, this 指向聚合对象
// tourSchema.pre('aggregate', function (next) {
//   // this.pipeline() 调用这个方法可以获得Aggregation的配置数组
//   // 既然是个数组，那么就可以用unshift的方式插入元素，即如下
//   this.pipeline().unshift({
//     $match: { secretTour: { $ne: true } },
//   });
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
