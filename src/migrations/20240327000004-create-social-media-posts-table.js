'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('social_media_posts', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      promotionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'promotions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      platform: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          isIn: [['facebook', 'instagram', 'twitter', 'tiktok', 'youtube', 'linkedin', 'pinterest', 'other']],
        },
      },
      postUrl: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      postId: {
        type: Sequelize.STRING,
      },
      postDate: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      images: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      clicks: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      conversions: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
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
    await queryInterface.dropTable('social_media_posts');
  }
}; 