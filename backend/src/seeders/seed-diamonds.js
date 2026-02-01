const { sequelize } = require('./src/models');

async function seedDiamonds() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established.');

        const Diamond = sequelize.models.Diamond;

        // Check if diamonds already exist
        const draftDiamond = await Diamond.findOne({ where: { status: 'DRAFT' } });

        if (draftDiamond) {
            console.log('DRAFT diamond already exists.');
        } else {
            const now = new Date();
            const startTime = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 hour from now
            const endTime = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours from now

            await Diamond.create({
                diamond_name: 'Sample Diamond - DRAFT',
                base_price: 50000,
                start_time: startTime,
                end_time: endTime,
                status: 'DRAFT',
            });
            console.log('✓ DRAFT diamond created for testing edit/delete functionality');
        }

        // Check if there's an ACTIVE diamond
        const activeDiamond = await Diamond.findOne({ where: { status: 'ACTIVE' } });

        if (!activeDiamond) {
            const now = new Date();
            const startTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
            const endTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now

            await Diamond.create({
                diamond_name: 'Sample Diamond - ACTIVE',
                base_price: 75000,
                start_time: startTime,
                end_time: endTime,
                status: 'ACTIVE',
            });
            console.log('✓ ACTIVE diamond created for testing');
        } else {
            console.log('ACTIVE diamond already exists.');
        }

        console.log('\nDiamond seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seedDiamonds();
