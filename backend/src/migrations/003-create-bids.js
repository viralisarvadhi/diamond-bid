'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('bids', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            diamond_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'diamonds',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            bid_amount: {
                type: Sequelize.DECIMAL(15, 2),
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

        // Add unique constraint for one bid per user per diamond
        await queryInterface.addConstraint('bids', {
            fields: ['user_id', 'diamond_id'],
            type: 'unique',
            name: 'unique_user_diamond_bid',
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('bids');
    },
};
