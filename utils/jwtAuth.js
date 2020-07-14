let jwt = require("jsonwebtoken");

function generateToken(user) {
  let token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return token;
}

function createCookie(token, res) {
  res.cookie("jwt", token, {
    httpOnly: true,
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE_IN * 24 * 60 * 60 * 1000
    ),
    secure: process.env.NODE_ENV === "production" ? true : false,
  });
}

module.exports = { generateToken, createCookie };
