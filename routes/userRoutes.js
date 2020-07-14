let router = require("express").Router();

let userController = require("../controllers/userController");
let authController = require("../controllers/authController");
const { upload } = require("../controllers/userController");

router.get("/me", authController.protect, userController.getMe);
router.post("/signup", authController.signUp);
router.get("/logout", authController.logout);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.patch("/reset-password/:token", authController.resetPassword);
router.patch(
  "/update-me",
  upload.single("image"),
  authController.protect,
  userController.updateMe
);
router.patch(
  "/update-password",
  authController.protect,
  authController.updatePassword
);
router.delete(
  "/deactivate-user",
  authController.protect,
  userController.deactivateUser
);
router.get("/", userController.getAllUsers);

module.exports = router;
