'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('promotions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      promoterId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      trackingCode: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      commissionRate: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      commissionType: {
        type: Sequelize.ENUM('percentage', 'fixed'),
        defaultValue: 'percentage',
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'banned'),
        defaultValue: 'active',
      },
      clicks: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      conversions: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      earnings: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      affiliateLink: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      customImages: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      autoPostToSocial: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      }
    });

    // Add unique constraint for productId and promoterId combination
    await queryInterface.addIndex('promotions', ['productId', 'promoterId'], {
      unique: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('promotions');
  }
}; 