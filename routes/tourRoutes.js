const express = require('express');
const {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  uploadTourImages,
  resizeTourImages,
} = require('../controllers/tourController');

const { protect, restrictTo } = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// 这里创建一个默认的中间件，当你访问到这个路径，默认给你5条价格最便宜的旅游数据
router.route('/top-5-cheep').get(aliasTopTours, getAllTours);

// aggregate 聚合分组
router.route('/tours-stats').get(getTourStats);

// monthlyPlan
router
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

// /tours-within?distance=233&&center=34.079685, -118.183222&unit=mi
// /tours-within/233/center/34.079685,-118.183222/unit/mi
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);

// /distances/3219/unit/mi
router.route('/distances/:latlng/unit/:unit').get(getDistances);

// 这里的param是一个中间件，第一个参数是检察你路径是否有携带id，和你路径上的/:id是对应的，第二个参数是一个函数该函数有四个参数分别是req res next val，顾名思义中间件就是要在最后使用next()
// router.param('id', checkID);

// get请求 post请求 这两种请求的路径是完全一样的，因此我们可以使用route这种方式
// app.post("/api/v1/tours", createTour);
// 这句话的意思就是当你路径是api/v1/tours的时候他会判断你的请求方式来调用对应的函数
// get请求通过id去查找对应的数据
// app.get("/api/v1/tours/:id", getTour);
// patch请求通过id去修改对应的数据，不同的是他只需要传入要改的，而不需要传入全部
// app.patch("/api/v1/tours/:id", updateTour);
// delete请求
// app.delete("/api/v1/tours/:id", deleteTour);

// 因此可以对上面的三个请求进行改造都是params参数带ID
router
  .route('/')
  .get(getAllTours)
  .post(protect, restrictTo('admin', 'lead-guide'), createTour);

router
  .route('/:id')
  .get(getTour)
  .patch(
    protect,
    restrictTo('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    updateTour,
  )
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

// Post /tour/231faxzdw23/reviews
// Get /tour/139271fazx2ow/reviews
router.use('/:tourId/reviews', reviewRouter);

module.exports = router;
