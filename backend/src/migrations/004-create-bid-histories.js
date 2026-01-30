'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('bid_histories', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            bid_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'bids',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            old_amount: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: true,
            },
            new_amount: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false,
            },
            edited_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
        });

        // Add index on bid_id for faster queries
        await queryInterface.addIndex('bid_histories', ['bid_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('bid_histories');
    },
};
