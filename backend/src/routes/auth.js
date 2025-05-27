const express = require("express");
const router = express.Router();
const Joi = require("joi");
const authController = require("../controllers/authController");

// Validation middleware
function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return res.status(400).json({ errors: errorMessages });
    }
    req.body = value;
    next();
  };
}

const loginSchema = Joi.object({
  identifier: Joi.string().required().messages({
    "string.empty": "Username or email is required.",
    "any.required": "Username or email is required.",
  }),
  password: Joi.string().min(6).required().messages({
    "string.empty": "Password is required.",
    "string.min": "Password must be at least 6 characters long.",
    "any.required": "Password is required.",
  }),
});

router.post("/login", validateBody(loginSchema), authController.login);

const registerSchema = Joi.object({
  firstname: Joi.string().min(3).max(30).required(),
  lastname: Joi.string().min(3).max(30).required(),
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .messages({ "any.only": "Passwords do not match" }),
  role: Joi.string().valid("admin", "investigator", "general").default("general"), 
});


// Routes
router.post("/register", validateBody(registerSchema), authController.register);

module.exports = router;
