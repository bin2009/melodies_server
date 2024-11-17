'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Song', 'albumId');
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn('Song', 'albumId', {
            type: Sequelize.UUID,
            references: {
                model: 'Album',
                key: 'albumId',
            },
            allowNull: false,
        });
    },
};
