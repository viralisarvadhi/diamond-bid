const bcrypt = require('bcryptjs');
const { sequelize } = require('./src/models');

async function seedUsers() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established.');

        const User = sequelize.models.User;

        // Check if users already exist
        const adminExists = await User.findOne({ where: { email: 'admin@diamond.com' } });
        const userExists = await User.findOne({ where: { email: 'user@diamond.com' } });

        if (adminExists) {
            console.log('Admin user already exists.');
        } else {
            const hashedAdminPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                name: 'Admin User',
                email: 'admin@diamond.com',
                password: hashedAdminPassword,
                role: 'ADMIN',
                budget: 100000,
                is_active: true,
            });
            console.log('✓ Admin user created (email: admin@diamond.com, password: admin123)');
        }

        if (userExists) {
            console.log('Regular user already exists.');
        } else {
            const hashedUserPassword = await bcrypt.hash('user123', 10);
            await User.create({
                name: 'Test User',
                email: 'user@diamond.com',
                password: hashedUserPassword,
                role: 'USER',
                budget: 50000,
                is_active: true,
            });
            console.log('✓ Regular user created (email: user@diamond.com, password: user123)');
        }

        console.log('\nSeeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seedUsers();
