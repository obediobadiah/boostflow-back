"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
async function up(queryInterface) {
    await queryInterface.createTable('earnings', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        promotionId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Promotions',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        amount: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        type: {
            type: sequelize_1.DataTypes.ENUM('commission', 'bonus', 'referral'),
            allowNull: false,
        },
        status: {
            type: sequelize_1.DataTypes.ENUM('pending', 'paid', 'cancelled'),
            allowNull: false,
            defaultValue: 'pending',
        },
        paymentDate: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        description: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        },
        metadata: {
            type: sequelize_1.DataTypes.JSONB,
            allowNull: true,
        },
        createdAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
    });
    // Add indexes
    await queryInterface.addIndex('earnings', ['userId']);
    await queryInterface.addIndex('earnings', ['promotionId']);
    await queryInterface.addIndex('earnings', ['status']);
    await queryInterface.addIndex('earnings', ['createdAt']);
}
async function down(queryInterface) {
    await queryInterface.dropTable('earnings');
}
