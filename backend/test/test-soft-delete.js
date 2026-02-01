const db = require('./src/models');

async function testSoftDelete() {
    try {
        console.log('\n🧪 Testing Soft Delete Functionality...\n');

        // Step 1: Create a test diamond
        const testDiamond = await db.Diamond.create({
            diamond_name: 'TEST DIAMOND - SOFT DELETE',
            base_price: 1000,
            status: 'DRAFT',
            start_time: new Date(),
            end_time: new Date(Date.now() + 86400000),
        });

        console.log('✅ Created test diamond:', testDiamond.diamond_name);
        console.log('   ID:', testDiamond.id);
        console.log('   deleted_at:', testDiamond.deleted_at);

        // Step 2: Soft delete the diamond
        console.log('\n🗑️  Performing soft delete...');
        await testDiamond.destroy();

        // Step 3: Try to find it normally (should not find)
        const foundNormally = await db.Diamond.findByPk(testDiamond.id);
        console.log('   Normal query result:', foundNormally ? 'FOUND (❌ paranoid not working!)' : 'NOT FOUND (✅ paranoid working!)');

        // Step 4: Find it with paranoid: false
        const foundWithParanoidFalse = await db.Diamond.findByPk(testDiamond.id, { paranoid: false });
        console.log('   Paranoid=false query result:', foundWithParanoidFalse ? 'FOUND ✅' : 'NOT FOUND ❌');

        if (foundWithParanoidFalse) {
            console.log('   deleted_at:', foundWithParanoidFalse.deleted_at);
            console.log('   deleted_at is set?', foundWithParanoidFalse.deleted_at ? '✅ YES' : '❌ NO');
        }

        // Step 5: Count all vs active
        const allCount = await db.Diamond.count({ paranoid: false });
        const activeCount = await db.Diamond.count();

        console.log('\n📊 Database counts:');
        console.log('   Total diamonds (including deleted):', allCount);
        console.log('   Active diamonds:', activeCount);
        console.log('   Deleted diamonds:', allCount - activeCount);

        // Step 6: Restore the diamond
        if (foundWithParanoidFalse) {
            console.log('\n♻️  Attempting to restore diamond...');
            await foundWithParanoidFalse.restore();

            const restoredDiamond = await db.Diamond.findByPk(testDiamond.id);
            console.log('   Restored?', restoredDiamond ? '✅ YES' : '❌ NO');
            if (restoredDiamond) {
                console.log('   deleted_at after restore:', restoredDiamond.deleted_at);
            }

            // Clean up - permanently delete
            console.log('\n🔥 Cleaning up test diamond (force delete)...');
            await restoredDiamond.destroy({ force: true });
            console.log('   ✅ Test diamond permanently deleted');
        }

        console.log('\n✅ Soft delete test completed!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

testSoftDelete();
