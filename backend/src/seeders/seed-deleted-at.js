const db = require('./src/models');
const { QueryInterface } = require('sequelize');

const addDeletedAtColumn = async () => {
    try {
        const sequelize = db.sequelize;
        const queryInterface = sequelize.getQueryInterface();

        console.log('🔄 Adding deleted_at column to all tables...\n');

        // Tables to update
        const tables = [
            { name: 'users', modelName: 'User' },
            { name: 'diamonds', modelName: 'Diamond' },
            { name: 'bids', modelName: 'Bid' },
            { name: 'bid_histories', modelName: 'BidHistory' },
            { name: 'results', modelName: 'Result' },
        ];

        for (const table of tables) {
            try {
                // Check if column exists
                const columns = await queryInterface.describeTable(table.name);

                if (columns.deleted_at) {
                    console.log(`✓ ${table.modelName}: deleted_at column already exists`);
                } else {
                    // Add column if it doesn't exist
                    await queryInterface.addColumn(table.name, 'deleted_at', {
                        type: db.Sequelize.DATE,
                        allowNull: true,
                        defaultValue: null,
                    });
                    console.log(`✓ ${table.modelName}: deleted_at column added successfully`);
                }
            } catch (error) {
                console.error(`✗ ${table.modelName}: Error adding deleted_at column - ${error.message}`);
            }
        }

        console.log('\n✅ Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
};

addDeletedAtColumn();
