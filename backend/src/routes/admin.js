const express = require('express');
const router = express.Router();
const Joi = require('joi');
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/auth');
const requireAdmin = require('../middleware/isAdmin'); 
// Middleware for validation
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

const addAdminSchema = Joi.object({
  firstname: Joi.string().required(),
  lastname: Joi.string().required(),
  email: Joi.string().email().required(),
  username: Joi.string().required(),
  password: Joi.string().min(6).required(),
});

router.post('/addadmin', validateBody(addAdminSchema), adminController.addAdmin);
router.patch('/promote/:userId', authenticate, requireAdmin, adminController.promoteUser);
router.patch('/demote/:userId', authenticate, requireAdmin, adminController.demoteUser);
module.exports = router;
