import Joi from 'joi';

export const forgotPasswordSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
  }),
};

export const resetPasswordSchema = {
  body: Joi.object({
    password: Joi.string().min(8).required(),
  }),
};
