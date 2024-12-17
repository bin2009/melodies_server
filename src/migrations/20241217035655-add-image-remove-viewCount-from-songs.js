'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('Song', 'image', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.removeColumn('Song', 'viewCount');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn('Song', 'viewCount', {
            type: Sequelize.INTEGER,
        });

        await queryInterface.removeColumn('Song', 'image');
    },
};
