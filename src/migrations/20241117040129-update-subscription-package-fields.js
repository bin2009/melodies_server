'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // add column
        await queryInterface.addColumn('SubscriptionPackage', 'downloads', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });

        await queryInterface.addColumn('SubscriptionPackage', 'uploads', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });

        await queryInterface.addColumn('SubscriptionPackage', 'room', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });

        // change
        await queryInterface.sequelize.query(`
          CREATE TYPE "enum_SubscriptionPackages_time_new" AS ENUM('week', '3month');
        `);
        await queryInterface.sequelize.query(`
          ALTER TABLE "SubscriptionPackage"
          ALTER COLUMN "time" TYPE "enum_SubscriptionPackages_time_new"
          USING "time"::text::"enum_SubscriptionPackages_time_new";
        `);
        await queryInterface.sequelize.query(`
          DROP TYPE "enum_SubscriptionPackage_time";
        `);
        await queryInterface.sequelize.query(`
          ALTER TYPE "enum_SubscriptionPackages_time_new" RENAME TO "enum_SubscriptionPackage_time";
        `);

        await queryInterface.changeColumn('SubscriptionPackage', 'time', {
            type: Sequelize.ENUM('week', '3month'),
            allowNull: false,
        });

        // remove
        await queryInterface.removeColumn('SubscriptionPackage', 'type');
    },

    down: async (queryInterface, Sequelize) => {
        // Hoàn nguyên việc xóa trường
        await queryInterface.addColumn('SubscriptionPackage', 'type', {
            type: Sequelize.ENUM('Basic', 'Premium'),
            allowNull: false,
        });

        await queryInterface.changeColumn('SubscriptionPackage', 'time', {
            type: Sequelize.ENUM('7 Day', '1 Month', '3 Month'),
            allowNull: false,
        });

        // Hoàn nguyên việc thêm trường mới
        await queryInterface.removeColumn('SubscriptionPackage', 'downloads');
        await queryInterface.removeColumn('SubscriptionPackage', 'uploads');
        await queryInterface.removeColumn('SubscriptionPackage', 'room');
    },
};
