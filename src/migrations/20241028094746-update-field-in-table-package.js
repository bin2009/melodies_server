'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Tạo một loại ENUM mới với các giá trị mới
        await queryInterface.sequelize.query(`
            CREATE TYPE "enum_SubscriptionPackage_time_new" AS ENUM('7 Day', '1 Month', '3 Month');
        `);

        // Thay đổi cột để sử dụng loại ENUM mới
        await queryInterface.sequelize.query(`
            ALTER TABLE "SubscriptionPackage"
            ALTER COLUMN "time" TYPE "enum_SubscriptionPackage_time_new"
            USING "time"::text::"enum_SubscriptionPackage_time_new";
        `);

        // Xóa loại ENUM cũ
        await queryInterface.sequelize.query(`
            DROP TYPE "enum_SubscriptionPackage_time";
        `);

        // Đổi tên loại ENUM mới thành tên loại ENUM cũ
        await queryInterface.sequelize.query(`
            ALTER TYPE "enum_SubscriptionPackage_time_new" RENAME TO "enum_SubscriptionPackage_time";
        `);
    },

    async down(queryInterface, Sequelize) {
        // Tạo lại loại ENUM cũ
        await queryInterface.sequelize.query(`
            CREATE TYPE "enum_SubscriptionPackage_time_old" AS ENUM('Old Value 1', 'Old Value 2');
        `);

        // Thay đổi cột để sử dụng loại ENUM cũ
        await queryInterface.sequelize.query(`
            ALTER TABLE "SubscriptionPackage"
            ALTER COLUMN "time" TYPE "enum_SubscriptionPackage_time_old"
            USING "time"::text::"enum_SubscriptionPackage_time_old";
        `);

        // Xóa loại ENUM mới
        await queryInterface.sequelize.query(`
            DROP TYPE "enum_SubscriptionPackage_time";
        `);

        // Đổi tên loại ENUM cũ thành tên loại ENUM mới
        await queryInterface.sequelize.query(`
            ALTER TYPE "enum_SubscriptionPackage_time_old" RENAME TO "enum_SubscriptionPackage_time";
        `);
    },
};
