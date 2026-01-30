const db = require('./src/models');

async function checkDeleted() {
    try {
        // Check all diamonds including soft-deleted ones
        const allDiamonds = await db.Diamond.findAll({
            paranoid: false, // This includes soft-deleted records
            attributes: ['id', 'diamond_name', 'status', 'deleted_at'],
            order: [['created_at', 'DESC']],
        });

        console.log('\n=== ALL DIAMONDS (including soft-deleted) ===');
        allDiamonds.forEach(d => {
            const status = d.deleted_at ? '🗑️ DELETED' : '✅ ACTIVE';
            console.log(`${status} | ${d.diamond_name} | Status: ${d.status} | deleted_at: ${d.deleted_at}`);
        });

        // Check only active diamonds
        const activeDiamonds = await db.Diamond.findAll({
            attributes: ['id', 'diamond_name', 'status', 'deleted_at'],
            order: [['created_at', 'DESC']],
        });

        console.log('\n=== ACTIVE DIAMONDS (paranoid mode) ===');
        console.log(`Count: ${activeDiamonds.length}`);
        activeDiamonds.forEach(d => {
            console.log(`✅ ${d.diamond_name} | Status: ${d.status}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkDeleted();
