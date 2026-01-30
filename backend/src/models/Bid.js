'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Bid extends Model {
        static associate(models) {
            // Many bids belong to one user
            Bid.belongsTo(models.User, {
                foreignKey: 'user_id',
                as: 'user',
            });

            // Many bids belong to one diamond
            Bid.belongsTo(models.Diamond, {
                foreignKey: 'diamond_id',
                as: 'diamond',
            });

            // One bid has many history records (cascade delete)
            Bid.hasMany(models.BidHistory, {
                foreignKey: 'bid_id',
                as: 'bidHistory',
                onDelete: 'CASCADE',
            });
        }
    }

    Bid.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
            },
            diamond_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'diamonds',
                    key: 'id',
                },
            },
            bid_amount: {
                type: DataTypes.DECIMAL(15, 2),
                allowNull: false,
                validate: {
                    min: 0,
                },
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
            modelName: 'Bid',
            tableName: 'bids',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [
                {
                    unique: true,
                    fields: ['user_id', 'diamond_id'],
                    name: 'unique_user_diamond_bid',
                },
            ],
            paranoid: true,
            deletedAt: 'deleted_at',
        }
    );

    return Bid;
};
