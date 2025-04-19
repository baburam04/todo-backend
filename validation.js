const Joi = require('joi');

// Validation schemas
const schemas = {
  register: Joi.object({
    name: Joi.string().min(3).max(30).required(),
    email: Joi.string().min(6).max(50).required().email(),
    password: Joi.string().min(6).max(30).required()
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/)
      .message('Password must contain at least one uppercase letter, one lowercase letter, and one number')
  }),

  login: Joi.object({
    email: Joi.string().min(6).max(50).required().email(),
    password: Joi.string().min(6).max(30).required()
  }),

  task: Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).allow(''),
    completed: Joi.boolean()
  })
};

// Validation functions
module.exports = {
  registerValidation: (data) => schemas.register.validate(data),
  loginValidation: (data) => schemas.login.validate(data),
  taskValidation: (data) => schemas.task.validate(data),

  // Optional: Export schemas directly if needed elsewhere
  schemas
};