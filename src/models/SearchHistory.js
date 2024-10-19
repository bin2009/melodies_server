module.exports = (sequelize, DataTypes, Model, User) => {
    class SearchHistory extends Model {}

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
