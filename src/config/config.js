const config = {
    production: {
        username: 'doadmin',
        password: process.env.DB_PASSWORD,
        database: 'defaultdb',
        host: 'melodies-do-user-17932018-0.d.db.ondigitalocean.com',
        dialect: 'postgres',
        logging: false,
        port: '25060',
        timezone: '+07:00',
        define: {
            freezeTableName: true,
        },
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
    },
    test: {
        username: 'root',
        password: null,
        database: 'database_test',
        host: '127.0.0.1',
        dialect: 'mysql',
    },
    development: {
        username: 'postgres',
        password: '290321',
        database: 'test',
        host: '127.0.0.1',
        dialect: 'postgres',
    },
};

module.exports = config;
