let mongoose = require("mongoose");
let Schema = mongoose.Schema;
let validator = require("validator");
let bcrypt = require("bcryptjs");
let crypto = require("crypto");
let ApiError = require("../utils/ApiError");

let userSchema = new Schema({
  name: {
    type: String,
    trim: true,
    required: [true, "any user must have a username"],
  },
  email: {
    type: String,
    required: [true, "email is required"],
    unique: true,
    lowercase: true,
    validate: {
      validator: function (value) {
        return validator.isEmail(value);
      },
      message: function (prop) {
        return `"${prop.value}" is invalid for ${prop.path}`;
      },
    },
  },
  password: {
    type: String,
    required: [true, "password is required"],
    trim: true,
    minlength: [8, "password must at least be 8 char"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "PasswordConfirm is required field"],
  },
  photo: String,
  passwordChangedAt: Date,
  role: {
    type: String,
    default: "user",
    enum: {
      values: ["user", "admin", "guide", "lead-guide"],
    },
  },
  passwordResetToken: String,
  passwordRestExpire: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

//Here we check for password and passwordConfirm to match
userSchema.pre("validate", function (next) {
  if (this.password !== this.passwordConfirm) {
    throw new ApiError("Password and PasswordConfirm do not match", 400);
  }
  next();
});

//for hashing
userSchema.pre("save", async function (next) {
  //we need to hash the pass when the password field is modified
  if (this.isModified("password")) {
    let hash = await bcrypt.hash(this.password, 12);
    this.password = hash;
    this.passwordConfirm = undefined;
    next();
  } else {
    next();
  }
});

//instance method for compare hash pass with raw pass
userSchema.methods.comparePasswords = async function (rawPassword) {
  return await bcrypt.compare(rawPassword, this.password);
};

//instance method for the passwordChanged At
userSchema.methods.isRecentlyChangedPassword = function (tokenInit) {
  if (this.passwordChangedAt) {
    let passwordChangedAt = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return passwordChangedAt > tokenInit;
  }
};

//instance method for generate token for the reset password
userSchema.methods.createPasswordResetToken = async function () {
  //we can use the random bytes function to do it for us
  let token = crypto.randomBytes(32).toString("hex");
  //we need to encrypt it but not  as much as a password so we use the crypto itself and we must save this hash to our db as a user field
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.passwordRestExpire = Date.now() + 10 * 60 * 1000;
  //we return the plain token because we need to send that with email
  await this.save({ validateBeforeSave: false });
  console.log({ token, encToken: this.passwordResetToken });
  return token;
};

userSchema.pre(/^find/, function (next) {
  this.find({
    active: { $ne: false },
  });
  next();
});

module.exports = mongoose.model("User", userSchema);
