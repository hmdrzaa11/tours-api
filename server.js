let mongoose = require("mongoose");
let app = require("./index");
let dotenv = require("dotenv");
let path = require("path");
dotenv.config({ path: path.join(__dirname, ".env") });

mongoose
  .connect(process.env.DATABASE_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("DB in the House!"))
  .catch((err) => console.log(err));

let PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log("on 8000"));

process.on("unhandledRejection", (err) => {
  console.log(err.name);
});
