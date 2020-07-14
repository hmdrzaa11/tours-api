let dotenv = require("dotenv");
let path = require("path");
let mongoose = require("mongoose");
let fs = require("fs");
let Tour = require("../models/Tour");
let User = require("../models/User");
let Review = require("../models/Review");
dotenv.config({ path: path.join(__dirname, "..", ".env") });

mongoose.connect(process.env.DATABASE_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let command = process.argv[2];
let tours = JSON.parse(fs.readFileSync(path.join(__dirname, "tours.json")));
let users = JSON.parse(fs.readFileSync(path.join(__dirname, "users.json")));
let reviews = JSON.parse(fs.readFileSync(path.join(__dirname, "reviews.json")));

async function saveData() {
  try {
    await Tour.create(tours);
    await User.create(users);
    await Review.create(reviews);
  } catch (err) {
    console.log(err);
  }
  process.exit(0);
}

async function deleteData() {
  await Tour.deleteMany({});
  await User.deleteMany({});
  await Review.deleteMany({});
  process.exit(0);
}

if (command === "-delete") {
  deleteData();
} else if (command === "-import") {
  saveData();
} else {
  console.log('use "-delete" or "-import" ');
  process.exit(1);
}
