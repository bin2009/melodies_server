'use strict';
const { Model } = require('sequelize');
const { REPORT_STATUS } = require('~/data/enum');
module.exports = (sequelize, DataTypes) => {
    class Report extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            Report.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user',
            });
            Report.belongsTo(models.Comment, {
                foreignKey: 'commentId',
                as: 'comment',
            });
        }
    }
    Report.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            },
            userId: {
                type: DataTypes.UUID,
                references: {
                    model: 'User',
                    key: 'id',
                },
                allowNull: false,
            },
            commentId: {
                type: DataTypes.UUID,
                references: {
                    model: 'Comment',
                    key: 'id',
                },
                allowNull: false,
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM(Object.keys(REPORT_STATUS)),
                allowNull: false,
                defaultValue: 'PENDING',
            },
        },
        {
            sequelize,
            modelName: 'Report',
            freezeTableName: true,
            indexes: [
                {
                    unique: false, // Set to true if you want to ensure unique combinations of userId and songId
                    fields: ['userId', 'commentId'],
                },
            ],
        },
    );
    return Report;
};
