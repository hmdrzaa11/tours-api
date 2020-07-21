let mongoose = require("mongoose");
let Schema = mongoose.Schema;
let Tour = require("./Tour");

let reviewSchema = new Schema(
  {
    review: { type: String, required: [true, "review is required"] },
    rating: { type: Number, min: 1, max: 5, default: 4.5 },
    createdAt: { type: Date, default: Date.now },
    tour: {
      type: Schema.Types.ObjectId,
      ref: "Tour",
      required: [true, "review must have tour related to it"],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "review must belong to a user"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name",
  });
  next();
});

reviewSchema.statics.calculateRating = async function (tourId) {

  let stats = await this.aggregate([
    {
      $match: {
        tour: tourId,
      },
    },
    {
      $group: {
        _id: null,
        totalRating: { $sum: 1 },
        averageRating: { $avg: "$rating" },
      },
    },
  ]);
 
  let tour = await Tour.findById(tourId);
  console.log(stats);
  if (stats.length) {
    tour.ratingsQuantity = stats[0].totalRating;
    tour.ratingsAverage = stats[0].averageRating.toFixed(1);
    await tour.save();
  }
};

reviewSchema.post("save", async function () {
  
  await this.constructor.calculateRating(this.tour); 
});

reviewSchema.pre(/^findOneAnd/, async function (next) {

  let doc = await this.findOne();
  //here we attach the doc to "this"
  this.doc = doc;
  next();
});
reviewSchema.post(/^findOneAnd/, async function () {
  let doc = this.doc;
  //here is the best place to call the calcFunc
  await doc.constructor.calculateRating(doc.tour);
});

module.exports = mongoose.model("Review", reviewSchema);
