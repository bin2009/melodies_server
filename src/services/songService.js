const db = require('../models');
const Song = db.Song;

const getAllSongService = async () => {
    try {
        const songs = await Song.findAll();
        return {
            errCode: 0,
            errMess: 'Get all songs',
            songs: songs,
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Internal Server Error ${error.message}`,
        };
    }
};

const getSongService = async (songId) => {
    try {
        const song = await Song.findOne({ where: { id: songId } });
        return {
            errCode: 0,
            errMess: 'Get song by ID',
            songs: song,
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Internal Server Error ${error.message}`,
        };
    }
};

const deleteSongService = async (songId) => {
    try {
        await Song.destroy({ where: { id: songId } });
        return {
            errCode: 0,
            errMess: 'Delete song success',
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Internal Server Error ${error.message}`,
        };
    }
};

const updateSongService = async (data) => {
    try {
        console.log(data);
        updateData = data.updateData;
        songId = data.songId;

        if (Object.keys(updateData).length === 0) {
            return {
                errCode: 3,
                errMess: 'Missing data',
            };
        } else {
            const song = await Song.findOne({ where: { id: songId } });
            if (song) {
                const update = await Song.update(updateData, { where: { id: songId } });
                return {
                    errCode: update ? 0 : 3,
                    errMess: update ? 'Song updated successfully' : 'Bad Request',
                };
            } else {
                return {
                    errCode: 6,
                    errMess: 'Song not found',
                };
            }
        }
    } catch (error) {
        return {
            errCode: 8,
            errMess: 'Error server',
        };
    }
};

const createSongService = async (data) => {
    try {
        const song = await Song.findOne({ where: { id: data.songId } });
        if (song) {
            return {
                errCode: 7,
                errMess: 'Song exits',
            };
        } else {
            await Song.create(data);
            return {
                errCode: 0,
                errMess: 'Song created successfully',
            };
        }
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Song creation failed: ${error.message}`,
        };
    }
};

module.exports = {
    getAllSongService,
    getSongService,
    deleteSongService,
    updateSongService,
    createSongService,
};
