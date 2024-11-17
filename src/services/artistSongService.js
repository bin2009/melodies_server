import db from '~/models';
import { Op } from 'sequelize';

const fetchSongIdsByArtist = async ({
    limit = undefined,
    offset = undefined,
    order = [['createdAt', 'DESC']],
    conditions = {},
} = {}) => {
    const songIdsByArtist = await db.ArtistSong.findAll({
        where: conditions,
        attributes: ['songId', 'createdAt'],
        order: order,
        limit: limit,
        offset: offset,
        raw: true,
    });
    return songIdsByArtist;
};

const fetchSongCountByArtist = async ({ conditions = {} } = {}) => {
    const count = await db.ArtistSong.count({ where: conditions });
    return count;
};

const fetchArtistGenreIds = async ({ artistId } = {}) => {
    const genreIds = await db.ArtistGenre.findAll({
        where: {
            artistId: artistId,
        },
        attributes: ['genreId'],
        raw: true,
    });
    return genreIds;
};

const fetchArtistSameGenre = async ({ artistId, genreIds } = {}) => {
    const artistIds = await db.ArtistGenre.findAll({
        where: {
            [Op.and]: [{ artistId: { [Op.not]: artistId } }, { genreId: { [Op.in]: genreIds.map((g) => g.genreId) } }],
        },
        attributes: ['artistId'],
        raw: true,
    });
    return artistIds;
};

export const artistSongService = {
    fetchSongIdsByArtist,
    fetchSongCountByArtist,
    fetchArtistGenreIds,
    fetchArtistSameGenre,
};
