'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            // One user has many bids
            User.hasMany(models.Bid, {
                foreignKey: 'user_id',
                as: 'bids',
            });

            // One user has many winning results
            User.hasMany(models.Result, {
                foreignKey: 'winner_user_id',
                as: 'winningResults',
            });
        }
    }

    User.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    len: [2, 100],
                },
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    isEmail: true,
                },
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            role: {
                type: DataTypes.ENUM('ADMIN', 'USER'),
                defaultValue: 'USER',
                allowNull: false,
            },
            budget: {
                type: DataTypes.DECIMAL(15, 2),
                defaultValue: 0,
                validate: {
                    min: 0,
                },
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
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
            modelName: 'User',
            tableName: 'users',
            timestamps: false,
        }
    );

    return User;
};
