import { body, validationResult } from "express-validator";

export const validation = [
  body("email").isEmail().withMessage("Please provide a valid email address"),
  body("username")
    .isLength({ min: 2 })
    .withMessage("Username must be at least 2 characters long"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() });
    }
    next();
  },
];
