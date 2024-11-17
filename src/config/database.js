const { Sequelize, Model } = require('sequelize');

// const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     logging: false,
//     dialect: 'postgres',
//     dialectOptions: {
//         ssl: {
//             require: true,
//             rejectUnauthorized: false,
//         },
//     },
// });

const sequelize = new Sequelize('pbl6', 'postgres', '290321', {
    host: 'localhost',
    dialect: 'postgres',
    timezone: '+07:00',
    dialectOptions: {
        useUTC: false,
        timezone: 'Asia/Bangkok',
    },
    logging: false,
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
