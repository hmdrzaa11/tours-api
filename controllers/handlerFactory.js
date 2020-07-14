let ApiError = require("../utils/ApiError");

function deleteOne(Model) {
  return async (req, res, next) => {
    try {
      let deletedTour = await Model.findByIdAndDelete(req.params.tourId);
      if (!deletedTour) {
        let err = new ApiError("document with this id not exists", 404);
        next(err);
      }

      res.status(204).send({ status: "success" });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { deleteOne };
