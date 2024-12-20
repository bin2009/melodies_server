'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Report', 'status');

        await queryInterface.addColumn('Report', 'status', {
            type: Sequelize.ENUM('AI', 'PENDING', 'DELETE', 'NOTDELETE'),
            allowNull: false,
            defaultValue: 'PENDING',
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Report', 'status');

        await queryInterface.sequelize.query(`
      DROP TYPE "enum_Report_status";
    `);

        await queryInterface.addColumn('Report', 'status', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });
    },
};
