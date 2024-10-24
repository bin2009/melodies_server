'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('ArtistGenre', {
            artistGenreId: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            artistId: {
                type: Sequelize.UUID,
                references: {
                    model: 'Artist',
                    key: 'id',
                },
                allowNull: false,
            },
            genreId: {
                type: Sequelize.UUID,
                references: {
                    model: 'Genre',
                    key: 'genreId',
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
        await queryInterface.dropTable('ArtistGenre');
    },
};
