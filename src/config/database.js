const { Sequelize, Model } = require('sequelize');

const sequelize = new Sequelize('pbl6_melodies', 'postgres', '290321', {
    host: 'localhost',
    dialect: 'postgres',
});

const connection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

module.exports = connection;
