'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Step 1: Remove the 'status' column
        await queryInterface.removeColumn('User', 'status');

        // Step 2: Drop the old ENUM type
        await queryInterface.sequelize.query(`
            DROP TYPE IF EXISTS "enum_User_status2";
        `);

        // Step 3: Create the new ENUM type with updated values
        await queryInterface.sequelize.query(`
            CREATE TYPE "enum_User_status2" AS ENUM('NORMAL', 'LOCK3', 'LOCK7', 'PERMANENT');
        `);

        // Step 4: Add the 'status' column explicitly using the new ENUM type
        await queryInterface.sequelize.query(`
            ALTER TABLE "User"
            ADD COLUMN "status" "enum_User_status2" NOT NULL DEFAULT 'NORMAL';
        `);
    },

    async down(queryInterface, Sequelize) {
        // Step 1: Remove the 'status' column
        await queryInterface.removeColumn('User', 'status');

        // Step 2: Drop the new ENUM type
        await queryInterface.sequelize.query(`
            DROP TYPE IF EXISTS "enum_User_status2";
        `);

        // Step 3: Recreate the old ENUM type
        await queryInterface.sequelize.query(`
            CREATE TYPE "enum_User_status2" AS ENUM('normal', 'lock3');
        `);

        // Step 4: Recreate the 'status' column explicitly using the old ENUM type
        await queryInterface.sequelize.query(`
            ALTER TABLE "User"
            ADD COLUMN "status" "enum_User_status2" NOT NULL DEFAULT 'normal';
        `);
    },
};
