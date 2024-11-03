'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Comment extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Comment.belongsToMany(models.User, {
                through: 'Report',
                as: 'reportedByUsers',
                foreignKey: 'commentId',
                otherKey: 'userId',
            });
            Comment.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user',
            });
        }
    }
    Comment.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4,
            },
            commentParentId: {
                type: DataTypes.UUID,
                allowNull: true,
                defaultValue: null,
            },
            userId: {
                type: DataTypes.UUID,
                references: {
                    model: 'User',
                    key: 'id',
                },
                allowNull: false,
            },
            songId: {
                type: DataTypes.UUID,
                references: {
                    model: 'Song',
                    key: 'id',
                },
                allowNull: false,
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            hide: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
        },
        {
            sequelize,
            modelName: 'Comment',
            indexes: [
                {
                    unique: false, // Set to true if you want to ensure unique combinations of userId and songId
                    fields: ['userId', 'songId'],
                },
            ],
        },
    );
    return Comment;
};
