'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('SubscriptionPackage', 'name', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'Package',
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('SubscriptionPackage', 'name');
    },
};
