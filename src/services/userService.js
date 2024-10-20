const bcrypt = require('bcryptjs');
const saltRounds = 10;
const { v4: uuidv4 } = require('uuid');

const db = require('../models');
const User = db.User;
const SongPlayHistory = db.SongPlayHistory;
const Like = db.Like;
const Follow = db.Follow;

const getUsersService = async (userId) => {
    try {
        if (userId) {
            const user = await User.findOne({ where: { id: userId } });
            return {
                errCode: user ? 0 : 6,
                errMess: user ? 'Get user by id' : 'User not found',
                data: user,
            };
        } else {
            const users = await User.findAll();
            return {
                errCode: users.length > 0 ? 0 : 6,
                errMess: users.length > 0 ? 'Get All users' : 'No user',
                data: users,
            };
        }
    } catch (error) {
        return {
            errCode: 8,
            errMess: 'Cannot get user',
        };
    }
};

const deleteUserService = async (userId) => {
    try {
        const data = await User.destroy({ where: { id: userId } });
        return {
            errCode: data ? 0 : 6,
            errMess: data ? 'User deleted successfully' : 'User not found',
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: 'Delete user failed',
        };
    }
};

const updateUserService = async (userId, updateData) => {
    try {
        if (Object.keys(updateData).length === 0) {
            return {
                errCode: 3,
                errMess: 'Missing data',
            };
        } else {
            const user = await User.findOne({ where: { id: userId } });
            if (user) {
                const update = await User.update(updateData, { where: { id: userId } });
                return {
                    errCode: update ? 0 : 3,
                    errMess: update ? 'User updated successfully' : 'Bad Request',
                };
            } else {
                return {
                    errCode: 6,
                    errMess: 'User not found',
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
        await SongPlayHistory.create({
            historyId: uuidv4(), // Sử dụng UUID mới nếu không có
            userId: data.userId,
            songId: data.songId,
            playtime: data.playtime,
        });
        return {
            errCode: 0,
            errMess: 'Successfully',
        };
    } catch (error) {
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
    deleteUserService,
    updateUserService,
    registerService,
    playTimeService,
    likedSongService,
    followedArtistService,
};
