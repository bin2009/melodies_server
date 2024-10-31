'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Playlist', 'userId');
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn('Playlist', 'userId', {
            type: Sequelize.UUID,
            references: {
                model: 'User',
                key: 'id',
            },
            allowNull: false,
        });
    },
};
