'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class transactions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  transactions.init(
    {
      title: DataTypes.STRING,
      type: DataTypes.STRING,
      amount: DataTypes.INTEGER,
      category: DataTypes.STRING,
      description: DataTypes.STRING,
      isActive: DataTypes.BOOLEAN,
      userId: DataTypes.INTEGER,
      date: DataTypes.DATEONLY,
    },
    {
      sequelize,
      timestamps: false,
    },
    {
      sequelize,
      modelName: 'transactions',
    }
  )
  return transactions
}
