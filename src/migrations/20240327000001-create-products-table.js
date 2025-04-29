'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      images: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      ownerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      commissionRate: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      commissionType: {
        type: Sequelize.ENUM('percentage', 'fixed'),
        defaultValue: 'percentage',
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      salesCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      affiliateLink: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sourcePlatform: {
        type: Sequelize.STRING,
        allowNull: true,
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('products');
  }
}; 