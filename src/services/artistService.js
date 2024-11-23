import db from '~/models';
import { Op } from 'sequelize';
import ApiError from '~/utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';

import { timeFormatter } from '~/validations/timeFormatter';
import { albumService } from './albumService';
import { songService } from './songService';
import { genreService } from './genreService';
import { awsService } from './awsService';

const checkArtistExits = async (artistId) => {
    console.log('check artist : ', artistId);
    return await db.Artist.findByPk(artistId);
};

const fetchArtistCount = async ({ conditions = {} } = {}) => {
    const count = await db.Artist.count({ where: conditions });
    return count;
};

const fetchArtistName = async ({ conditions = {} } = {}) => {
    const artists = await db.Artist.findAll({
        where: conditions,
        attributes: ['id', 'name', 'avatar'],
        order: [['createdAt', 'DESC']],
        raw: true,
    });
    return artists;
};

const fetchFollowCount = async ({
    limit,
    offset,
    order = [[db.Sequelize.fn('COUNT', db.Sequelize.col('artistId')), 'DESC']],
    group = ['artistId'],
    conditions = {},
    mode = 'findAll',
} = {}) => {
    const artistIds = await db.Follow[mode]({
        where: conditions,
        attributes: ['artistId', [db.Sequelize.fn('COUNT', db.Sequelize.col('followerId')), 'followCount']],
        group: group,
        order: order,
        limit: limit,
        offset: offset,
        raw: true,
    });
    return artistIds;
};

const fetchSongCount = async ({
    conditions = {},
    limit,
    offset,
    order = [[db.Sequelize.fn('COUNT', db.Sequelize.col('artistSongId')), 'DESC']],
    group = ['artistId'],
    mode = 'findAll',
} = {}) => {
    const artists = await db.ArtistSong[mode]({
        where: conditions,
        attributes: ['artistId', [db.Sequelize.fn('COUNT', db.Sequelize.col('artistSongId')), 'totalSongs']],
        group: group,
        limit: limit,
        offset: offset,
        order: order,
        raw: true,
    });
    return artists;
};

const fetchArtist = async ({
    conditions = {},
    mode = 'findAll',
    limit,
    offset,
    order = [['createdAt', 'DESC']],
} = {}) => {
    const artists = await db.Artist[mode]({
        where: conditions,
        attributes: ['id', 'name', 'avatar', 'bio', 'createdAt'],
        include: [
            {
                model: db.Genre,
                as: 'genres',
                attributes: ['genreId', 'name'],
                through: {
                    attributes: [],
                },
            },
        ],
        order: order,
        limit: limit,
        offset: offset,
    });
    return artists;
};

const fetchUserFollowArtist = async ({ userId, artistIds } = {}) => {
    const artIds = await db.Follow.findAll({
        where: { userId: userId, artistId: { [Op.in]: artistIds.map((a) => a.artistId) } },
        attributes: ['artistId'],
    });
    return artIds;
};

const fetchSongIdsByArtist = async ({ artistId, main = true } = {}) => {
    const songIds = await db.ArtistSong.findAll({
        where: { artistId: artistId, main: main },
        attributes: ['songId'],
    });
    return songIds;
};

const fetchMainArtist = async ({ conditions = {} } = {}) => {
    const artistId = await db.ArtistSong.findOne({
        where: conditions,
        attributes: ['artistId'],
        raw: true,
    });
    return artistId;
};

const fetchSArtistFeatByArtist = async ({ conditions = {}, limit, offset, order = [['createdAt', 'DESC']] } = {}) => {
    const artistIds = await db.ArtistSong.findAll({
        where: conditions,
        attributes: ['artistId'],
        limit: limit,
        offset: offset,
        order: order,
        raw: true,
    });
    return artistIds;
};

const fetchGenreIdsByArtist = async ({ conditions = {} } = {}) => {
    const genreIds = await db.ArtistGenre.findAll({
        where: conditions,
        attributes: ['genreId'],
        raw: true,
    });
    return genreIds;
};

const fetchArtistIdsByGenre = async ({ conditions = {} } = {}) => {
    const artistIds = await db.ArtistGenre.findAll({
        where: conditions,
        attributes: ['artistId'],
        raw: true,
    });
    return artistIds;
};
const getPopularArtistService = async ({ limit = 10, page = 1, user } = {}) => {
    try {
        const offset = (page - 1) * limit;
        const [totalArtist, topArtist] = await Promise.all([
            fetchArtistCount(),
            fetchFollowCount({ limit: limit, offset: offset }),
        ]);

        const [popularArtists, followed] = await Promise.all([
            fetchArtist({
                conditions: { id: { [Op.in]: topArtist.map((record) => record.artistId) } },
            }),
            user && fetchUserFollowArtist({ userId: user.id, artistIds: topArtist }),
        ]);

        const followedMap = new Set(followed?.map((f) => f.artistId));

        const artistMap = popularArtists.reduce((acc, artist) => {
            acc[artist.id] = artist.toJSON();
            return acc;
        }, {});

        const result = topArtist.map((rec) => ({
            ...artistMap[rec.artistId],
            followCount: rec.followCount,
            followed: user && followedMap.has(rec.artistId),
        }));

        return {
            page: page,
            totalPage: Math.ceil(totalArtist / limit),
            popularArtist: result,
        };
    } catch (error) {
        throw error;
    }
};

const getAllArtistService = async ({ sortBy, sortOrder = 'desc', page = 1, user, limit = 10 } = {}) => {
    try {
        const offset = (page - 1) * limit;
        const start = (page - 1) * limit;
        const end = start + limit;

        const sortByMap = ['name', 'totalSong', 'totalAlbum', 'totalFollow'];
        const sortOrderMap = ['desc', 'asc'];

        if (!sortOrderMap.includes(sortOrder))
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                'Invalid "sort order" value. Allowed values are: "high", "low".',
            );
        if (sortBy && !sortByMap.includes(sortBy))
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                'Invalid "sort by" value. Allowed values are: "name", "totalSong", "totalAlbum", "totalFollow".',
            );

        const sort = sortOrder === 'desc' ? [['createdAt', 'DESC']] : [['createdAt', 'ASC']];
        const artists = await fetchArtist({ order: sort });

        const [totalSongs, totalFollow] = await Promise.all([
            fetchSongCount({ conditions: { artistId: { [Op.in]: artists.map((a) => a.id) }, main: true } }),
            fetchFollowCount({ conditions: { artistId: { [Op.in]: artists.map((a) => a.id) } } }),
        ]);

        const totalSongsMap = totalSongs.reduce((acc, curr) => {
            acc[curr.artistId] = curr.totalSongs;
            return acc;
        }, {});
        const totalFollowMap = totalFollow.reduce((acc, curr) => {
            acc[curr.artistId] = curr.followCount;
            return acc;
        }, {});

        const result = await Promise.all(
            artists.map(async (artist) => {
                const songIds = await fetchSongIdsByArtist({ artistId: artist.id });
                const albums = await albumService.fetchAlbumIds({
                    songConditions: { id: songIds.map((s) => s.songId) },
                });
                const { createdAt, ...other } = artist.toJSON();
                return {
                    ...other,
                    createdAt: timeFormatter.formatDateToVietnamTime(createdAt),
                    totalSong: totalSongsMap[artist.id] ?? 0,
                    totalAlbum: albums.length,
                    totalFollow: totalFollowMap[artist.id] ?? 0,
                };
            }),
        );

        if (sortBy) {
            result.sort((a, b) => {
                if (sortBy === 'name') {
                    return sortOrder === 'desc'
                        ? b[sortBy].localeCompare(a[sortBy])
                        : a[sortBy].localeCompare(b[sortBy]);
                } else {
                    return sortOrder === 'desc' ? b[sortBy] - a[sortBy] : a[sortBy] - b[sortBy];
                }
            });
        }

        return {
            page: page,
            totalPage: Math.ceil(artists.length / limit),
            artists: result.slice(start, end),
        };
    } catch (error) {
        throw error;
    }
};

const getArtistService = async ({ artistId } = {}) => {
    try {
        const checkArtist = await checkArtistExits(artistId);
        if (!checkArtist) throw new ApiError(StatusCodes.NOT_FOUND, 'Artist not found');

        const [artist, totalFollow, totalSong] = await Promise.all([
            fetchArtist({ mode: 'findOne', conditions: { id: artistId } }),
            fetchFollowCount({ mode: 'findOne', conditions: { artistId: artistId } }),
            fetchSongCount({ mode: 'findOne', conditions: { artistId: artistId, main: true } }),
        ]);

        const data = {
            ...artist.toJSON(),
            totalFollow: totalFollow ? parseInt(totalFollow.followCount) : 0,
            totalSong: totalSong ? parseInt(totalSong.totalSongs) : 0,
        };

        return data;
    } catch (error) {
        throw error;
    }
};

const getPopSongService = async ({ artistId, page = 1, user, limit = 10 } = {}) => {
    try {
        const offset = (page - 1) * limit;
        const checkArtist = await checkArtistExits(artistId);
        if (!checkArtist) throw new ApiError(StatusCodes.NOT_FOUND, 'Artist not found');

        const songsOfArtist = await fetchSongIdsByArtist({ artistId: artistId });
        console.log(songsOfArtist.length);
        const songIds = await songService.fetchSongPlayCount({
            conditions: { songId: { [Op.in]: songsOfArtist.map((s) => s.songId) } },
            limit: limit,
            offset: offset,
        });
        console.log(songIds.length);

        const songs = await songService.fetchSongs({
            conditions: { id: { [Op.in]: songIds.map((s) => s.songId) } },
            additionalAttributes: [[db.Sequelize.fn('COUNT', db.Sequelize.col('playHistory.historyId')), 'viewCount']],
            group: [
                'Song.id',
                'album.albumId',
                'album.albumImages.albumImageId',
                'artists.id',
                'artists->ArtistSong.artistSongId',
                'artists->genres.genreId',
            ],
        });

        const songsMap = songs.reduce((acc, record) => {
            acc[record.id] = record.toJSON();
            return acc;
        }, {});

        const result = songIds.map((song) => ({
            ...songsMap[song.songId],
        }));

        return {
            page: page,
            totalPage: Math.ceil(songsOfArtist.length / limit),
            popSong: result,
        };
    } catch (error) {
        throw error;
    }
};

const getAlbumFromArtistService = async ({ artistId, page = 1, limit = 10 } = {}) => {
    try {
        const start = (page - 1) * limit;
        const end = start + limit;
        const checkArtist = await checkArtistExits(artistId);
        if (!checkArtist) throw new ApiError(StatusCodes.NOT_FOUND, 'Artist not found');

        const songsOfArtist = await fetchSongIdsByArtist({ artistId: artistId });

        const albums = await albumService.fetchAlbumIds({
            songConditions: { id: songsOfArtist.map((s) => s.songId) },
            conditions: { albumType: { [Op.not]: 'single' } },
        });

        return {
            page: page,
            totalPage: Math.ceil(albums.length / limit),
            artistAlbum: albums.slice(start, end),
        };
    } catch (error) {
        throw error;
    }
};

const getSingleFromArtistService = async ({ artistId, page = 1, limit = 10 } = {}) => {
    try {
        const start = (page - 1) * limit;
        const end = start + limit;

        const checkArtist = await checkArtistExits(artistId);
        if (!checkArtist) throw new ApiError(StatusCodes.NOT_FOUND, 'Artist not found');

        const songsOfArtist = await fetchSongIdsByArtist({ artistId: artistId });

        const singles = await albumService.fetchAlbumIds({
            songConditions: { id: songsOfArtist.map((s) => s.songId) },
            conditions: { albumType: { [Op.eq]: 'single' } },
        });

        return {
            page: page,
            totalPage: Math.ceil(singles.length / limit),
            artistSingle: singles.slice(start, end),
        };
    } catch (error) {
        throw error;
    }
};

const getArtistFeatService = async ({ artistId, page = 1, limit = 10 } = {}) => {
    try {
        const start = (page - 1) * limit;
        const end = start + limit;

        const checkArtist = await checkArtistExits(artistId);
        if (!checkArtist) throw new ApiError(StatusCodes.NOT_FOUND, 'Artist not found');

        const songIds = await fetchSongIdsByArtist({ artistId: artistId });

        const artistFeatIds = await fetchSArtistFeatByArtist({
            conditions: { songId: { [Op.in]: songIds.map((i) => i.songId) }, main: false },
        });
        const artistFeat = await fetchArtist({ conditions: { id: { [Op.in]: artistFeatIds.map((a) => a.artistId) } } });

        return {
            page: page,
            totalPage: Math.ceil(artistFeatIds.length / limit),
            data: artistFeat.slice(start, end),
        };
    } catch (error) {
        throw error;
    }
};

const getArtistSameGenreService = async ({ artistId, page = 1, limit = 10 } = {}) => {
    try {
        const offset = (page - 1) * limit;

        const checkArtist = await checkArtistExits(artistId);
        if (!checkArtist) throw new ApiError(StatusCodes.NOT_FOUND, 'Artist not found');

        const genreIds = await fetchGenreIdsByArtist({ conditions: { artistId: artistId } });
        const genre = await genreService.fetchGenre({
            conditions: { genreId: { [Op.in]: genreIds.map((g) => g.genreId) } },
        });
        const artistsIds = await fetchArtistIdsByGenre({
            conditions: {
                [Op.and]: [{ genreId: { [Op.in]: genre.map((g) => g.genreId) } }, { artistId: { [Op.not]: artistId } }],
            },
        });

        const artistsIdsMap = new Set(artistsIds.map((a) => a.artistId));
        const artistIdsArray = [...artistsIdsMap];

        const artists = await fetchArtist({
            limit: limit,
            offset: offset,
            conditions: { id: { [Op.in]: artistIdsArray } },
        });

        return {
            page: page,
            totalPage: Math.ceil(artistIdsArray.length / limit),
            artistSameGenre: artists,
        };
    } catch (error) {
        throw error;
    }
};

const createArtistService = async ({ data, file } = {}) => {
    const transaction = await db.sequelize.transaction();
    let avatarUrl = null;

    try {
        let id = uuidv4();
        if (file) {
            avatarUrl = await awsService.uploadArtistAvatar(id, file);
        }

        const existingGenres = await genreService.checkGenreExists({
            mode: 'findAll',
            conditions: { genreId: { [Op.in]: data.genres.map((g) => g.genreId) } },
        });

        if (existingGenres.length !== data.genres.length)
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Genre not found');

        const artist = await db.Artist.create(
            {
                id: id,
                name: data.name,
                avatar: avatarUrl,
                bio: data.bio,
            },
            { transaction },
        );

        await Promise.all(
            data.genres.map(async (gen) => {
                await db.ArtistGenre.create(
                    {
                        artistGenreId: uuidv4(),
                        artistId: artist.id,
                        genreId: gen.genreId,
                    },
                    { transaction },
                );
            }),
        );

        await transaction.commit();
        return await fetchArtist({ conditions: { id: artist.id } });
    } catch (error) {
        await transaction.rollback();
        if (avatarUrl) {
            await awsService.deleteFile(avatarUrl);
        }
        throw error;
    }
};

const getSongOfArtistService = async ({ artistId } = {}) => {
    try {
        const songs = await db.Song.findAll({
            include: [
                {
                    model: db.Artist,
                    as: 'artists',
                    where: { id: artistId },
                    attributes: [],
                    through: { attributes: [] },
                },
            ],
            attributes: ['id', 'title'],
        });
        return songs;
    } catch (error) {
        throw error;
    }
};

export const artistService = {
    checkArtistExits,
    fetchArtist,
    fetchArtistName,
    fetchMainArtist,
    fetchSongIdsByArtist,
    getAllArtistService,
    getArtistService,
    getPopularArtistService,
    getPopSongService,
    getAlbumFromArtistService,
    getSingleFromArtistService,
    getArtistFeatService,
    getArtistSameGenreService,
    createArtistService,
    // ----------------
    getSongOfArtistService,
};
