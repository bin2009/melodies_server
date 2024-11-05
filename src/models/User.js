'use strict';
const { Model } = require('sequelize');
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
            // User.hasMany(models.Playlist, { foreignKey: 'userId', as: 'playlists' });
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
                type: DataTypes.ENUM('Premium', 'Free'),
                allowNull: false,
                defaultValue: 'Free',
            },
            status: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
        },
        {
            sequelize,
            modelName: 'User',
        },
    );
    return User;
};
