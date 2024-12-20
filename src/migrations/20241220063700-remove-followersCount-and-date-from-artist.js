'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Artist', 'followersCount');
        await queryInterface.removeColumn('Artist', 'date');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn('Artist', 'followersCount', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
        await queryInterface.addColumn('Artist', 'date', {
            type: Sequelize.DATE,
            allowNull: true,
        });
    },
};
