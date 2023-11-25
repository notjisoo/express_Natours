const AppError = require('../utils/appError');

const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete({
      _id: req.params.id,
    });
    if (!doc) return next(new AppError('No Document found with that ID', 404));
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // 更新是先查找出ID，然后再进行Update
    // http://www.mongoosejs.net/docs/api.html#findbyidandupdate_findByIdAndUpdate
    // 这里findByIdAndUpdate函数不会走pre.save 和 验证，所以一些重要操作不要在这里进行
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, //返回修改之后的document，而不是原文档
      runValidators: true, // 验证
    });

    if (!doc) return next(new AppError('No Document found with that ID', 404));

    res.status(200).json({
      status: 'successaaa',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // const newTours = new Tour({});
    // newTours.save()
    const doc = await Model.create(req.body).then();
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    // 正常访问，如果有传递popOptions那么久给他添加填充函数populate即可
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    // Tour.findOne({ _id: req.params.id }) 简写
    if (!doc) return next(new AppError('No document found with that ID', 404));
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // 如果路径中没有tourId，就是无条件搜索
    // To allow for nested GET reviews on tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    // Execute query

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // explain可以查看当前mongodb的工作，以及查看他扫描了多少个文档
    // const doc = await features.query.explain();
    const doc = await features.query;

    // const doc = await features.query;
    // getAllTours 这个过滤其实是不算错误的，比如你确实是筛选掉一些东西，她也的确是去数据库中查找了只不过找的数据为0，所以并不能说是错误，除非数据库中出现了真的错误，但是也会被cathcAsync捕获

    // Send Response
    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
