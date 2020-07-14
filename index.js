let express = require("express");
let app = express();
let path = require("path");
let dotenv = require("dotenv");
let rateLimit = require("express-rate-limit");
let helmet = require("helmet");
let mongoSanitize = require("express-mongo-sanitize");
let xss = require("xss-clean");
let cookieParser = require("cookie-parser");
let tourRoutes = require("./routes/tourRoutes");
let userRoutes = require("./routes/userRoutes");
let reviewRouter = require("./routes/reviewRouter");
let ApiError = require("./utils/ApiError");
let errorController = require("./controllers/errorController");
let hpp = require("hpp");

dotenv.config({ path: path.join(__dirname, ".env") });
let morgan = require("morgan");

//helmet
app.use(helmet());
//create limiter obj
let limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many Request from this ip please try again 1 hour later",
});

app.use("/", limiter);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//body parser middleware
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);
//serve static files
app.use(express.static(path.join(__dirname, "public")));

//tours
app.use("/api/v1/tours", tourRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/reviews", reviewRouter);

//404
app.all("*", (req, res, next) => {
  let error = new ApiError(`Route "${req.originalUrl}" is not found`, 404);
  next(error);
});

//error handler
app.use(errorController);

module.exports = app;
