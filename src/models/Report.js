module.exports = (sequelize, DataTypes, Model, Comment) => {
    class Report extends Model {}

    Report.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            },
            commentId: {
                type: DataTypes.UUID,
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
