'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class BidHistory extends Model {
        static associate(models) {
            // Many history records belong to one bid
            BidHistory.belongsTo(models.Bid, {
                foreignKey: 'bid_id',
                as: 'bid',
            });
        }
    }

    BidHistory.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            bid_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'bids',
                    key: 'id',
                },
            },
            old_amount: {
                type: DataTypes.DECIMAL(15, 2),
                allowNull: true,
                validate: {
                    min: 0,
                },
            },
            new_amount: {
                type: DataTypes.DECIMAL(15, 2),
                allowNull: false,
                validate: {
                    min: 0,
                },
            },
            edited_at: {
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
            modelName: 'BidHistory',
            tableName: 'bid_histories',
            timestamps: true,
            createdAt: 'edited_at',
            updatedAt: false,
            indexes: [
                {
                    fields: ['bid_id'],
                },
            ],
            paranoid: true,
            deletedAt: 'deleted_at',
        }
    );

    return BidHistory;
};
