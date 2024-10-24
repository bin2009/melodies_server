'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Song', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            albumId: {
                type: Sequelize.UUID,
                references: {
                    model: 'Album',
                    key: 'albumId',
                },
                allowNull: true,
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            duration: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            lyric: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            filePathAudio: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            privacy: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            uploadUserId: {
                type: Sequelize.UUID,
                references: {
                    model: 'User',
                    key: 'id',
                },
                allowNull: true,
            },
            releaseDate: {
                type: Sequelize.DATE,
            },
            viewCount: {
                type: Sequelize.INTEGER,
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
        await queryInterface.dropTable('Song');
    },
};
