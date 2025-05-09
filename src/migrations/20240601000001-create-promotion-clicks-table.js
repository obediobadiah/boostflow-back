'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('promotion_clicks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      promotionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'promotions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      isConversion: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      earnings: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add an index to speed up queries by promotionId
    await queryInterface.addIndex('promotion_clicks', ['promotionId']);
    
    // Add an index to speed up queries by userId
    await queryInterface.addIndex('promotion_clicks', ['userId']);
    
    // Add an index on timestamp for faster date-based queries
    await queryInterface.addIndex('promotion_clicks', ['timestamp']);
    
    // Add an index on isConversion to quickly filter conversions
    await queryInterface.addIndex('promotion_clicks', ['isConversion']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('promotion_clicks');
  }
}; 