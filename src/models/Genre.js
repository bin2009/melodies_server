module.exports = (sequelize, DataTypes, Model) => {
    class Genre extends Model {}

    Genre.init(
        {
            genreId: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            sequelize,
            tableName: 'Genre',
            modelName: 'Genre',
        },
    );

    return Genre;
};
