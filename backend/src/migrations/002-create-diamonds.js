'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('diamonds', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            diamond_name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            base_price: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false,
            },
            status: {
                type: Sequelize.ENUM('DRAFT', 'ACTIVE', 'CLOSED'),
                defaultValue: 'DRAFT',
                allowNull: false,
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
            updated_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('diamonds');
    },
};
