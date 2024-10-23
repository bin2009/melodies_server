'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class SearchHistory extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            SearchHistory.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user',
            });
        }
    }
    SearchHistory.init(
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
            searchTerm: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'SearchHistory',
        },
    );
    return SearchHistory;
};
