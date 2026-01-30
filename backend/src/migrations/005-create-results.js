'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('results', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            diamond_id: {
                type: Sequelize.UUID,
                allowNull: false,
                unique: true,
                references: {
                    model: 'diamonds',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            winner_user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            winning_bid_amount: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false,
            },
            declared_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
        });

        // Add index on winner_user_id for faster queries
        await queryInterface.addIndex('results', ['winner_user_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('results');
    },
};
