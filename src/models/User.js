module.exports = (sequelize, DataTypes, Model) => {
    class User extends Model {}

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
            tableName: 'User',
            modelName: 'User',
        },
    );

    User.associate = (models) => {
        User.hasMany(models.Like, { foreignKey: 'userId', as: 'likes' });
        User.belongsToMany(models.Song, {
            through: 'Like',
            as: 'likedSongs',
            foreignKey: 'userId',
            otherKey: 'songId',
        });
        User.belongsToMany(models.Song, {
            through: 'SongPlayHistory',
            as: 'playedSongs',
            foreignKey: 'userId',
            otherKey: 'songId',
        });
    };

    return User;
};
