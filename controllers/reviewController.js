let Review = require("../models/Review");
let ApiError = require("../utils/ApiError");
const { findOneAndUpdate } = require("../models/Review");

let createReview = async (req, res, next) => {
  try {
    if (!req.body.tour && !req.body.user) {
      let review = await Review.create({
        tour: req.params.tourId,
        user: req.user._id,
        review: req.body.review,
        rating: req.body.rating,
      });
      return res.status(201).json({
        status: "success",
        data: {
          review,
        },
      });
    }
    let review = await Review.create(req.body);
    res.status(201).json({
      status: "success",
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

let getAllReviews = async (req, res, next) => {
  try {
    let filter = {};
    if (req.params.tourId) {
      filter.tour = req.params.tourId;
    }
    let allReviews = await Review.find(filter);
    res.json({
      status: "success",
      data: {
        result: allReviews.length,
        allReviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

let deleteReview = async (req, res, next) => {
  try {
    let deletedOne = await Review.findOneAndDelete({
      user: req.user._id,
      _id: req.params.reviewId,
    });

    if (!deletedOne) {
      return next(new ApiError("There is no review with this id", 404));
    }
    res.status(204).send({
      status: "success",
    });
  } catch (error) {
    next(error);
  }
};

let updateReviewByUser = async (req, res, next) => {
  try {
    let review = await Review.findOneAndUpdate(
      { user: req.user._id, _id: req.params.reviewId },
      { rating: req.body.rating, review: req.body.review },
      { runValidators: true, new: true }
    );
    if (!review) {
      return next(new ApiError("review with this id not found", 404));
    }
    res.status(200).send({
      status: "success",
      data: {
        review,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getAllReviews,
  deleteReview,
  updateReviewByUser,
};
