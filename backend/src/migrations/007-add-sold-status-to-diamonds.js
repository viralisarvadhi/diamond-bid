'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Add SOLD to enum_diamonds_status (Postgres)
        await queryInterface.sequelize.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_type t
                    JOIN pg_enum e ON t.oid = e.enumtypid
                    WHERE t.typname = 'enum_diamonds_status' AND e.enumlabel = 'SOLD'
                ) THEN
                    ALTER TYPE enum_diamonds_status ADD VALUE 'SOLD';
                END IF;
            END$$;
        `);
    },

    async down(queryInterface, Sequelize) {
        // No-op: removing enum values in Postgres is not straightforward.
    },
};
