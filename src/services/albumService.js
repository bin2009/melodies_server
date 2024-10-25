const db = require('../models');
const { Op } = require('sequelize');

const getAlbumService = async (albumId) => {
    try {
        // const album = await db.Song.findAll();
        const album = await db.Album.findByPk(albumId, {
            attributes: {
                exclude: ['createdAt', 'updatedAt'],
            },
            include: [
                {
                    model: db.Song,
                    as: 'songs',
                    attributes: { exclude: ['albumId', 'createdAt', 'updatedAt'] },
                    include: [
                        {
                            model: db.Artist,
                            as: 'artists',
                            attributes: ['id', 'name'],
                            through: {
                                attributes: ['main'],
                            },
                        },
                    ],
                },
                {
                    model: db.AlbumImage,
                    as: 'albumImages',
                    attributes: ['image', 'size'],
                },
            ],
        });

        if (!album) {
            return {
                errCode: 404,
                message: 'Album not found',
            };
        }
        return {
            errCode: 200,
            message: 'Get album successfully',
            album: album,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Get album failed: ${error.message}`,
        };
    }
};

const getAllAlbumService = async (offset) => {
    try {
        const albums = await db.Album.findAll({
            attributes: ['albumId', 'title', 'releaseDate', 'albumType'],
            include: [
                {
                    model: db.AlbumImage,
                    as: 'albumImages',
                    attributes: ['image', 'size'],
                },
            ],
            order: [['releaseDate', 'DESC']],
            limit: 10,
            offset: 10 * offset,
        });

        const albumIds = albums.map((record) => record.albumId);

        const songs = await db.Song.findAll({
            where: {
                albumId: {
                    [Op.in]: albumIds,
                },
            },
            attributes: ['id', 'albumId', 'title'],
            include: [
                {
                    model: db.Artist,
                    as: 'artists',
                    attributes: ['id', 'name'],
                    through: {
                        attributes: ['main'],
                    },
                },
            ],
            raw: true,
        });

        const albumArtistsMap = albums.reduce((acc, album) => {
            acc[album.albumId] = {
                id: album.albumId,
                title: album.title,
                releaseDate: album.releaseDate,
                albumType: album.albumType,
                images: album.albumImages,
                artists: [],
            };
            return acc;
        }, {});

        songs.forEach((song) => {
            if (albumArtistsMap[song.albumId]) {
                const artistData = {
                    id: song['artists.id'],
                    name: song['artists.name'],
                    main: song['artists.ArtistSong.main'],
                };

                if (!albumArtistsMap[song.albumId].artists.some((artist) => artist.id === artistData.id)) {
                    albumArtistsMap[song.albumId].artists.push(artistData);
                }
            }
        });

        const albumsWithArtists = Object.values(albumArtistsMap);

        return {
            errCode: 200,
            message: 'Get all albums successfully',
            albums: albumsWithArtists,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Get all album failed: ${error.message}`,
        };
    }
};

module.exports = {
    getAlbumService,
    getAllAlbumService,
};
