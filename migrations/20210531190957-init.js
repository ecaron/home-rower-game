'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Rowers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      avatar: {
        type: Sequelize.JSON
      },
      lastRowed: {
        type: Sequelize.DATE
      },
      totalDistance: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
    await queryInterface.createTable('Records', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      RowerId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Rowers',
          key: 'id'
        }
      },
      mode: {
        type: Sequelize.STRING
      },
      start: {
        type: Sequelize.DATE
      },
      maxSpeed: {
        type: Sequelize.DECIMAL(10, 2)
      },
      checkpoints: {
        type: Sequelize.JSON
      },
      distance: {
        type: Sequelize.INTEGER
      },
      duration: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
    await queryInterface.createTable('Logbooks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      RowerId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Rowers',
          key: 'id'
        }
      },
      mode: {
        type: Sequelize.STRING
      },
      date: {
        type: Sequelize.DATE
      },
      maxSpeed: {
        type: Sequelize.DECIMAL(10, 2)
      },
      distance: {
        type: Sequelize.INTEGER
      },
      duration: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Rowers')
    await queryInterface.dropTable('Records')
    await queryInterface.dropTable('Logbooks')
  }
}
