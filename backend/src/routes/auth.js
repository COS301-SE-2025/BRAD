const express = require('express');
const router = express.Router();
const Joi = require('joi');
const authController = require('../controllers/authController');


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
    'string.empty': 'Username or email is required.',
    'any.required': 'Username or email is required.'
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required.',
    'string.min': 'Password must be at least 6 characters long.',
    'any.required': 'Password is required.'
  })
});

router.post('/login', validateBody(loginSchema), authController.login);

module.exports = router;