'use strict';
const { v4: uuidv4 } = require('uuid');
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        /**
         * Add seed commands here.
         *
         * Example:
         */
        await queryInterface.bulkInsert(
            'User',
            [
                {
                    id: uuidv4(),
                    username: 'John',
                    email: 'join@gmail.com',
                    password: '123123',
                    role: 'User',
                    statusPassword: false,
                    accountType: 'Free',
                    status: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: uuidv4(),
                    username: 'Doe',
                    email: 'doe@gmail.com',
                    password: '123123',
                    role: 'User',
                    statusPassword: false,
                    accountType: 'Free',
                    status: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: uuidv4(),
                    username: 'John Doe',
                    email: 'admin@gmail.com',
                    password: '123123',
                    role: 'User',
                    statusPassword: false,
                    accountType: 'Free',
                    status: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
            {},
        );
    },

    async down(queryInterface, Sequelize) {
        /**
         * Add commands to revert seed here.
         *
         * Example:
         * await queryInterface.bulkDelete('People', null, {});
         */
    },
};
