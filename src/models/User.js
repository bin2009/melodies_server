'use strict';
const { Model } = require('sequelize');
const { ACCOUNTTYPE } = require('~/data/enum');
module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            User.belongsToMany(models.SubscriptionPackage, {
                through: 'Subscription',
                as: 'subscriptions',
                foreignKey: 'userId',
                otherKey: 'packageId',
            });
            User.hasMany(models.SearchHistory, {
                foreignKey: 'userId',
                as: 'searchHistories',
            });
            User.belongsToMany(models.Artist, {
                through: 'Follow',
                as: 'followedArtists',
                foreignKey: 'userId',
                otherKey: 'artistId',
            });
            User.belongsToMany(models.Song, {
                through: 'SongPlayHistory',
                as: 'playedSongs',
                foreignKey: 'userId',
                otherKey: 'songId',
            });
            User.belongsToMany(models.Song, {
                through: 'Like',
                as: 'likedSongs',
                foreignKey: 'userId',
                otherKey: 'songId',
            });
            User.belongsToMany(models.Song, {
                through: 'Comment',
                as: 'commentedSongs',
                foreignKey: 'userId',
                otherKey: 'songId',
            });
            User.belongsToMany(models.Comment, {
                through: 'Report',
                as: 'reportedComments',
                foreignKey: 'userId',
                otherKey: 'commentId',
            });
            User.hasMany(models.Comment, {
                foreignKey: 'userId',
                as: 'comments',
            });
            User.hasMany(models.SongPlayHistory, {
                foreignKey: 'userId',
                as: 'songs',
            });
            User.hasMany(models.Report, {
                foreignKey: 'userId',
                as: 'reports',
            });
            User.hasMany(models.Subscriptions, {
                foreignKey: 'userId',
                as: 'subs',
            });
        }
    }
    User.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
            },
            role: {
                type: DataTypes.ENUM('Admin', 'User', 'Guest'),
                allowNull: false,
                defaultValue: 'User',
            },
            username: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            secondPassword: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            statusPassword: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            image: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            accountType: {
                type: DataTypes.ENUM(Object.values(ACCOUNTTYPE)),
                allowNull: false,
                defaultValue: ACCOUNTTYPE.FREE,
            },
            status: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            status2: {
                type: DataTypes.ENUM('normal', 'lock3', 'lock7', 'permanent'),
                allowNull: false,
                defaultValue: 'normal',
            },
        },
        {
            sequelize,
            modelName: 'User',
            freezeTableName: true,
        },
    );
    return User;
};
