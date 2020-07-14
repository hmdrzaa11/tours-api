let mongoose = require("mongoose");
let Schema = mongoose.Schema;
let slugify = require("slugify");

let tourSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      unique: true,
      trim: true,
      maxlength: [40, "tour name must have less than 40 character"],
      minlength: [10, "tour name must be at least 10 char"],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating Can not rate below 1"],
      max: [5, "Rating Can not be greater than 5"],
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: { type: Number, required: [true, "price of a tour is required"] },
    duration: { type: Number, required: [true, "duration is required"] },
    priceDiscount: {
      type: Number,
      validate: {
        validator(priceDiscount) {
          if (priceDiscount > this.price) {
            return false;
          }
          return true;
        },
        message: function (props) {
          return `${props.value} is greater than  the price `;
        },
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "a tour needs a summary"],
    },
    description: { type: String, trim: true },
    imageCover: { type: String, required: [true, "a tour needs a cover"] },
    images: [String],
    maxGroupSize: {
      type: Number,
      required: [true, "tour must have a maxGroupSize"],
    },
    createdAt: { type: Date, default: Date.now },
    difficulty: {
      type: String,
      enum: {
        values: ["difficult", "easy", "medium"],
        message: "only these 3 values ",
      },
    },
    startDates: [Date],
    slug: String,
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: { type: String, default: "Point", enum: ["Polygon", "Point"] },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: { type: String, default: "Point", enum: ["Point", "Polygon"] },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//turn duration in weeks
tourSchema.virtual("durationInWeeks").get(function () {
  let weeks = Math.floor(this.duration / 7);
  return weeks;
});

//attach the slug
tourSchema.pre("save", function (next) {
  let slug = slugify(this.name, { lower: true });
  this.slug = slug;
  next();
});

//hide secret tours
tourSchema.pre(/find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

//aggregation middleware to exclude the secret tour
tourSchema.pre("aggregate", function (next) {
  this.pipeline().push({
    $match: {
      secretTour: { $ne: true },
    },
  });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({ path: "guides", select: "email name" });
  next();
});

//virtual populate for reviews
tourSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "tour",
});

let Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
