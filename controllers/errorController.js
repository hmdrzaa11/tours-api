let ApiError = require("../utils/ApiError");

module.exports = (err, req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    //here we need to turn the all other errors to our own custom errors
    //use "err" on the condition and tune the "error"
    let error = err;
    if (err.name === "CastError") {
      let message = `Invalid ${error.value} for field ${error.path}`;
      error = new ApiError(message, 400);
    }
    //duplication errors
    if (err.code === 11000) {
      let errMsg = error.errmsg.match(/(["'])(\\?.)*?\1/)[0];
      error = new ApiError(
        `Duplicate field ${errMsg} please use another value`,
        400
      );
    }
    //mongoose validation errors
    if (err.name === "ValidationError") {
      let errMess = Object.values(error.errors)
        .map((er) => er.message)
        .join("  ");
      error = new ApiError(errMess, 400);
    }
    //JsonWebTokenError
    if (err.name === "JsonWebTokenError") {
      error = new ApiError("Invalid Token", 400);
    }
    //TokenExpiredError
    if (err.name === "TokenExpiredError") {
      error = new ApiError("Token is expired please login again", 400);
    }
    sendErrorProd(error, res);
  }
};

function sendErrorDev(err, res) {
  let statusCode = err.statusCode || 500;
  let status = err.status || "Error";
  res.status(statusCode).json({
    status,
    err,
    message: err.message,
    stack: err.stack,
    name: err.name,
  });
}

function sendErrorProd(err, res) {
  //all our custom errors
  if (err.customError) {
    //our error has all the info we need
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    //all other unknown errors
    res.status(500).json({
      status: "Error",
      message: "Something Went Wrong",
    });
  }
}
