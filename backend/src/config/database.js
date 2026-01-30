const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'diamond',
    process.env.DB_USER || 'sarvadhisolution',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            decimalNumbers: true,
        },
    }
);

// Test connection
sequelize
    .authenticate()
    .then(() => {
        console.log('✓ Database connection successful');
    })
    .catch((err) => {
        console.error('✗ Database connection failed:', err.message);
    });

module.exports = sequelize;
