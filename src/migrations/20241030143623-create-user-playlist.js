'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('UserPlaylist', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            userId: {
                type: Sequelize.UUID,
                references: {
                    model: 'User',
                    key: 'id',
                },
                allowNull: false,
            },
            playlistId: {
                type: Sequelize.UUID,
                references: {
                    model: 'Playlist',
                    key: 'id',
                },
                allowNull: false,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('UserPlaylist');
    },
};
