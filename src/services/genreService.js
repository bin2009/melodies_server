import db from '~/models';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import ApiError from '~/utils/ApiError';
import { StatusCodes } from 'http-status-codes';

const checkGenreExists = async ({ conditions = {}, mode = 'findOne' } = {}) => {
    return await db.Genre[mode]({ where: conditions });
};

const fetchGenre = async ({
    limit = undefined,
    offset = undefined,
    conditions = {},
    order = [['createdAt', 'DESC']],
    additionalAttributes = [],
    group = [],
} = {}) => {
    const genres = await db.Genre.findAll({
        attributes: ['genreId', 'name', ...additionalAttributes],
        where: conditions,
        limit: limit,
        offset: offset,
        order: order,
        group: group,
    });
    return genres;
};

const createGenreService = async ({ name } = {}) => {
    try {
        const checkGenre = await checkGenreExists({ conditions: { name: { [Op.iLike]: name.trim() } } });
        if (checkGenre) throw new ApiError(StatusCodes.CONFLICT, 'Genre exists');

        const genre = await db.Genre.create({
            genreId: uuidv4(),
            name: name.trim(),
        });
        return { genre: genre };
    } catch (error) {
        throw error;
    }
};

export const genreService = {
    fetchGenre,
    checkGenreExists,
    createGenreService,
};
