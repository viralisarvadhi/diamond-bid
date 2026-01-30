'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('diamonds', 'start_time', {
            type: Sequelize.DATE,
            allowNull: true,
        });
        await queryInterface.addColumn('diamonds', 'end_time', {
            type: Sequelize.DATE,
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('diamonds', 'start_time');
        await queryInterface.removeColumn('diamonds', 'end_time');
    },
};
