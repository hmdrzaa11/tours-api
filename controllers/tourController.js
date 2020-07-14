let Tour = require("../models/Tour");
let ApiFeatures = require("../utils/ApiQuery");
let ApiError = require("../utils/ApiError");
let handlerFactory = require("./handlerFactory");

exports.getAllTours = async (req, res, next) => {
  try {
    let query = Tour.find();
    let apiFeature = new ApiFeatures(query, req.query);
    apiFeature.sort().filter().limitFields().paginate();
    let allTours = await apiFeature.query;
    res.json({
      status: "success",
      data: {
        allTours,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createTour = async (req, res, next) => {
  try {
    let newTour = await Tour.create(req.body);
    res.status(201).json({
      status: "success",
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getSingleTour = async (req, res, next) => {
  try {
    let id = req.params.tourId;
    debugger;
    let tour = await Tour.findById(id).populate("reviews");
    if (!tour) {
      let err = new ApiError("Tour with this id not Exists", 404);
      next(err);
    }
    res.json({ status: "success", data: { tour } });
  } catch (error) {
    next(error);
  }
};

exports.updateTour = async (req, res, next) => {
  try {
    let id = req.params.tourId;
    let updated = await Tour.findByIdAndUpdate(id, req.body, {
      runValidators: true,
      new: true,
    });
    if (!updated) {
      let err = new ApiError("Tour with this id not Exists", 404);
      next(err);
    }
    res.json({
      status: "success",
      data: {
        updatedTour: updated,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteTour = handlerFactory.deleteOne(Tour);

exports.getAllTourStats = async (req, res, next) => {
  try {
    let stats = await Tour.aggregate([
      {
        $group: {
          _id: "$difficulty",
          sum: { $sum: 1 },
          averagePrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
    ]);
    res.json({
      data: {
        status: "success",
        stats: stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getBestMonth = async (req, res, next) => {
  try {
    let start = req.params.start;
    let end = req.params.end;
    let stats = await Tour.aggregate([
      { $unwind: "$startDates" },
      {
        $match: {
          startDates: {
            $gte: new Date(start),
            $lte: new Date(end),
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$startDates" },
          },
          numOfTours: { $sum: 1 },
        },
      },
      {
        $sort: { numOfTours: -1 },
      },
      {
        $limit: 5,
      },
    ]);
    res.send(stats);
  } catch (error) {
    next(error);
  }
};

exports.getToursWithin = async (req, res, next) => {
  try {
    let { distance, latLng, unit } = req.params;
    let [lat, lng] = latLng.split(",");
    if (!lat || !lng) {
      return next(
        new ApiError("Please provide the center as lat,lng format", 400)
      );
    }
    //Remember to add the '2dsphere' index to the schema
    //here we want to find all tours around a certain point

    //if your unit is mile then radius is 3963.2 if km 6378.15214
    let radius =
      unit === "miles"
        ? parseInt(radius) / 3963.2
        : parseInt(distance) / 6378.1;
    let tours = await Tour.find({
      startLocation: {
        $geoWithin: {
          $centerSphere: [[lng, lat], radius],
        },
      },
    });
    res.send({
      status: "success",
      data: {
        result: tours.length,
        tours,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllTourDistances = async (req, res, next) => {
  try {
    let { unit, latLng } = req.params;
    let [lat, lng] = latLng.split(",");
    if (!lat || !lng) {
      return next(new ApiError("You have to provide the lat,lng ", 400));
    }
    let multiplier = unit === "mile" ? 0.000621371 : 0.0001;
    let result = await Tour.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng * 1, lat * 1],
          },
          distanceField: "distance",
          distanceMultiplier: multiplier,
        },
      },
      {
        $project: {
          name: "$name",
          distance: "$distance",
          _id: 0,
        },
      },
    ]);
    res.send({
      status: "success",
      data: {
        result,
      },
    });
  } catch (error) {
    next(error);
  }
};
