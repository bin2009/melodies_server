'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('User', 'status2', {
            type: Sequelize.ENUM('normal', 'lock3', 'lock7', 'permanent'),
            allowNull: false,
            defaultValue: 'normal',
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('User', 'status2');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_User_status2";');
    },
};
