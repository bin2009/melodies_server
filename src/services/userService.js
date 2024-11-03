const bcrypt = require('bcryptjs');
const saltRounds = 10;
const { v4: uuidv4 } = require('uuid');

const db = require('../models');
const User = db.User;
const SongPlayHistory = db.SongPlayHistory;
const Like = db.Like;
const Follow = db.Follow;
const sequelize = db.sequelize;
const removeAccents = require('remove-accents');
const { Op } = require('sequelize');

const getUsersService = async (offset) => {
    try {
        const users = await db.User.findAll({
            attributes: ['id', 'name', 'email', 'image', 'accountType', 'status'],
            order: [['createdAt', 'DESC']],
            limit: 10,
            offset: 10 * offset,
        });
        return {
            errCode: 200,
            message: 'Get all user successfully',
            users: users,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Get all users failed: ${error}`,
        };
    }
};

const getUserService = async (userId) => {
    try {
        const user = await db.User.findByPk(userId, {
            raw: true,
            attributes: ['id', 'name', 'email', 'image', 'accountType', 'status'],
        });
        return {
            errCode: 200,
            message: 'Get user successfully',
            user: user,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Get user failed: ${error}`,
        };
    }
};

const deleteUserService = async (userId) => {
    try {
        const user = await db.User.findByPk(userId);
        if (!user) {
            return {
                errCode: 404,
                message: 'User not found',
            };
        }

        await db.User.destroy({ where: { id: userId } });

        return {
            errCode: 200,
            message: 'User deleted successfully',
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Delete user failed: ${error}`,
        };
    }
};

const updateUserService = async (data) => {
    try {
        if (!data.id) {
            return {
                errCode: 400,
                message: 'User id required',
            };
        }
        const user = await db.User.findByPk(data.id);
        if (!user) {
            return {
                errCode: 404,
                message: 'User not found',
            };
        }

        await db.User.update(data, { where: { id: data.id } });
        return {
            errCode: 200,
            message: 'User updated successfully',
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Update user failed: ${error.message}`,
        };
    }
};

const registerService = async (data) => {
    try {
        const hashPass = await bcrypt.hash(data.password, saltRounds);
        data.password = hashPass;
        data.role = 'User';
        data.statusPassword = false;
        data.accountType = 'Free';
        data.status = true;
        const newUser = await User.create(data);
        return {
            errCode: 0,
            errMess: 'User created successfully',
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: `User creation failed: ${error.message}`,
        };
    }
};

const changePasswordService = async (data, user) => {
    try {
        // check pass
        const findUser = await db.User.findByPk(user.id);

        const validPass = await bcrypt.compare(data.oldPass, findUser.password);
        if (!validPass) {
            return {
                errCode: 401,
                message: 'Wrong password',
            };
        }

        // change pass
        const hashPass = await bcrypt.hash(data.newPass, saltRounds);
        await db.User.update({ password: hashPass }, { where: { id: user.id } });
        return {
            errCode: 200,
            message: 'Change password success',
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Change password failed: ${error.message}`,
        };
    }
};

// ---------------------------HOME------------------------

// ---------------------------WORKING WITH MUSIC------------------------

const playTimeService = async (data, user) => {
    try {
        const song = await db.Song.findByPk(data.songId);

        if (!song) {
            return {
                errCode: 404,
                message: 'Song not found',
            };
        }

        const playtime = await db.SongPlayHistory.create({
            historyId: uuidv4(),
            userId: user.id,
            songId: data.songId,
            playtime: data.playtime,
        });

        return {
            errCode: 200,
            message: 'Play time successfully',
            playtime: playtime,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Play time failed: ${error.message}`,
        };
    }
};

const likedSongService = async (data, user) => {
    try {
        const like = await Like.findOne({
            where: {
                userId: user.id,
                songId: data.songId,
            },
        });

        if (like) {
            await Like.destroy({ where: { likeId: like.likeId } });
            return {
                errCode: 200,
                message: 'Delete like successfully',
            };
        } else {
            await Like.create({
                likeId: uuidv4(),
                userId: user.id,
                songId: data.songId,
            });
            return {
                errCode: 201,
                message: 'Like Successfully',
            };
        }
    } catch (error) {
        return {
            errCode: 500,
            message: `Like song failed: ${error.message}`,
        };
    }
};

const followedArtistService = async (data, user) => {
    try {
        const follow = await Follow.findOne({
            where: {
                userId: user.id,
                artistId: data.artistId,
            },
        });
        if (follow) {
            await Follow.destroy({ where: { followerId: follow.followerId } });
            return {
                errCode: 200,
                message: 'Delete follow successfully',
            };
        } else {
            await Follow.create({
                followerId: uuidv4(),
                userId: user.id,
                artistId: data.artistId,
            });
            return {
                errCode: 201,
                message: 'Follow Successfully',
            };
        }
    } catch (error) {
        return {
            errCode: 500,
            message: `Follow artist failed: ${error.message}`,
        };
    }
};

const commentService = async (data, user) => {
    try {
        const comment = await db.Comment.create({
            id: uuidv4(),
            userId: user.id,
            songId: data.songId,
            content: data.content,
            commentParentId: data.commentParentId || null,
        });
        return {
            errCode: 200,
            message: 'Comment successfully',
            comment: comment,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Comment failed: ${error.message}`,
        };
    }
};

// ---------------------------SUBSCRIPTION------------------------

const subscriptionService = async (user, packageId) => {
    try {
        const package = await db.SubscriptionPackage.findByPk(packageId);
        if (!package) {
            return {
                errCode: 404,
                message: 'Package not found',
            };
        }

        let dateCount = 0;
        if (package.time == '7 Day') {
            dateCount = 7;
        } else if (package.time == '1 Month') {
            dateCount = 30;
        } else if (package.time == '3 Month') {
            dateCount = 90;
        }

        let startDate = new Date();
        let endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + dateCount);

        let data = {
            id: uuidv4(),
            userId: user.id,
            packageId: packageId,
            startDate: startDate,
            endDate: endDate,
            paymentMethod: 'CreditCard',
            status: 'Pending',
        };

        await db.Subscriptions.create(data);

        return {
            errCode: 200,
            message: 'Registered successfully, please pay',
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Subscription failed: ${error.message}`,
        };
    }
};

const serachService = async (query) => {
    try {
        // xử lý query
        let normalizedQuery = removeAccents(query.toLowerCase()).trim();
        normalizedQuery = normalizedQuery.replace(/[^a-z0-9\s]/g, '');

        let keywords = normalizedQuery.split(/\s+/);
        keywords = keywords.map((keyword) => removeAccents(keyword.toLowerCase()));

        // tìm theo nghệ sĩ
        const artists = await db.Artist.findAll({
            where: {
                [Op.or]: keywords.map((keyword) =>
                    db.Sequelize.where(
                        db.Sequelize.fn('lower', db.Sequelize.fn('unaccent', db.Sequelize.col('name'))),
                        { [Op.like]: `%${keyword}%` },
                    ),
                ),
            },
            raw: true,
        });

        if (artists.length > 0) {
            // lấy ra nghệ sĩ chính: top result:
            const artistIds = artists.map((rec) => rec.id);

            const followCounts = await db.Follow.findAll({
                where: {
                    artistId: {
                        [Op.in]: artistIds,
                    },
                },
                attributes: ['artistId', [db.Sequelize.fn('COUNT', db.Sequelize.col('followerId')), 'followCount']],
                group: ['artistId'],
                order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('followerId')), 'DESC']],
                limit: 1,
                raw: true,
            });

            const topResult = artists.find((artist) => {
                return artist.id === followCounts[0].artistId;
            });

            const songFromTopArtistResult = await db.ArtistSong.findAll({
                where: {
                    artistId: topResult.id,
                },
                attributes: ['songId'],
                raw: true,
            });

            const songFromTopArtistResultId = songFromTopArtistResult.map((rec) => rec.songId);

            const topSong = await db.SongPlayHistory.findAll({
                where: {
                    songId: {
                        [Op.in]: songFromTopArtistResultId,
                    },
                },
                attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('historyId')), 'playCount']],
                order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('historyId')), 'DESC']],
                group: ['SongPlayHistory.songId'],
                limit: 5,
                raw: true,
            });

            const topSongIds = topSong.map((rec) => rec.songId);

            const topSongDetail = await db.Song.findAll({
                where: {
                    id: {
                        [Op.in]: topSongIds,
                    },
                },
                attributes: {
                    exclude: ['createdAt', 'updatedAt'],
                },
                include: [
                    {
                        model: db.Album,
                        as: 'album',
                        attributes: ['albumId', 'title', 'releaseDate'],
                        include: [
                            {
                                model: db.AlbumImage,
                                as: 'albumImages',
                                attributes: ['image', 'size'],
                            },
                        ],
                    },
                    {
                        model: db.Artist,
                        as: 'artists',
                        attributes: ['id', 'name', 'avatar'],
                        through: {
                            attributes: ['main'],
                        },
                    },
                ],
            });

            var topSongDetailByArtist = topSong.map((rec) => {
                const song = topSongDetail.find((f) => f.id === rec.songId);
                return {
                    ...song.toJSON(),
                    playCount: rec.playCount,
                };
            });

            topSongDetailByArtist = {
                artist: topResult,
                songs: topSongDetailByArtist,
            };
        }

        // tìm theo album
        const albums = await db.Album.findAll({
            where: {
                [Op.or]: keywords.map((keyword) =>
                    db.Sequelize.where(
                        db.Sequelize.fn('lower', db.Sequelize.fn('unaccent', db.Sequelize.col('title'))),
                        { [Op.like]: `%${keyword}%` },
                    ),
                ),
            },
            include: [
                {
                    model: db.AlbumImage,
                    as: 'albumImages',
                    attributes: ['image', 'size'],
                },
            ],
        });

        if (albums.length > 0) {
            var albumIds = albums.map((rec) => rec.albumId);

            var albumWithArtist = {};

            for (let i in albumIds) {
                // lấy ra song -> lấy ra artist

                const song = await db.Song.findAll({
                    where: {
                        albumId: albumIds[i],
                    },
                    attributes: [],
                    include: [
                        {
                            model: db.Artist,
                            as: 'artists',
                            attributes: {
                                exclude: ['createdAt', 'updatedAt'],
                            },
                            through: {
                                attributes: ['main'],
                            },
                        },
                    ],
                    limit: 1,
                });

                albumWithArtist[albumIds[i]] = song.artists;
            }

            var albumSearch = albums.map((ab) => {
                const artists = albumWithArtist[ab.albumId];
                return {
                    ...ab.toJSON(),
                    artists: artists,
                };
            });
        }

        // theo the loai
        const genres = await db.Genre.findAll({
            where: {
                [Op.or]: keywords.map((keyword) =>
                    db.Sequelize.where(
                        db.Sequelize.fn('lower', db.Sequelize.fn('unaccent', db.Sequelize.col('name'))),
                        { [Op.like]: `%${keyword}%` },
                    ),
                ),
            },
            raw: true,
        });

        if (genres.length > 0) {
            // lay ra cac bai hat cung the loai
            var genreSearch = [];

            for (let i in genres) {
                // console.log(i, genres[i]);
                let genreName = genres[i].name;
                // lay ra cac nghe si the loai do

                const artists = await db.ArtistGenre.findAll({
                    where: {
                        genreId: genres[i].genreId,
                    },
                    raw: true,
                });

                const artistIds = artists.map((rec) => rec.artistId);

                var artistSameGenre = await db.Artist.findAll({
                    where: {
                        id: {
                            [Op.in]: artistIds,
                        },
                    },
                    attributes: {
                        exclude: ['createdAt', 'updatedAt'],
                    },
                });

                genreSearch.push({
                    genreId: genres[i].genreId,
                    genreName: genreName,
                    artists: artistSameGenre,
                });
            }
        }

        // tim theo bai hat
        const songSearch = await db.Song.findAll({
            where: {
                [Op.or]: keywords.map((keyword) =>
                    db.Sequelize.where(
                        db.Sequelize.fn('lower', db.Sequelize.fn('unaccent', db.Sequelize.col('Song.title'))),
                        { [Op.like]: `%${keyword}%` },
                    ),
                ),
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
                {
                    model: db.Album,
                    as: 'album',
                    attributes: ['albumId', 'title', 'releaseDate', 'albumType'],
                    include: [{ model: db.AlbumImage, as: 'albumImages', attributes: ['image', 'size'] }],
                },
            ],
            attributes: ['id', 'title', 'duration', 'lyric', 'filePathAudio', 'releaseDate'],
            // raw: true,
        });

        let topResult;
        if (topSongDetailByArtist && topSongDetailByArtist.songs?.length > 0) {
            topResult = topSongDetailByArtist;
        } else {
            topResult = {};
        }
        return {
            errCode: 200,
            text: query,
            // topResult: topSongDetailByArtist && topSongDetailByArtist.songs ? topSongDetailByArtist : {},
            topResult: topResult,
            artists: artists,
            albums: albumSearch || [],
            genres: genreSearch || [],
            songs: songSearch || [],
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Search failed: ${error.message}`,
        };
    }
};

// ---------------------------PLAYLIST------------------------

const getPlaylistService = async (userId) => {
    try {
        const playlists = await db.UserPlaylist.findAll({
            where: {
                userId: userId,
            },
        });

        const playlistIds = playlists.map((rec) => rec.playlistId);

        const playlistByUser = await db.Playlist.findAll({
            where: {
                id: {
                    [Op.in]: playlistIds,
                },
            },
            include: [
                {
                    model: db.PlaylistSong,
                    as: 'playlistSongs',
                    attributes: [],
                },
            ],
            attributes: {
                include: [[db.Sequelize.fn('COUNT', db.Sequelize.col('playlistSongs.playlistSongId')), 'songCount']],
            },
            group: ['Playlist.id'],
        });

        // xử lý tên và ảnh của playlist
        // id playlist -> tìm song mới nhất
        var playlistDetailByUser = [];

        for (let i in playlistIds) {
            const playlist = playlistByUser.find((f) => f.id === playlistIds[i]).get({ plain: true });

            const songFirstPlaylist = await db.PlaylistSong.findOne({
                where: {
                    playlistId: playlistIds[i],
                },
                attributes: ['songId'],
                order: [['createdAt', 'DESC']],
                raw: true,
            });

            const songFirstPlaylistDetail = await db.Song.findOne({
                where: {
                    id: songFirstPlaylist.songId,
                },
                attributes: ['id', 'albumId', 'title'],
            });

            const album = await db.Album.findOne({
                where: {
                    albumId: songFirstPlaylistDetail.albumId,
                },
                attributes: [],
                include: [
                    {
                        model: db.AlbumImage,
                        as: 'albumImages',
                        attributes: ['image', 'size'],
                    },
                ],
            });

            playlistDetailByUser.push({
                playlistId: playlistIds[i],
                name: playlist.title === 'Null' ? songFirstPlaylistDetail.title : playlist.title,
                image: album,
                description: playlist.description,
                privacy: playlist.privacy,
                totalSong: parseInt(playlist.songCount),
            });
        }

        return {
            errCode: 200,
            message: 'Get playlist by user successfully',
            playlists: playlistDetailByUser,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Get playlist failed: ${error}`,
        };
    }
};

const getPlaylistDetailService = async (playlistId) => {
    try {
        const playlist = await db.Playlist.findByPk(playlistId);

        if (!playlist) {
            return {
                errCode: 404,
                message: 'Playlist not found',
            };
        }

        const songIds = await db.PlaylistSong.findAll({
            where: {
                playlistId: playlistId,
            },
            attributes: ['songId', 'createdAt'],
            order: [['createdAt', 'DESC']],
            raw: true,
        });

        const songs = await db.Song.findAll({
            where: {
                id: {
                    [Op.in]: songIds.map((s) => s.songId),
                },
            },
            attributes: ['id', 'title', 'releaseDate', 'duration', 'lyric', 'filePathAudio'],
            include: [
                {
                    model: db.Album,
                    as: 'album',
                    attributes: ['albumId', 'title', 'releaseDate'],
                    include: [
                        {
                            model: db.AlbumImage,
                            as: 'albumImages',
                            attributes: ['image', 'size'],
                        },
                    ],
                },
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

        let totalTime = 0;
        const songInfo = songIds.map((rec) => {
            const song = songs.find((s) => s.id === rec.songId);
            totalTime = totalTime + song.duration;
            return {
                ...song.toJSON(),
                dateAdded: rec.date,
            };
        });

        const result = {
            playlistId: playlist.id,
            name: playlist.title === 'Null' ? songInfo[0].title : playlist.title,
            image: songInfo[0].album.albumImages,
            description: playlist.description || null,
            totalTime: totalTime,
            totalSong: songIds.length,
            songsOfPlaylist: songInfo,
        };

        return {
            errCode: 200,
            message: 'Get playlist detail successfully',
            playlist: result,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Get playlist detail failed: ${error}`,
        };
    }
};

const createPlaylistService = async (data, user) => {
    try {
        const playlist = await db.Playlist.findOne({ where: { title: data.title } });
        if (playlist) {
            return {
                errCode: 409,
                message: 'Playlist exits',
            };
        }

        const song = await db.Song.findByPk(data.songId);
        if (!song) {
            return {
                errCode: 404,
                message: 'Song not found',
            };
        }

        const newPlaylist = await db.Playlist.create({
            id: uuidv4(),
            title: data.title,
            description: data.description || null,
            playlistImage: data.playlistImage || null,
            privacy: false,
        });

        await db.UserPlaylist.create({
            id: uuidv4(),
            userId: user.id,
            playlistId: newPlaylist.id,
        });

        if (data.songId) {
            await db.PlaylistSong.create({
                playlistSongId: uuidv4(),
                playlistId: newPlaylist.id,
                songId: data.songId,
            });
        }

        return {
            errCode: 200,
            message: 'Create playlist success',
            newPlaylist: newPlaylist,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Create playlist failed: ${error}`,
        };
    }
};

const addSongPlaylistService = async (data, user) => {
    try {
        const playlist = await db.Playlist.findByPk(data.playlistId);
        if (!playlist) {
            return {
                errCode: 404,
                message: 'Playlist not found',
            };
        }
        const song = await db.Song.findByPk(data.songId);
        if (!song) {
            return {
                errCode: 404,
                message: 'Song not found',
            };
        }
        const songPlaylist = await db.PlaylistSong.findOne({
            where: {
                playlistId: playlist.id,
                songId: song.id,
            },
        });
        if (songPlaylist) {
            return {
                errCode: 409,
                message: 'The song is already in the playlist.',
            };
        }
        const checkUserPlaylist = await db.UserPlaylist.findOne({
            where: {
                userId: user.id,
                playlistId: playlist.id,
            },
        });
        if (!checkUserPlaylist) {
            return {
                errCode: 403,
                message: 'You do not have permission to perform this action',
            };
        }
        await db.PlaylistSong.create({
            playlistSongId: uuidv4(),
            playlistId: data.playlistId,
            songId: data.songId,
        });

        return {
            errCode: 200,
            message: 'Add song playlist success',
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Add song playlist failed: ${error}`,
        };
    }
};

const updatePlaylistService = async (data, user) => {
    try {
        const playlist = await db.Playlist.findByPk(data.playlistId);
        if (!playlist) {
            return {
                errCode: 404,
                message: 'Playlist not found',
            };
        }
        const checkUserPlaylist = await db.UserPlaylist.findOne({
            where: {
                userId: user.id,
                playlistId: playlist.id,
            },
        });
        if (!checkUserPlaylist) {
            return {
                errCode: 403,
                message: 'You do not have permission to perform this action',
            };
        }

        await db.Playlist.update(data.data, { where: { id: data.playlistId } });

        return {
            errCode: 200,
            message: 'Update playlist success',
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Update playlist failed: ${error}`,
        };
    }
};

const deleteSongService = async (data, user) => {
    try {
        const playlist = await db.Playlist.findByPk(data.playlistId);
        if (!playlist) {
            return {
                errCode: 404,
                message: 'Playlist not found',
            };
        }
        const song = await db.Song.findByPk(data.songId);
        if (!song) {
            return {
                errCode: 404,
                message: 'Song not found',
            };
        }
        const songPlaylist = await db.PlaylistSong.findOne({
            where: {
                playlistId: playlist.id,
                songId: song.id,
            },
        });
        if (songPlaylist) {
            return {
                errCode: 409,
                message: 'The song is already in the playlist.',
            };
        }
        const checkUserPlaylist = await db.UserPlaylist.findOne({
            where: {
                userId: user.id,
                playlistId: playlist.id,
            },
        });
        if (!checkUserPlaylist) {
            return {
                errCode: 403,
                message: 'You do not have permission to perform this action',
            };
        }

        await db.PlaylistSong.destroy({
            where: { playlistId: playlist.id, songId: song.id },
        });

        return {
            errCode: 200,
            message: 'Delete song success',
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Delete song failed: ${error}`,
        };
    }
};

module.exports = {
    getUsersService,
    getUserService,
    deleteUserService,
    updateUserService,
    registerService,
    // -------------------
    playTimeService,
    likedSongService,
    followedArtistService,
    commentService,
    // -------------------
    changePasswordService,
    subscriptionService,
    // -----------------
    serachService,
    // ----------------
    getPlaylistService,
    getPlaylistDetailService,
    createPlaylistService,
    addSongPlaylistService,
    updatePlaylistService,
    deleteSongService,
};
