import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';

const createArtist = async (req, res, next) => {
    console.log(req.body);
    const correctCondition = Joi.object({
        name: Joi.string().trim().strict().required(),
        // avatar: Joi.string().trim().strict().required(),
        bio: Joi.string().trim().optional().allow(null, ''),
        genres: Joi.array()
            .items(
                Joi.object({
                    genreId: Joi.string().guid({ version: 'uuidv4' }).required(), // Kiểm tra genreId là UUID
                }),
            )
            .min(1) // Đảm bảo mảng không rỗng
            .required() // Đảm bảo genres không thể là null
            .messages({
                'array.base': '"genres" must be an array',
                'array.min': '"genres" must contain at least one genre',
                'any.required': '"genres" is required',
                'object.base': '"genres" must contain objects with a genreId',
            }),
    });

    try {
        await correctCondition.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (error) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message));
    }
    return;
};

const validateUploadSong = async (req, res, next) => {
    try {
        const { data } = req.body;
        const parsedData = JSON.parse(data);
        console.log('baoloc: ', parsedData);

        const correctCondition = Joi.object({
            title: Joi.string().trim().strict().required(),
            mainArtistId: Joi.string().guid({ version: 'uuidv4' }).required(),
            duration: Joi.string().trim().optional(),
            subArtistIds: Joi.array()
                .items(
                    Joi.object({
                        artistId: Joi.string()
                            .guid({ version: ['uuidv4'] })
                            .required(),
                    }),
                )
                .optional(),
        });
        await correctCondition.validateAsync(parsedData, { abortEarly: false });
        next();
    } catch (error) {
        next(error);
    }
    // const data = JSON.parse(req.body);
    // const { data } = req.body;

    // const parsedData = JSON.parse(data);
    // console.log('validateUploadSong', parsedData);
    // const correctCondition = Joi.object({
    //     title: Joi.string().trim().strict().required(),
    //     mainArtistId: Joi.string().guid({ version: 'uuidv4' }).required(),
    //     subArtistIds: Joi.array()
    //         .items(
    //             Joi.object({
    //                 artistId: Joi.string()
    //                     .guid({ version: ['uuidv4'] })
    //                     .required(),
    //             }),
    //         )
    //         .optional(),
    // });

    // try {
    //     // await correctCondition.validateAsync(parsedData, { abortEarly: false });
    //     next();
    // } catch (error) {
    //     next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message));
    // }
    // return;
};

const validateGenre = async () => {};

const validateCreatePackage = async (req, res, next) => {
    const correctCondition = Joi.object({
        time: Joi.string().valid('week', '3month').required(),
        fare: Joi.number().required().precision(3),
        description: Joi.string().trim().max(10).strict().required(),
        downloads: Joi.number().integer().optional().allow(null).max(50),
        uploads: Joi.number().integer().optional().allow(null).max(50),
        room: Joi.number().integer().optional().allow(null).max(50),
    });

    try {
        await correctCondition.validateAsync(req.body, { abortEarly: false, convert: true });
        next();
    } catch (error) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message));
    }
    return;
};

export const appValidations = {
    createArtist,
    validateUploadSong,
    validateCreatePackage,
};
