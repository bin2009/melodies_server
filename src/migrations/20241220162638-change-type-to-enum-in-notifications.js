'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Notifications', 'type');

        // Step 2: Create a new enum type for type
        await queryInterface.sequelize.query(`
          CREATE TYPE "enum_Notifications_type" AS ENUM('SYSTEM', 'PAYMENT', 'COMMENT', 'PACKAGE');
      `);

        // Step 3: Add the new type column with the enum type
        await queryInterface.addColumn('Notifications', 'type', {
            type: `"enum_Notifications_type"`,
            allowNull: false,
            defaultValue: 'SYSTEM',
        });

        await queryInterface.addIndex('Notifications', ['userId', 'from'], {
            unique: false, // Ensure no unique constraint
        });
    },

    async down(queryInterface, Sequelize) {
        // Step 1: Remove the type column
        await queryInterface.removeColumn('Notifications', 'type');

        // Step 2: Drop the enum type
        await queryInterface.sequelize.query(`
              DROP TYPE "enum_Notifications_type";
          `);

        // Step 3: Add the type column back as STRING
        await queryInterface.addColumn('Notifications', 'type', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'SYSTEM',
        });

        await queryInterface.removeIndex('Notifications', ['userId', 'from']);
    },
};
