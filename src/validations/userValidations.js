import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';

const registerUserValidation = async (req, res, next) => {
    const correctCondition = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).max(20).trim().strict().required().messages({
            'any.required': 'Title is required',
            'string.empty': 'Title is not allowed to be empty',
            'string.min': 'Title min 3 char',
            'string.max': 'Title min 20 char',
            'string.trim': 'Title must not have leading or trailing whitespace',
        }),
        username: Joi.string().min(6).max(30).trim().strict().required(),
    });

    try {
        await correctCondition.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (error) {
        // res.status(httpStatus.UNPROCESSABLE_ENTITY).json({
        //     errors: new Error(error).message,
        // });
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message));
    }
    return;
};

export const userValidations = {
    registerUserValidation,
};
