module.exports = (sequelize, DataTypes, Model, Comment) => {
    class Report extends Model {}

    Report.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            commentId: {
                type: DataTypes.INTEGER,
                references: {
                    model: Comment,
                    key: 'id',
                },
                allowNull: false,
            },
            content: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            sequelize,
            tableName: 'Report',
            modelName: 'Report',
        },
    );

    return Report;
};
