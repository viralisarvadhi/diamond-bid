require('dotenv').config();

module.exports = {
    development: {
        username: process.env.DB_USER || 'sarvadhisolution',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'diamond',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
    },
    test: {
        username: process.env.DB_USER || 'sarvadhisolution',
        password: process.env.DB_PASSWORD || '',
        database: 'diamond_test',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
    },
    production: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false,
    },
};
