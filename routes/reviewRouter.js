let router = require("express").Router({ mergeParams: true });
let reviewController = require("../controllers/reviewController");
let authController = require("../controllers/authController");

router.get("/", reviewController.getAllReviews);
router.post(
  "/",
  authController.protect,
  authController.restrictedTo("user"),
  reviewController.createReview
);
router.delete(
  "/:reviewId",
  authController.protect,
  reviewController.deleteReview
);

router.patch(
  "/:reviewId",
  authController.protect,
  authController.restrictedTo("user"),
  reviewController.updateReviewByUser
);

module.exports = router;
