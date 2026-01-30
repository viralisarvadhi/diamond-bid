'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Result extends Model {
        static associate(models) {
            // One result belongs to one diamond
            Result.belongsTo(models.Diamond, {
                foreignKey: 'diamond_id',
                as: 'diamond',
            });

            // One result belongs to one user (winner)
            Result.belongsTo(models.User, {
                foreignKey: 'winner_user_id',
                as: 'winner',
            });
        }
    }

    Result.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            diamond_id: {
                type: DataTypes.UUID,
                allowNull: false,
                unique: true,
                references: {
                    model: 'diamonds',
                    key: 'id',
                },
            },
            winner_user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
            },
            winning_bid_amount: {
                type: DataTypes.DECIMAL(15, 2),
                allowNull: false,
                validate: {
                    min: 0,
                },
            },
            declared_at: {
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
            modelName: 'Result',
            tableName: 'results',
            timestamps: true,
            createdAt: 'declared_at',
            updatedAt: false,
            indexes: [
                {
                    fields: ['winner_user_id'],
                },
            ],
            paranoid: true,
            deletedAt: 'deleted_at',
        }
    );

    return Result;
};
