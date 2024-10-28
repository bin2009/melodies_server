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

const playTimeService = async (data) => {
    try {
        const user = await User.findByPk(data.userId);
        const song = await db.Song.findByPk(data.songId);

        if (!user) {
            return {
                errCode: 404,
                message: 'User not found',
            };
        }

        if (!song) {
            return {
                errCode: 404,
                message: 'Song not found',
            };
        }

        await sequelize.transaction(async (t) => {
            await SongPlayHistory.create(
                {
                    historyId: uuidv4(),
                    userId: data.userId,
                    songId: data.songId,
                    playtime: data.playtime,
                },
                { transaction: t },
            );
        });
        return {
            errCode: 200,
            message: 'Play time successfully',
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Play time failed: ${error.message}`,
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
                errCode: 200,
                message: 'Delete like successfully',
            };
        } else {
            await Like.create({
                likeId: uuidv4(), // Sử dụng UUID mới nếu không có
                userId: data.userId,
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
                errCode: 200,
                message: 'Delete follow successfully',
            };
        } else {
            await Follow.create({
                followerId: uuidv4(),
                userId: data.userId,
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

module.exports = {
    getUsersService,
    getUserService,
    deleteUserService,
    updateUserService,
    registerService,
    playTimeService,
    likedSongService,
    followedArtistService,
    changePasswordService,
    subscriptionService,
};
