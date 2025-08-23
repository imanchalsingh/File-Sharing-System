import { body, validationResult } from "express-validator";

export const validation = [
  body("email").isEmail().withMessage("Please provide a valid email address"),
  body("username")
    .isLength({ min: 2 })
    .withMessage("Username must be at least 2 characters long"),
  body("password")
    .isLength({ min: 4 })
    .withMessage("Password must be at least 4 characters long"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
