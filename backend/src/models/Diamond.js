'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Diamond extends Model {
        static associate(models) {
            // One diamond has many bids (cascade soft delete)
            Diamond.hasMany(models.Bid, {
                foreignKey: 'diamond_id',
                as: 'bids',
                onDelete: 'CASCADE',
            });

            // One diamond has one result (cascade soft delete)
            Diamond.hasOne(models.Result, {
                foreignKey: 'diamond_id',
                as: 'result',
                onDelete: 'CASCADE',
            });
        }
    }

    Diamond.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            diamond_name: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    len: [2, 255],
                },
            },
            base_price: {
                type: DataTypes.DECIMAL(15, 2),
                allowNull: false,
                validate: {
                    min: 0,
                },
            },
            status: {
                type: DataTypes.ENUM('DRAFT', 'ACTIVE', 'CLOSED', 'SOLD'),
                defaultValue: 'DRAFT',
                allowNull: false,
            },
            start_time: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            end_time: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            deleted_at: {
                type: DataTypes.DATE,
                allowNull: true,
                defaultValue: null,
            },
        },
        {
            sequelize,
            modelName: 'Diamond',
            tableName: 'diamonds',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            paranoid: true,
            deletedAt: 'deleted_at',
        }
    );

    return Diamond;
};
