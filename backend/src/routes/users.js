const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const User = require('../../src/models/users'); // Adjust path as needed

const registerSchema = Joi.object({
    firstname: Joi.string().min(3).max(30).required().messages({
        'string.empty': 'First name is required.',
        'string.min': 'First name must be at least 3 characters long.',
        'string.max': 'First name must not exceed 30 characters.',
        'any.required': 'First name is required.'
    }),
    lastname: Joi.string().min(3).max(30).required().messages({
        'string.empty': 'Last name is required.',
        'string.min': 'Last name must be at least 3 characters long.',
        'string.max': 'Last name must not exceed 30 characters.',
        'any.required': 'Last name is required.'
    }),
    username: Joi.string().min(3).max(30).required().messages({
        'string.empty': 'Username is required.',
        'string.min': 'Username must be at least 3 characters long.',
        'string.max': 'Username must not exceed 30 characters.',
        'any.required': 'Username is required.'
    }),
    email: Joi.string().email().required().messages({
        'string.empty': 'Email is required.',
        'string.email': 'Email must be a valid email address.',
        'any.required': 'Email is required.'
    }),
    password: Joi.string().min(6).required().messages({
        'string.empty': 'Password is required.',
        'string.min': 'Password must be at least 6 characters long.',
        'any.required': 'Password is required.'
    }),
});



function validateBody(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorMessages });
        }
        req.body = value;
        next();
    };
}

router.post("/register", validateBody(registerSchema), async (req, res) => {
    const { firstname, lastname, username, email, password } = req.body;

    try {
        
     const emailNormalized = email.toLowerCase().trim();
     const usernameNormalized = username.trim();

    const existingUser = await User.findOne({ 
      $or: [{ email: emailNormalized }, { username: usernameNormalized }] 
  });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email or username already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            firstname,
            lastname,
            username,
            email,
            password: hashedPassword
        });

        await newUser.save();

        res.status(201).json({ userId: newUser._id });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});




module.exports = router;
