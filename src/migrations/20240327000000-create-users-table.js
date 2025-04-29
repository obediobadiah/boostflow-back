'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      profilePicture: {
        type: Sequelize.STRING,
        defaultValue: '',
      },
      googleId: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true,
      },
      facebookId: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true,
      },
      twitterId: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true,
      },
      role: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'business',
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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
    await queryInterface.dropTable('users');
  }
}; 