const bcrypt = require('bcryptjs');
const saltRounds = 10;
const { v4: uuidv4 } = require('uuid');

const db = require('../models');
const User = db.User;
const SongPlayHistory = db.SongPlayHistory;
const Like = db.Like;
const Follow = db.Follow;
const sequelize = db.sequelize;

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

// ---------------------------HOME------------------------

// ---------------------------WORKING WITH MUSIC------------------------

const playTimeService = async (data) => {
    try {
        // data.historyId = uuidv4(); // Sử dụng UUID mới nếu không có
        // await SongPlayHistory.create(data);

        // Kiểm tra xem người dùng và bài hát có tồn tại không
        const user = await User.findByPk(data.userId);
        const song = await db.Song.findByPk(data.songId);

        if (!user) {
            return {
                errCode: 1,
                errMess: 'User not found',
            };
        }

        if (!song) {
            return {
                errCode: 2,
                errMess: 'Song not found',
            };
        }
        // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
        await sequelize.transaction(async (t) => {
            // Tạo mới thời gian phát bài hát
            await SongPlayHistory.create(
                {
                    userId: data.userId,
                    songId: data.songId,
                    playtime: data.playtime,
                },
                { transaction: t },
            );
        });
        return {
            errCode: 0,
            errMess: 'Successfully',
        };
    } catch (error) {
        console.log(error);
        return {
            errCode: 8,
            errMess: `Internal Server Error: ${error.message}`,
        };
    }
};

const likedSongService = async (data) => {
    try {
        const like = await Like.findOne({
            where: {
                userId: data.userId,
                songId: data.songId,
            },
        });
        if (like) {
            await Like.destroy({ where: { likeId: like.likeId } });
            return {
                errCode: 0,
                errMess: 'Delete like successfully',
            };
        } else {
            await Like.create({
                likeId: uuidv4(), // Sử dụng UUID mới nếu không có
                userId: data.userId,
                songId: data.songId,
            });
            return {
                errCode: 0,
                errMess: 'Like Successfully',
            };
        }
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Internal Server Error: ${error.message}`,
        };
    }
};

const followedArtistService = async (data) => {
    try {
        const follow = await Follow.findOne({
            where: {
                userId: data.userId,
                artistId: data.artistId,
            },
        });
        if (follow) {
            await Follow.destroy({ where: { followerId: follow.followerId } });
            return {
                errCode: 0,
                errMess: 'Delete follow successfully',
            };
        } else {
            await Follow.create({
                followerId: uuidv4(),
                userId: data.userId,
                artistId: data.artistId,
            });
            return {
                errCode: 0,
                errMess: 'Follow Successfully',
            };
        }
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Internal Server Error: ${error.message}`,
        };
    }
};

module.exports = {
    getUsersService,
    getUserService,
    deleteUserService,
    updateUserService,
    registerService,
    playTimeService,
    likedSongService,
    followedArtistService,
};
