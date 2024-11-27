'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Step 1: Create a new ENUM type for status
        await queryInterface.sequelize.query(`
      CREATE TYPE "enum_Subscriptions_status_new" AS ENUM('Pending', 'Expired', 'Paid', 'Cancelled');
    `);

        // Step 2: Update the status column to use the new ENUM type
        await queryInterface.sequelize.query(`
      ALTER TABLE "Subscriptions"
      ALTER COLUMN "status" TYPE "enum_Subscriptions_status_new"
      USING "status"::text::"enum_Subscriptions_status_new";
    `);

        // Step 3: Remove the paymentMethod column
        await queryInterface.removeColumn('Subscriptions', 'paymentMethod');

        // Step 4: Drop the old ENUM type
        await queryInterface.sequelize.query(`
      DROP TYPE "enum_Subscriptions_status";
    `);

        // Rename the new ENUM type to the old ENUM type name
        await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Subscriptions_status_new" RENAME TO "enum_Subscriptions_status";
    `);

        // Step 5: Add the statusUser column
        await queryInterface.addColumn('Subscriptions', 'statusUse', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Step 1: Create the old ENUM type for status
        await queryInterface.sequelize.query(`
      CREATE TYPE "enum_Subscriptions_status_old" AS ENUM('Pending', 'Active', 'Expired');
    `);

        // Step 2: Update the status column to use the old ENUM type
        await queryInterface.sequelize.query(`
      ALTER TABLE "Subscriptions"
      ALTER COLUMN "status" TYPE "enum_Subscriptions_status_old"
      USING "status"::text::"enum_Subscriptions_status_old";
    `);

        // Step 3: Add the paymentMethod column back
        await queryInterface.addColumn('Subscriptions', 'paymentMethod', {
            type: Sequelize.ENUM('CreditCard', 'PayPal', 'BankTransfer'),
            allowNull: false,
        });

        // Step 4: Drop the new ENUM type
        await queryInterface.sequelize.query(`
      DROP TYPE "enum_Subscriptions_status";
    `);

        // Rename the old ENUM type to the original name
        await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Subscriptions_status_old" RENAME TO "enum_Subscriptions_status";
    `);

        // Step 5: Remove the statusUser column
        await queryInterface.removeColumn('Subscriptions', 'statusUse');
    },
};
