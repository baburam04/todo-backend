const Joi = require('joi');

// Validation schemas
const schemas = {
  register: Joi.object({
    name: Joi.string().min(3).max(30).required(),
    email: Joi.string().min(6).max(50).required().email(),
    password: Joi.string().min(6).max(30).required()
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/)
      .message('Password must contain at least one uppercase letter, one lowercase letter, and one number')
  }).options({ allowUnknown: false }), // Strict validation for registration

  login: Joi.object({
    email: Joi.string()
      .min(6)
      .max(50)
      .required()
      .email()
      .messages({
        'string.empty': 'Email cannot be empty',
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
      }),
      
    password: Joi.string()
      .min(6)
      .max(30)
      .required()
      .messages({
        'string.empty': 'Password cannot be empty',
        'string.min': 'Password must be at least {#limit} characters',
        'any.required': 'Password is required'
      })
  }).options({ stripUnknown: true }), // Remove unknown fields (like 'name') during login

  task: Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).allow(''),
    completed: Joi.boolean()
  })
};

// Enhanced validation functions
module.exports = {
  registerValidation: (data) => {
    const { error, value } = schemas.register.validate(data);
    if (error) throw new Error(error.details[0].message);
    return value;
  },

  loginValidation: (data) => {
    // Explicitly remove 'name' field if present
    const sanitizedData = (({ email, password }) => ({ email, password }))(data);
    const { error, value } = schemas.login.validate(sanitizedData);
    if (error) throw new Error(error.details[0].message);
    return value;
  },

  taskValidation: (data) => {
    const { error, value } = schemas.task.validate(data);
    if (error) throw new Error(error.details[0].message);
    return value;
  },

  schemas // Export schemas if needed elsewhere
};