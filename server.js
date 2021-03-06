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
let server = app.listen(PORT, "0.0.0.0", () => console.log(`on Port ${PORT}`));

process.on("unhandledRejection", (err) => {
  console.log(err.name);
});

process.on("SIGTERM", () => {
  console.log("Shutting down gracefully");
  server.close(() => {
    console.log("process terminated");
  });
});
