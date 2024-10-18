module.exports = (sequelize, DataTypes, Model, User) => {
    class SearchHistory extends Model {}

    SearchHistory.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            userId: {
                type: DataTypes.INTEGER,
                references: {
                    model: User,
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
            tableName: 'SearchHistory',
            modelName: 'SearchHistory',
        },
    );

    return SearchHistory;
};
