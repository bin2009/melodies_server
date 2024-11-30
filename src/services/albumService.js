import db from '~/models';
import { Op } from 'sequelize';
import ApiError from '~/utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import { songService } from './songService';
import { artistService } from './artistService';
import formatTime from '~/utils/timeFormat';

const checkAlbumExists = async (albumId) => {
    return await db.Album.findByPk(albumId);
};

const fetchAlbum = async ({ conditions = {}, order = [['createdAt', 'DESC']], mode = 'findAll' } = {}) => {
    const albums = await db.Album[mode]({
        where: conditions,
        include: [
            {
                model: db.Song,
                as: 'songs',
                attributes: [],
                through: { attributes: [] },
            },
            {
                model: db.AlbumImage,
                as: 'albumImages',
                attributes: ['image', 'size'],
            },
            {
                model: db.AlbumSong,
                as: 'albumSong',
                attributes: [],
            },
        ],
        subQuery: false,
        order: order,
    });

    if (mode === 'findAll') {
        const formatteds = albums.map((a) => {
            const formatted = { ...a.toJSON() };
            formatted.createdAt = formatTime(formatted.createdAt);
            formatted.updatedAt = formatTime(formatted.updatedAt);
            formatted.releaseDate = formatTime(formatted.releaseDate);
            return formatted;
        });
        return formatteds;
    } else if (mode === 'findOne') {
        const formatted = albums.toJSON();
        formatted.createdAt = formatTime(formatted.createdAt);
        formatted.updatedAt = formatTime(formatted.updatedAt);
        formatted.releaseDate = formatTime(formatted.releaseDate);
        return formatted;
    }
};

const fetchAlbumCount = async ({ conditions = {} } = {}) => {
    return await db.Album.count({ where: conditions });
};

const fetchAlbumSong = async ({ conditions = {}, limit, offset, order, mode = 'findAll' }) => {
    const albumIds = await db.AlbumSong[mode]({
        where: conditions,
        attributes: ['albumId', 'songId'],
        limit: limit,
        offset: offset,
        order: order,
        raw: true,
    });
    return albumIds;
};

const fetchSongByAlbum = async ({ conditions = {}, mode = 'findAll' }) => {
    const song = await db.AlbumSong[mode]({
        where: conditions,
    });
    return song;
};

const fetchAlbumWithSong = async ({
    conditions = {},
    songConditions = {},
    order = [['createdAt', 'DESC']],
    mode = 'findAll',
} = {}) => {
    const albums = await db.Album[mode]({
        where: conditions,
        include: [
            {
                model: db.Song,
                as: 'songs',
                where: songConditions,
                // attributes: ['id', 'title', ''],
                through: { attributes: [] },
            },
            {
                model: db.AlbumImage,
                as: 'albumImages',
                attributes: ['image', 'size'],
            },
            {
                model: db.AlbumSong,
                as: 'albumSong',
                attributes: [],
            },
        ],
        attributes: { include: [[db.Sequelize.fn('COUNT', db.Sequelize.col('albumSong.songId')), 'songNumber']] },
        group: ['Album.albumId', 'albumImages.albumImageId', 'albumSong.songId'],
        subQuery: false,
        order: order,
    });
    return albums;
};

const getTopAlbumService = async ({ page = 1, limit = 10 } = {}) => {
    try {
        const start = (page - 1) * limit;
        const end = start + limit;

        const albums = await fetchAlbum();

        const result = await Promise.all(
            albums.map(async (album) => {
                const songs = await fetchAlbumSong({ conditions: { albumId: album.albumId } });
                const songPlay = await songService.fetchSongPlayCount({
                    conditions: { songId: { [Op.in]: songs.map((s) => s.songId) } },
                });

                const totalPlay = songPlay.reduce((total, song) => total + parseInt(song.playCount), 0);
                const mainArtistId = await artistService.fetchMainArtist({
                    conditions: { songId: songs[0].songId, main: true },
                });
                const mainArtist = await artistService.fetchArtist({
                    mode: 'findOne',
                    conditions: { id: mainArtistId.artistId },
                });
                return {
                    ...album,
                    totalPlayCount: totalPlay ?? 0,
                    artistMain: mainArtist ?? null,
                };
            }),
        );

        result.sort((a, b) => b.totalPlayCount - a.totalPlayCount);

        return {
            page: page,
            totalPage: Math.ceil(result.length / limit),
            albums: result.slice(start, end),
        };
    } catch (error) {
        throw error;
    }
};

const getAlbumService = async ({ albumId, mode = 'findAll' } = {}) => {
    try {
        const checkAlbum = await checkAlbumExists(albumId);
        if (!checkAlbum) throw new ApiError(StatusCodes.NOT_FOUND, 'Album not found');

        const [album, songsIds] = await Promise.all([
            fetchAlbum({ mode: 'findOne', conditions: { albumId: albumId } }),
            fetchAlbumSong({ conditions: { albumId: albumId } }),
        ]);

        if (!songsIds || songsIds.length === 0) {
            return {
                ...album,
                artistMain: null,
                totalDuration: 0,
                songNumber: 0,
                songs: [],
            };
        }

        const [songs, mainArtistId] = await Promise.all([
            songService.fetchSongs({ conditions: { id: { [Op.in]: songsIds.map((s) => s.songId) } } }),
            artistService.fetchMainArtist({
                conditions: { songId: songsIds[0]?.songId, main: true },
            }),
        ]);
        const totalDuration = songs.reduce((total, song) => total + parseInt(song.duration), 0);
        const mainArtist = await artistService.fetchArtist({
            conditions: { id: mainArtistId.artistId },
            mode: 'findOne',
        });

        const result = {
            ...album,
            artistMain: mainArtist,
            totalDuration: totalDuration,
            songNumber: songsIds.length,
            songs: songs,
        };
        return result;
    } catch (error) {
        throw error;
    }
};

const getAlbumAnotherService = async ({ albumId, page = 1, limit = 10 } = {}) => {
    try {
        const start = (page - 1) * limit;
        const end = start + limit;

        const checkAlbum = await checkAlbumExists(albumId);
        if (!checkAlbum) throw new ApiError(StatusCodes.NOT_FOUND, 'Album not found');

        const song = await fetchSongByAlbum({ conditions: { albumId: albumId }, mode: 'findOne' });
        const artist = await artistService.fetchMainArtist({ conditions: { songId: song.songId, main: true } });
        const songsOfArtist = await artistService.fetchSongIdsByArtist({ artistId: artist.artistId });

        const albumIds = await db.AlbumSong.findAll({ where: { songId: songsOfArtist.map((s) => s.songId) } });

        const albums = await albumService.fetchAlbum({
            // conditions: { albumId: albumIds.map((a) => a.albumId) },
            conditions: { albumId: { [Op.and]: [{ [Op.in]: albumIds.map((a) => a.albumId) }, { [Op.not]: albumId }] } },
        });

        return {
            page: page,
            totalPage: Math.ceil(albums.length / limit),
            albumAnother: albums.slice(start, end),
        };
    } catch (error) {
        throw error;
    }
};

export const albumService = {
    fetchAlbum,
    fetchAlbumCount,
    fetchAlbumSong,
    getTopAlbumService,
    getAlbumService,
    getAlbumAnotherService,
};
