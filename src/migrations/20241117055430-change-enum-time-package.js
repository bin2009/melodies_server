'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Tạo kiểu ENUM mới
        await queryInterface.sequelize.query(`
      CREATE TYPE "enum_SubscriptionPackage_time_new" AS ENUM('week', '3month');
    `);

        // Thay đổi cột để sử dụng kiểu ENUM mới
        await queryInterface.sequelize.query(`
      ALTER TABLE "SubscriptionPackage"
      ALTER COLUMN "time" TYPE "enum_SubscriptionPackage_time_new"
      USING "time"::text::"enum_SubscriptionPackage_time_new";
    `);

        // Xóa kiểu ENUM cũ
        await queryInterface.sequelize.query(`
      DROP TYPE "enum_SubscriptionPackage_time";
    `);

        // Đổi tên kiểu ENUM mới thành tên kiểu ENUM cũ
        await queryInterface.sequelize.query(`
      ALTER TYPE "enum_SubscriptionPackage_time_new" RENAME TO "enum_SubscriptionPackage_time";
    `);
    },

    down: async (queryInterface, Sequelize) => {
        // Tạo kiểu ENUM cũ
        await queryInterface.sequelize.query(`
      CREATE TYPE "enum_SubscriptionPackages_time_old" AS ENUM('7 Day', '1 Month', '3 Month');
    `);

        // Thay đổi cột để sử dụng kiểu ENUM cũ
        await queryInterface.sequelize.query(`
      ALTER TABLE "SubscriptionPackage"
      ALTER COLUMN "time" TYPE "enum_SubscriptionPackages_time_old"
      USING "time"::text::"enum_SubscriptionPackages_time_old";
    `);

        // Xóa kiểu ENUM mới
        await queryInterface.sequelize.query(`
      DROP TYPE "enum_SubscriptionPackage_time";
    `);

        // Đổi tên kiểu ENUM cũ thành tên kiểu ENUM mới
        await queryInterface.sequelize.query(`
      ALTER TYPE "enum_SubscriptionPackages_time_old" RENAME TO "enum_SubscriptionPackage_time";
    `);
    },
};
