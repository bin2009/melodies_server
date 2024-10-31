'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeConstraint('Playlist', 'Playlist_userId_fkey');
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.addConstraint('Playlist', {
            fields: ['userId'],
            type: 'foreign key',
            name: 'Playlist_userId_fkey',
            references: {
                table: 'User',
                field: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
    },
};
