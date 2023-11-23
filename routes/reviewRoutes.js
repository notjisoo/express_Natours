const express = require('express');
const {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds,
  getReview,
} = require('../controllers/reviewController');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

// 没有经过验证任何人都不可以访问评论相关的API
router.use(protect);

/**
 *  mergeParams: true 设置为true
 *  表示reviewRoutes这个路径可以访问到，tourRoutes路由传入过来的tourId
 *  这样子可以访问到createReview中的req.params.tourId
 */
// Post /tour/tourID/reviews
// Post /reviews == /tour/123218382id/reviews

router
  .route('/')
  .get(getAllReviews)
  .post(protect, restrictTo('user'), setTourUserIds, createReview);

// 删除和更改评论只有user和admin可以操作，其他都不行
router
  .route('/:id')
  .get(getReview)
  .patch(restrictTo('user', 'admin'), updateReview)
  .delete(restrictTo('user', 'admin'), deleteReview);

module.exports = router;
