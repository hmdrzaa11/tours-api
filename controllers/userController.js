let multer = require("multer");

let User = require("../models/User");
let ApiError = require("../utils/ApiError");
let filterObject = require("../utils/filterObject");

let multerStorage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "public/img/users");
  },
  filename(req, file, callback) {
    let filename = `user-${file.originalname}.${file.mimetype.split("/")[1]}`;
    callback(null, filename);
  },
});

let multerFilter = (req, file, cb) => {
  let allowedExt = ["jpg", "jpeg", "png"];
  let ext = file.mimetype.split("/")[1];
  if (!allowedExt.includes(ext)) {
    cb(new Error("this file type is not supported"), false);
  } else {
    cb(null, true);
  }
};

let upload = multer({ storage: multerStorage, fileFilter: multerFilter });

async function updateMe(req, res, next) {
  try {
    //1- check the req.body and if user try to update password or confirm password in it we send an error
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new ApiError("use password-update for updating your password", 400)
      );
    }
    //2- we update the user data
    //filter out all the fields user only can update
    let data = filterObject(req.body, "email", "name");
    if (req.file) {
      data.photo = req.file.filename;
    }
    let user = await User.findByIdAndUpdate(req.user._id, data, {
      new: true,
      runValidators: true,
    });
    res.json({
      status: "success",
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

async function deactivateUser(req, res, next) {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      { active: false },
      { runValidators: true }
    );
    res.status(204).json({
      status: "success",
      msg: "user successfully deactivated",
    });
  } catch (error) {
    next(error);
  }
}

async function getAllUsers(req, res, next) {
  try {
    let users = await User.find();
    res.send({
      status: "success",
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    let user = await User.findOne({ _id: req.user._id });
    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  updateMe,
  deactivateUser,
  getAllUsers,
  getMe,
  upload,
};
