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

//here we want to populate the user and tour
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name",
  });
  next();
});

reviewSchema.statics.calculateRating = async function (tourId) {
  //here we need to select all reviews that belong to the tour id we got
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
  //we need to get the tour itself from its model and then update the data on it
  let tour = await Tour.findById(tourId);
  console.log(stats);
  if (stats.length) {
    tour.ratingsQuantity = stats[0].totalRating;
    tour.ratingsAverage = stats[0].averageRating.toFixed(1);
    await tour.save();
  }
};

reviewSchema.post("save", async function () {
  // "this" refers to the Document itself
  // how we can access the Model in here to call the static method
  // any "object" has a call to its constructor
  await this.constructor.calculateRating(this.tour); //here we pass the Tour id to it because we need it
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  //because mongoose uses the mongodb driver so if we put this this will run for "findOneById..."
  //we can execute the query and that will give us a document that is processing
  //we can attach the 'findOne()' and await it
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
