module.exports = (sequelize, DataTypes, Model) => {
    class Artist extends Model {}

    Artist.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            avatar: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            bio: {
                type: DataTypes.TEXT,
            },
        },
        {
            sequelize,
            tableName: 'Artist',
            modelName: 'Artist',
        },
    );
    return Artist;
};
