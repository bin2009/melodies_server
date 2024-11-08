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
const Fuse = require('fuse.js');

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
            attributes: ['id', 'name', 'username', 'email', 'image', 'accountType', 'status'],
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

const getPlaylistService = async (page, user) => {
    try {
        const limit = 5;
        const start = (page - 1) * limit;
        const end = start + limit;

        const allPlaylist = await db.Playlist.findAll({
            where: { userId: user.id },
            attributes: {
                include: [[db.Sequelize.fn('COUNT', db.Sequelize.col('playlistSongs.playlistSongId')), 'totalSong']],
            },
            include: [{ model: db.PlaylistSong, as: 'playlistSongs', attributes: [] }],
            group: ['id'],
            order: [['createdAt', 'DESC']],
            raw: true,
        });

        const totalPlaylist = allPlaylist.length;
        const totalPage = Math.ceil(totalPlaylist / limit);

        if (page < 1 || page > totalPage) {
            return {
                errCode: 400,
                message: 'Requested page number is out of range',
            };
        }

        const playlists = allPlaylist.slice(start, end);

        let playlistByUser = [];
        for (let i in playlists) {
            const songId = await db.PlaylistSong.findOne({
                where: { playlistId: playlists[i].id },
                attributes: ['songId'],
                order: [['createdAt', 'DESC']],
                raw: true,
            });

            if (songId && songId.songId) {
                const song = await db.Song.findByPk(songId.songId, {
                    attributes: ['id', 'title'],
                    include: [
                        {
                            model: db.Artist,
                            as: 'artists',
                            attributes: ['id', 'name'],
                            through: { attributes: ['main'] },
                        },
                        {
                            model: db.Album,
                            as: 'album',
                            attributes: ['albumId', 'title'],
                            include: [{ model: db.AlbumImage, as: 'albumImages', attributes: ['image', 'size'] }],
                        },
                    ],
                });
                playlistByUser.push({
                    playlistId: playlists[i].id,
                    name: playlists[i].title === '' || playlists[i].title === null ? song.title : playlists[i].title,
                    image: song.album.albumImages,
                    description: playlists[i].description,
                    privacy: playlists[i].privacy,
                    totalSong: parseInt(playlists[i].totalSong),
                });
            } else {
                playlistByUser.push({
                    playlistId: playlists[i].id,
                    name: playlists[i].title,
                    image: null,
                    description: playlists[i].description,
                    privacy: playlists[i].privacy,
                    totalSong: parseInt(playlists[i].totalSong),
                });
            }
        }

        return {
            errCode: 200,
            message: 'Get playlist by user successfully',
            user: user ? 'user' : 'guest',
            page: page,
            totalPage: totalPage,
            playlists: playlistByUser,
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
        // const songInfo = songIds.map((rec) => {
        //     const song = songs.find((s) => s.id === rec.songId);
        //     totalTime = totalTime + song.duration;
        //     return {
        //         ...song.toJSON(),
        //         dateAdded: rec.date,
        //     };
        // });

        const songInfo = songs.map((s) => {
            const { album, artists, ...other } = s.toJSON();
            totalTime = totalTime + s.duration;
            return {
                ...other,
                albumId: album.albumId,
                albumTitle: album.title,
                images: album.albumImages,
                artists: artists.map(({ ArtistSong, ...otherArtist }) => ({
                    ...otherArtist,
                    main: ArtistSong?.main || false,
                })),
            };
        });

        const result = {
            playlistId: playlist.id,
            name: playlist.title,

            image: songInfo[0].images,
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
    const t = await db.sequelize.transaction();

    try {
        if (data.title) {
            const playlist = await db.Playlist.findOne({ where: { title: data.title, userId: user.id } });
            if (playlist) {
                return {
                    errCode: 409,
                    message: 'Playlist exits',
                };
            }
        }

        const count = await db.Playlist.count({ where: { userId: user.id } });

        const newPlaylist = await db.Playlist.create(
            {
                id: uuidv4(),
                userId: user.id,
                title: data.title || `New playlist #${parseInt(count + 1)}`,
                description: data.description || null,
                playlistImage: data.playlistImage || null,
                privacy: false,
            },
            { transaction: t },
        );

        if (data.songId) {
            await db.PlaylistSong.create(
                {
                    playlistSongId: uuidv4(),
                    playlistId: newPlaylist.id,
                    songId: data.songId,
                },
                { transaction: t },
            );
        }

        await t.commit();

        return {
            errCode: 200,
            message: 'Create playlist success',
            newPlaylist: newPlaylist,
        };
    } catch (error) {
        await t.rollback();
        return {
            errCode: 500,
            message: `Create playlist failed: ${error}`,
        };
    }
};

const addSongPlaylistService = async (data, user) => {
    const t = await db.sequelize.transaction();

    try {
        if (!data.playlistId || !data.songId) {
            return {
                errCode: 400,
                message: 'Missing data',
            };
        }
        const playlist = await db.Playlist.findOne({
            where: { id: data.playlistId, userId: user.id },
        });
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

        await db.PlaylistSong.create(
            {
                playlistSongId: uuidv4(),
                playlistId: data.playlistId,
                songId: data.songId,
            },
            { transaction: t },
        );

        await t.commit();

        return {
            errCode: 200,
            message: 'Add song playlist success',
        };
    } catch (error) {
        await t.rollback();
        return {
            errCode: 500,
            message: `Add song playlist failed: ${error}`,
        };
    }
};

const updatePlaylistService = async (data, user) => {
    const t = await db.sequelize.transaction();

    try {
        const playlist = await db.Playlist.findOne({
            where: { id: data.playlistId, userId: user.id },
        });
        if (!playlist) {
            return {
                errCode: 404,
                message: 'Playlist not found',
            };
        }

        await db.Playlist.update(data.data, { where: { id: data.playlistId }, transaction: t });

        await t.commit();
        return {
            errCode: 200,
            message: 'Update playlist success',
        };
    } catch (error) {
        await t.rollback();
        return {
            errCode: 500,
            message: `Update playlist failed: ${error}`,
        };
    }
};

const deleteSongService = async (data, user) => {
    const t = await db.sequelize.transaction();

    try {
        const playlist = await db.Playlist.findOne({
            where: { id: data.playlistId, userId: user.id },
        });
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
        if (!songPlaylist) {
            return {
                errCode: 409,
                message: 'The song is not in the playlist yet.',
            };
        }

        await db.PlaylistSong.destroy(
            {
                where: { playlistId: playlist.id, songId: song.id },
            },
            { transaction: t },
        );

        await t.commit();

        return {
            errCode: 200,
            message: 'Delete song success',
        };
    } catch (error) {
        await t.rollback();

        return {
            errCode: 500,
            message: `Delete song failed: ${error}`,
        };
    }
};

const deletePlaylistService = async (playlistId, user) => {
    try {
        const playlist = await db.Playlist.findOne({
            where: { id: playlistId, userId: user.id },
        });
        if (!playlist) {
            return {
                errCode: 404,
                message: 'Playlist not found',
            };
        }

        await db.Playlist.destroy({ where: { id: playlist.id } });
        return {
            errCode: 200,
            message: 'Delete playlist success',
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Delete playlist failed: ${error}`,
        };
    }
};

const serach2Service = async (query) => {
    const start = 0;
    const end = start + 10;

    const [artists, songs, albums] = await Promise.all([
        db.Artist.findAll({ order: [['createdAt', 'DESC']] }),
        db.Song.findAll({ order: [['releaseDate', 'DESC']] }),
        db.Album.findAll({ order: [['releaseDate', 'DESC']] }),
    ]);

    const dataArtist = artists.map((a) => ({ id: a.id, name: a.name }));
    const dataSong = songs.map((s) => ({ id: s.id, title: s.title }));
    const dataAlbum = albums.map((a) => ({ albumId: a.albumId, title: a.title }));

    const options = {
        keys: ['name'],
        threshold: 0.8,
        includeScore: true,
    };
    const optionsSong = {
        keys: ['title'],
        threshold: 0.5,
        includeScore: true,
    };
    const optionsAlbum = {
        keys: ['title'],
        threshold: 0.5,
        includeScore: true,
    };

    // Fuse.js
    const fuseArtist = new Fuse(dataArtist, options);
    const fuseSong = new Fuse(dataSong, optionsSong);
    const fuseAlbum = new Fuse(dataAlbum, optionsAlbum);

    // Search
    const resultArtist = fuseArtist.search(query);
    const resultSong = fuseSong.search(query);
    const resultAlbum = fuseAlbum.search(query);

    const combinedResults = [
        ...resultArtist.map((result) => ({ ...result.item, score: result.score, type: 'artist' })),
        ...resultSong.map((result) => ({ ...result.item, score: result.score, type: 'song' })),
        ...resultAlbum.map((result) => ({ ...result.item, score: result.score, type: 'album' })),
    ].sort((a, b) => a.score - b.score);

    const [topResult, songTopResult, artistData, songData, albumData] = await Promise.all([
        combinedResults[0].type === 'artist' ? db.Artist.findByPk(combinedResults[0].id) : [],
        combinedResults[0].type === 'artist'
            ? db.Song.findAll({
                  attributes: ['id', 'title', 'releaseDate', 'duration', 'lyric', 'filePathAudio', 'createdAt'],
                  include: [
                      {
                          model: db.ArtistSong,
                          as: 'artistSong',
                          where: { artistId: combinedResults[0].id, main: true },
                          attributes: [],
                      },
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
                  order: [['createdAt', 'DESC']],
                  limit: 5,
              })
            : [],
        db.Artist.findAll({
            where: { id: { [Op.in]: resultArtist.map((r) => r.item.id).slice(start, end) } },
            attributes: ['id', 'name', 'avatar', 'bio'],
        }),
        db.Song.findAll({
            where: { id: { [Op.in]: resultSong.map((r) => r.item.id).slice(start, end) } },
            attributes: ['id', 'title', 'duration', 'lyric', 'filePathAudio', 'releaseDate'],
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
        }),
        db.Album.findAll({
            where: { albumId: { [Op.in]: resultAlbum.map((a) => a.item.albumId).slice(start, end) } },
            attributes: ['albumId', 'title', 'releaseDate'],
            include: [{ model: db.AlbumImage, as: 'albumImages', attributes: ['image', 'size'] }],
        }),
    ]);

    const albumDataDetail = await Promise.all(
        albumData.map(async (album) => {
            const songOfAlbum = await db.Song.findOne({
                where: { albumId: album.albumId },
                attributes: [],
                include: [
                    {
                        model: db.Artist,
                        as: 'artists',
                        attributes: ['id', 'name', 'avatar', 'bio'],
                        through: {
                            attributes: ['main'],
                        },
                    },
                ],
                limit: 1,
            });
            return {
                ...album.toJSON(),
                artists: songOfAlbum.toJSON().artists,
            };
        }),
    );

    return {
        errCode: 200,
        topResult: topResult,
        songTopResult: songTopResult,
        artistData: resultArtist
            .map((r) => artistData.find((artist) => artist.id === r.item.id))
            .filter((artist) => artist),
        songData: resultSong.map((r) => songData.find((song) => song.id === r.item.id)).filter((song) => song),
        albumData: resultAlbum
            .map((r) => albumDataDetail.find((album) => album.albumId === r.item.albumId))
            .filter((album) => album),
    };
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
    serach2Service,
    // ----------------
    getPlaylistService,
    getPlaylistDetailService,
    createPlaylistService,
    addSongPlaylistService,
    updatePlaylistService,
    deleteSongService,
    deletePlaylistService,
};
