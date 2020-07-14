let router = require("express").Router();
let tourController = require("../controllers/tourController");
let authController = require("../controllers/authController");
let reviewRouter = require("./reviewRouter");

//Nested Routes for /Reviews
router.use("/:tourId/reviews", reviewRouter);

//Api Routes
router.post(
  "/",
  authController.protect,
  authController.restrictedTo("admin", "lead-guide"),
  tourController.createTour
);
router.get("/distances/:latLng/unit/:unit", tourController.getAllTourDistances);
router.get(
  "/tours-within/:distance/center/:latLng/unit/:unit",
  tourController.getToursWithin
);

router.get("/", authController.protect, tourController.getAllTours);
router.get("/monthly-plan/:start/:end", tourController.getBestMonth);
router.get("/tour-stats", tourController.getAllTourStats);
router.get("/:tourId", tourController.getSingleTour);
router.patch(
  "/:tourId",
  authController.protect,
  authController.restrictedTo("admin", "lead-guide"),
  tourController.updateTour
);
router.delete(
  "/:tourId",
  authController.protect,
  authController.restrictedTo("admin", "lead-guide"),
  tourController.deleteTour
);
module.exports = router;
