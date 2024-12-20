'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Remove columns
        await queryInterface.removeColumn('User', 'secondPassword');
        await queryInterface.removeColumn('User', 'statusPassword');
        await queryInterface.removeColumn('User', 'status');

        // Rename column
        await queryInterface.renameColumn('User', 'status2', 'status');

        // Change enum
        await queryInterface.sequelize.query(`
          ALTER TABLE "User"
          ALTER COLUMN "role" DROP DEFAULT;
        `);

        // Step 1: Create a new enum type without 'Guest'
        await queryInterface.sequelize.query(`
          CREATE TYPE "enum_User_role_new" AS ENUM('Admin', 'User');
      `);

        // Step 2: Change the column to use the new enum type
        await queryInterface.sequelize.query(`
          ALTER TABLE "User"
          ALTER COLUMN "role" TYPE "enum_User_role_new"
          USING "role"::text::"enum_User_role_new";
      `);

        // Step 3: Drop the old enum type
        await queryInterface.sequelize.query(`
          DROP TYPE "enum_User_role";
      `);

        // Step 4: Rename the new enum type to the original name
        await queryInterface.sequelize.query(`
          ALTER TYPE "enum_User_role_new" RENAME TO "enum_User_role";
      `);
    },

    async down(queryInterface, Sequelize) {
        // Change enum back
        // Step 1: Create the old enum type with 'Guest'
        await queryInterface.sequelize.query(`
        CREATE TYPE "enum_User_role_old" AS ENUM('Admin', 'User', 'Guest');
    `);

        // Step 2: Change the column to use the old enum type
        await queryInterface.sequelize.query(`
        ALTER TABLE "User"
        ALTER COLUMN "role" TYPE "enum_User_role_old"
        USING "role"::text::"enum_User_role_old";
    `);

        // Step 3: Drop the new enum type
        await queryInterface.sequelize.query(`
        DROP TYPE "enum_User_role";
    `);

        // Step 4: Rename the old enum type to the original name
        await queryInterface.sequelize.query(`
        ALTER TYPE "enum_User_role_old" RENAME TO "enum_User_role";
    `);

        // Đặt lại giá trị mặc định cho 'role' nếu cần
        await queryInterface.sequelize.query(`
      ALTER TABLE "User"
      ALTER COLUMN "role" SET DEFAULT 'User';
    `);

        // Rename column back
        await queryInterface.renameColumn('User', 'status', 'status2');

        // Add columns back
        await queryInterface.addColumn('User', 'secondPassword', {
            type: Sequelize.STRING,
            allowNull: true,
        });
        await queryInterface.addColumn('User', 'statusPassword', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });
        await queryInterface.addColumn('User', 'status', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        });
    },
};
