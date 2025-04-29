'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('social_media_accounts', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
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
      username: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      accountId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      accessToken: {
        type: Sequelize.TEXT,
      },
      refreshToken: {
        type: Sequelize.TEXT,
      },
      tokenExpiry: {
        type: Sequelize.DATE,
      },
      isConnected: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      connectionDate: {
        type: Sequelize.DATE,
      },
      lastPostDate: {
        type: Sequelize.DATE,
      },
      followerCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      metadata: {
        type: Sequelize.JSON,
        defaultValue: {},
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

    // Add unique constraint for userId and platform combination
    await queryInterface.addIndex('social_media_accounts', ['userId', 'platform'], {
      unique: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('social_media_accounts');
  }
}; 