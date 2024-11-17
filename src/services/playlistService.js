import db from '~/models';

const checkPlaylistExists = async (playlistId) => {
    return await db.Playlist.findByPk(playlistId);
};

const isPlaylistOwnedByUser = async ({ playlistId, userId } = {}) => {
    const check = await db.Playlist.findOne({ where: { id: playlistId, userId: userId } });
    return check !== null;
};

const fetchAllPlaylist = async ({ conditions = {}, limit = undefined, offset = undefined, mode = 'findAll' } = {}) => {
    const playlists = await db.Playlist[mode]({
        where: conditions,
        attributes: {
            include: [[db.Sequelize.fn('COUNT', db.Sequelize.col('playlistSongs.playlistSongId')), 'totalSong']],
        },
        include: [{ model: db.PlaylistSong, as: 'playlistSongs', attributes: [] }],
        group: ['id'],
        order: [['createdAt', 'DESC']],
        limit: limit,
        offset: offset,
        subQuery: false,
        raw: true,
    });
    return playlists;
};

const fetchOneSongOnPlaylist = async ({ conditions = {} } = {}) => {
    const songId = await db.PlaylistSong.findOne({
        where: conditions,
        attributes: ['songId'],
        order: [['createdAt', 'DESC']],
        raw: true,
    });
    return songId;
};

const fetchPlaylistCount = async ({ conditions = {} } = {}) => {
    const count = await db.Playlist.count({ where: conditions });
    return count;
};

const updatePlaylistService = async ({ playlistId, data } = {}) => {
    const [updatedCount, [playlist]] = await db.Playlist.update(data, { where: { id: playlistId }, returning: true });
    const { playlistImage, ...other } = playlist.toJSON();
    const formatPlaylist = {
        ...other,
        image: playlistImage,
    };
    console.log(formatPlaylist);
    return formatPlaylist;
};

const deletePlaylistService = async ({ playlistId } = {}) => {
    await db.Playlist.destroy({ where: { id: playlistId } });
};

// ---------------------Playlist Song

const checkSongExistsInPlaylist = async ({ playlistId, songId } = {}) => {
    const check = await db.PlaylistSong.findOne({ where: { playlistId: playlistId, songId: songId } });
    return check !== null;
};

const fetchAllSongIdsFromPlaylist = async ({ conditions = {}, limit = undefined, offset = undefined } = {}) => {
    const songIds = await db.PlaylistSong.findAll({
        where: conditions,
        attributes: ['songId', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: limit,
        offset: offset,
        raw: true,
    });
    return songIds;
};

const deleteSongFromPlaylistService = async ({ playlistId, songId } = {}) => {
    await db.PlaylistSong.destroy({
        where: { playlistId: playlistId, songId: songId },
    });
};

export const playlistService = {
    checkPlaylistExists,
    isPlaylistOwnedByUser,
    fetchAllPlaylist,
    fetchOneSongOnPlaylist,
    fetchPlaylistCount,
    updatePlaylistService,
    deletePlaylistService,
    // -----------------------
    checkSongExistsInPlaylist,
    fetchAllSongIdsFromPlaylist,
    deleteSongFromPlaylistService,
};
