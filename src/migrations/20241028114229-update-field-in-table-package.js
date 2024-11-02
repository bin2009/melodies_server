// migrations/xxxx-update-subscription-package-enum.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Thêm kiểu enum mới
        await queryInterface.sequelize.query(`
            CREATE TYPE new_enum_SubscriptionPackage_time AS ENUM ('7 Day', '1 Month', '3 Month');
        `);

        // Cập nhật bảng để sử dụng kiểu enum mới
        await queryInterface.sequelize.query(`
            ALTER TABLE "SubscriptionPackage"
            ALTER COLUMN time TYPE new_enum_SubscriptionPackage_time
            USING time::text::new_enum_SubscriptionPackage_time;
        `);

        // Xóa kiểu enum cũ
        await queryInterface.sequelize.query(`
            DROP TYPE "enum_SubscriptionPackage_time";
        `);
    },

    async down(queryInterface, Sequelize) {
        // Khôi phục kiểu enum cũ
        await queryInterface.sequelize.query(`
            CREATE TYPE enum_SubscriptionPackage_time AS ENUM ('Monthly', 'Yearly');
        `);

        // Khôi phục bảng để sử dụng kiểu enum cũ
        await queryInterface.sequelize.query(`
            ALTER TABLE SubscriptionPackage
            ALTER COLUMN time TYPE enum_SubscriptionPackage_time
            USING time::text::enum_SubscriptionPackage_time;
        `);
    },
};
