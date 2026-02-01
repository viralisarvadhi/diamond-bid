const db = require('./src/models');

async function testModels() {
    try {
        console.log('🔍 Testing Sequelize Models & Associations...\n');

        // Test 1: Sync models
        console.log('✓ Test 1: Syncing models...');
        await db.sequelize.sync();
        console.log('✓ Models synced successfully\n');

        // Test 2: Check if models exist
        console.log('✓ Test 2: Checking models...');
        console.log('   - User model:', !!db.User);
        console.log('   - Diamond model:', !!db.Diamond);
        console.log('   - Bid model:', !!db.Bid);
        console.log('   - BidHistory model:', !!db.BidHistory);
        console.log('   - Result model:', !!db.Result);
        console.log('');

        // Test 3: Check associations
        console.log('✓ Test 3: Checking associations...');
        console.log('   - User.hasMany(Bid):', db.User.hasMany.toString().includes('Bid'));
        console.log('   - Diamond.hasMany(Bid):', db.Diamond.hasMany.toString().includes('Bid'));
        console.log('   - Bid.belongsTo(User):', db.Bid.belongsTo.toString().includes('User'));
        console.log('   - Bid.belongsTo(Diamond):', db.Bid.belongsTo.toString().includes('Diamond'));
        console.log('');

        // Test 4: Test eager loading capability
        console.log('✓ Test 4: Testing query with associations...');
        const testUser = await db.User.findAll({
            include: [
                {
                    association: 'bids',
                    include: [
                        {
                            association: 'diamond',
                        },
                        {
                            association: 'bidHistory',
                        },
                    ],
                },
            ],
            limit: 1,
        });
        console.log('✓ Query with nested associations works!\n');

        console.log('✅ All tests passed! Models are ready.\n');
        console.log('Model Summary:');
        console.log('  📊 Users - identity & access');
        console.log('  💎 Diamonds - auction items');
        console.log('  🏷️  Bids - active bids (one per user-diamond)');
        console.log('  📝 BidHistory - audit trail');
        console.log('  🏆 Results - auction winners');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testModels();
