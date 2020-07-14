module.exports = class ApiError extends Error {
  constructor(errorMessage, statusCode) {
    super(errorMessage);
    this.statusCode = statusCode | 500;
    this.status = statusCode.toString().startsWith("4") ? "Fail" : "Error";
    //define a flag to determine your error with all mongoose or other errors
    this.customError = true;
    //this should be done
    Error.captureStackTrace(this, this.constructor);
  }
};
