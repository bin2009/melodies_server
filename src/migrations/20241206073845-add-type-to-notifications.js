'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('Notifications', 'type', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'SYSTEM',
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Notifications', 'type');
    },
};
