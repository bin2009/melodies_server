module.exports = (sequelize, DataTypes, Model) => {
    class Genre extends Model {}

    Genre.init(
        {
            genreId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
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
