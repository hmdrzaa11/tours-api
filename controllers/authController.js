let User = require("../models/User");
let { generateToken, createCookie } = require("../utils/jwtAuth");
let ApiError = require("../utils/ApiError");
let jwt = require("jsonwebtoken");
let sendEmail = require("../utils/email");
let crypto = require("crypto");

let signUp = async (req, res, next) => {
  try {
    let newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      photo: req.body.photo,
    });
    let token = generateToken(newUser);
    newUser.password = undefined;
    createCookie(token, res);
    res.status(201).json({
      status: "success",
      token,
      data: newUser,
    });
  } catch (err) {
    next(err);
  }
};

let login = async (req, res, next) => {
  try {
    let { email, password } = req.body;
    //1-check if email and password are exists
    if (!email || !password) {
      return next(new ApiError("email and password is required", 400));
    }
    //2-check if user exists && and password is correct
    let user = await User.findOne({ email }).select("password");
    if (!user) {
      return next(new ApiError("invalid email or password", 400));
    }
    if (!(await user.comparePasswords(password))) {
      return next(new ApiError("invalid email or password", 400));
    }
    //3-if every thing is ok send token
    token = generateToken(user);
    createCookie(token, res);
    res.status(200).json({
      status: "success",
      data: {
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

let protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers["authorization"] &&
      req.headers["authorization"].startsWith("Bearer")
    ) {
      token = req.headers["authorization"].split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    } else {
      let err = new ApiError(
        "you are not logged in please login to get access",
        401
      );
      return next(err);
    }
    //2- validate the token
    try {
      let data = jwt.verify(token, process.env.JWT_SECRET);

      //3- check for the user if exists in the DB
      let user = await User.findById(data.id);
      if (!user) {
        return next(
          new ApiError("There is no user related to thin token", 400)
        );
      }
      //4- check if user recently changed the password :we create another instance method to calculate the validity of the token and password changed at
      if (user.isRecentlyChangedPassword(data.iat)) {
        return next(
          new ApiError(
            "user recently changed the password please login again",
            400
          )
        );
      }
      //access to route
      req.user = user;
      next();
    } catch (err) {
      return next(err);
    }
  } catch (error) {
    next(error);
  }
};

async function protectV2(req, res, next) {
  //1- get the token from the header and check if its there
  let token;
  if (
    req.headers["authorization"] &&
    req.headers["authorization"].startsWith("Bearer")
  ) {
    let token = req.headers.authorization.split(" ")[1];
    //2- validate the token
    try {
      let data = jwt.verify(token, process.env.JWT_SECRET);
      //3- check for the user if exists in the DB
      let user = await User.findById(data.id);
      if (!user) {
        return next(
          new ApiError("There is no user related to thin token", 400)
        );
      }
      //4- check if user recently changed the password :we create another instance method to calculate the validity of the token and password changed at
      if (user.isRecentlyChangedPassword(data.iat)) {
        return next(
          new ApiError(
            "user recently changed the password please login again",
            400
          )
        );
      }
      //access to route
      req.user = user;
      next();
    } catch (err) {
      return next(err);
    }
  } else if (req.cookies.jwt) {
  } else {
    return next(
      new ApiError("you are not logged in please login to get access", 401)
    );
  }
}

function restrictedTo(...roles) {
  //we always assume the user is logged in and we have it in the request
  return function (req, res, next) {
    let userRole = req.user.role;
    if (roles.includes(userRole)) {
      next();
    } else {
      return next(
        new ApiError("You are unauthorized to access this route", 400)
      );
    }
  };
}

async function forgotPassword(req, res, next) {
  try {
    //1- get user by email
    let user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new ApiError("There is no user related to this Email", 404));
    }
    //2- generate the reset token
    let token = await user.createPasswordResetToken();
    //3- send it as email
    let resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/reset-password/${token}`;
    let message = `
    forgot your password submit a patch request with your new password to this route
    ${resetUrl}
     `;
    //we need to try catch it because if anything goes wrong we need to set the token on the user to undefined and expire tokn
    try {
      sendEmail({
        email: user.email,
        subject: "tour password reset email valid only for 10 min",
        message,
      });

      res.status(200).json({
        status: "success",
        message: "token sent to your email",
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordRestExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return next(
        new ApiError("There was an error sending email try later", 500)
      );
    }
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    //1-get user based on the token ('we to hash the raw token that user send us and compare it with hashed version in our DB')
    let hash = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    let user = await User.findOne({
      passwordResetToken: hash,
      passwordRestExpire: { $gt: Date.now() },
    });
    if (!user) {
      return next(new ApiError("Token is invalid or expired", 400));
    }
    //2- if token is not expired we set the new password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordRestExpire = undefined;
    user.passwordChangedAt = new Date();
    await user.save();
    //3- update the passwordChangedAt prop
    let token = generateToken(user);
    createCookie(token, res);
    res.status(200).json({
      status: "success",
      data: {
        token,
      },
    });

    //4- log the user in
  } catch (error) {
    next(error);
  }
}

async function updatePassword(req, res, next) {
  try {
    //1- this is for logged in users but also we  need the user to send its password
    let user = await User.findById({ _id: req.user._id }).select("password");
    //because we did select:false the password so we need to query the DB again and this time select the password
    let oldPassword = req.body.oldPassword;
    let newPassword = req.body.newPassword;
    let newPassConfirm = req.body.newPassConfirm;
    //2- we need to check if the posted password is correct
    let isMatchToPass = await user.comparePasswords(oldPassword);
    if (!isMatchToPass) {
      return next(new ApiError("the password is wrong", 400));
    }
    //3-update the password and save it
    user.password = newPassword;
    user.passwordConfirm = newPassConfirm;
    user.passwordChangedAt = new Date();
    await user.save();
    //4- log the user in
    let token = generateToken(user);
    createCookie(token, res);
    res.status(200).json({
      status: "success",
      data: token,
    });
  } catch (error) {
    next(error);
  }
}
//logout

let logout = async (req, res, next) => {
  try {
    res.cookie("jwt", "some bullshit", { maxAge: 10000, httpOnly: true });
    res.send({
      status: "success",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  signUp,
  login,
  protect,
  restrictedTo,
  forgotPassword,
  resetPassword,
  updatePassword,
  logout,
};
