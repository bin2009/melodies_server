const db = require('../models');
const User = db.User;
const bcrypt = require('bcryptjs');
const saltRounds = 10;
const { v4: uuidv4 } = require('uuid');

const createService = async (data) => {
    try {
        const hashPass = await bcrypt.hash(data.password, saltRounds);
        data.password = hashPass;
        data.role = 'Admin';
        data.statusPassword = false;
        data.accountType = 'Premium';
        data.status = true;
        const newUser = await User.create(data);
        return {
            errCode: 0,
            errMess: 'Admin created successfully',
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Admin creation failed: ${error.message}`,
        };
    }
};

const getAllArtistNameService = async () => {
    try {
        const artists = await db.Artist.findAll({
            attributes: ['id', 'name'],
            order: [['createdAt', 'DESC']],
            raw: true,
        });
        return {
            errCode: 200,
            message: 'Get all artist name success',
            artists: artists,
        };
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Get all artist name failed: ${error.message}`,
        };
    }
};

const getAllGenreNameService = async () => {
    try {
        const genres = await db.Genre.findAll({
            attributes: ['genreId', 'name'],
            order: [['createdAt', 'DESC']],
            raw: true,
        });
        return {
            errCode: 200,
            message: 'Get all artist name success',
            genres: genres,
        };
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Get all artist name failed: ${error.message}`,
        };
    }
};

const createGenreService = async (data) => {
    try {
        const genreName = await db.Genre.findOne({ where: { name: data.name.trim() } });
        if (genreName) {
            return {
                errCode: 409,
                message: 'Genre exits',
            };
        }

        const genre = await db.Genre.create({ genreId: uuidv4(), name: data.name.trim() });
        return {
            errCode: 200,
            message: 'Create genre success',
            genre: genre,
        };
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Create genre failed: ${error.message}`,
        };
    }
};

const createArtistGenreService = async (data) => {
    try {
        const genres = data.genres;

        genres.map(async (g) => {
            return await db.ArtistGenre.create({ artistGenreId: uuidv4(), artistId: data.artistId, genreId: g });
        });

        return {
            errCode: 200,
            message: 'Create artist genre success',
        };
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Create genre failed: ${error.message}`,
        };
    }
};

module.exports = {
    createService,
    getAllArtistNameService,
    getAllGenreNameService,
    createGenreService,
    createArtistGenreService,
};
