import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';

const createPlaylistValidation = async (req, res, next) => {
    const correctCondition = Joi.object({
        title: Joi.string().max(20).trim().strict().optional(),
        description: Joi.string().max(40).trim().strict().optional(),
        playlistImage: Joi.string().trim().strict().optional(),
    });

    try {
        await correctCondition.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (error) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message));
    }
    return;
};

export const playlistValidations = {
    createPlaylistValidation,
};
