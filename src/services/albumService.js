const db = require('../models');
const { Op } = require('sequelize');

const getMoreAlbumService = async (albumId) => {
    try {
        const album = await db.Album.findByPk(albumId, {
            attributes: [
                'albumId',
                'title',
                'releaseDate',
                'albumType',
                [db.Sequelize.fn('COUNT', db.Sequelize.col('songs.id')), 'songNumber'],
            ],
            include: [
                {
                    model: db.Song,
                    as: 'songs',
                    attributes: [],
                },
                {
                    model: db.AlbumImage,
                    as: 'albumImages',
                    attributes: ['image', 'size'],
                },
            ],
            group: ['Album.albumId', 'albumImages.albumImageId'],
        });

        const songs = await db.Song.findAll({
            where: { albumId: album.albumId },
            attributes: {
                exclude: ['createdAt', 'updatedAt'],
            },
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
        });

        // tổng duration của các bài hát
        const durations = songs.map((rec) => rec.duration);
        let totalDuration = 0;
        for (var i in durations) {
            totalDuration = totalDuration + parseInt(durations[i]);
        }

        // lấy ra nghệ sĩ chính
        let artistMain = {};

        const song = songs[0].get({ plain: true });
        for (var i in song.artists) {
            if (song.artists[i].ArtistSong.main == true) {
                artistMain.id = song.artists[i].id;
                artistMain.name = song.artists[i].name;
                break;
            }
        }

        // lấy ra các album khác của nghệ sĩ đó
        const songsAnother = await db.ArtistSong.findAll({
            where: {
                artistId: artistMain.id,
            },
            attributes: ['songId'],
        });

        let albumAnotherIds = await db.Song.findAll({
            where: {
                id: {
                    [Op.in]: songsAnother.map((rec) => rec.songId),
                },
            },
            attributes: ['albumId'],
        });

        const albumAnother = await db.Album.findAll({
            where: {
                albumId: {
                    [Op.in]: [...new Set(albumAnotherIds.map((rec) => rec.albumId))],
                },
            },
            attributes: ['albumId', 'title'],
            include: [
                {
                    model: db.AlbumImage,
                    as: 'albumImages',
                    attributes: ['image', 'size'],
                },
            ],
        });

        const albumWithSong = {
            ...album.toJSON(),
            artistMain: artistMain,
            totalDuration: totalDuration,
            songs: songs,
            albumAnother: albumAnother,
        };

        if (!album) {
            return {
                errCode: 404,
                message: 'Album not found',
            };
        }
        return {
            errCode: 200,
            message: 'Get album successfully',
            albumWithSong: albumWithSong,
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
    getMoreAlbumService,
    getAllAlbumService,
};
