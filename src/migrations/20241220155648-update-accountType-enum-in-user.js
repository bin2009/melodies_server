'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Step 0.1: Temporarily change the column type to TEXT
        await queryInterface.sequelize.query(`
          ALTER TABLE "User"
          ALTER COLUMN "accountType" TYPE TEXT USING "accountType"::TEXT;
        `);

        // Step 0.2: Update existing values to match the new ENUM
        await queryInterface.sequelize.query(`
          UPDATE "User"
          SET "accountType" = CASE 
            WHEN "accountType" = 'Free' THEN 'FREE'
            WHEN "accountType" = 'Premium' THEN 'PREMIUM'
            ELSE "accountType"
          END;
        `);

        // Step 1: Remove the default value
        await queryInterface.sequelize.query(`
          ALTER TABLE "User"
          ALTER COLUMN "accountType" DROP DEFAULT;
        `);

        // Step 2: Create a new enum type without 'Guest'
        await queryInterface.sequelize.query(`
          CREATE TYPE "enum_User_accountType_new" AS ENUM('PREMIUM', 'FREE');
        `);

        // Step 3: Change the column to use the new enum type
        await queryInterface.sequelize.query(`
          ALTER TABLE "User"
          ALTER COLUMN "accountType" TYPE "enum_User_accountType_new"
          USING "accountType"::text::"enum_User_accountType_new";
        `);

        // Step 4: Drop the old enum type
        await queryInterface.sequelize.query(`
          DROP TYPE "enum_User_accountType";
        `);

        // Step 5: Rename the new enum type to the original name
        await queryInterface.sequelize.query(`
          ALTER TYPE "enum_User_accountType_new" RENAME TO "enum_User_accountType";
        `);
    },

    async down(queryInterface, Sequelize) {
        // Step 1: Create the old enum type with 'Free'
        await queryInterface.sequelize.query(`
          CREATE TYPE "enum_User_accountType_old" AS ENUM('Premium', 'Free');
        `);

        await queryInterface.sequelize.query(`
          ALTER TABLE "User"
          ALTER COLUMN "accountType" TYPE TEXT USING "accountType"::TEXT;
        `);

        await queryInterface.sequelize.query(`
          UPDATE "User"
          SET "accountType" = CASE 
            WHEN "accountType" = 'FREE' THEN 'Free'
            WHEN "accountType" = 'PREMIUM' THEN 'Premium'
            ELSE "accountType"
          END;
        `);

        // Step 2: Change the column to use the old enum type
        await queryInterface.sequelize.query(`
          ALTER TABLE "User"
          ALTER COLUMN "accountType" TYPE "enum_User_accountType_old"
          USING "accountType"::text::"enum_User_accountType_old";
        `);

        // Step 3: Drop the new enum type
        await queryInterface.sequelize.query(`
          DROP TYPE "enum_User_accountType";
        `);

        // Step 4: Rename the old enum type to the original name
        await queryInterface.sequelize.query(`
          ALTER TYPE "enum_User_accountType_old" RENAME TO "enum_User_accountType";
        `);
    },
};
