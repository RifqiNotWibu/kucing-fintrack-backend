const { users } = require('../models')
const emailValidator = require('email-validator')
const { hashPassword, comparePassword } = require('../utils/bcryptUtils')
const { sendMailer } = require('../utils/nodeMailerUtils')
const { fn, Op } = require('sequelize')
const moment = require('moment')
const { generateToken } = require('../utils/jwtUtils.js')

class userControllers {
  static async register(req, res) {
    try {
      const { username, email, pass } = req.body
      let password = await hashPassword(pass)
      if (!emailValidator.validate(email)) {
        return res.status(400).json({ message: 'Incorrect email format!' })
      }
      let findExistingEmail = await users.findOne({
        where: { email, isActive: 1 },
      })
      if (findExistingEmail) {
        return res.status(400).json({ message: 'Email already exists!' })
      }

      //CREATE QUERY
      await users.create({
        username,
        email,
        password,
      })

      res.status(201).json({ message: 'User registered successfully' })
    } catch (err) {
      res.status(500).json({ message: `${err.message}` })
    }
  }

  static async login(req, res) {
    try {
      const { email, pass } = req.body

      const findUser = await users.findOne({
        where: { email, isActive: 1 },
      })

      if (!findUser) {
        return res.status(401).json({ message: 'Email is not authorized' })
      }

      const checkPassword = await comparePassword(pass, findUser.password)

      if (!checkPassword) {
        return res.status(401).json({ message: 'You are not authorized' })
      }

      const generatingToken = await generateToken({
        id: findUser.id,
        email: findUser.email,
        username: findUser.username,
      })
      return res.status(200).json({
        token: generatingToken,
        user: {
          id: findUser.id,
          email: findUser.email,
          username: findUser.username,
        },
      })
    } catch (err) {
      res.status(500).json({ message: `${err.message}` })
    }
  }

  static async updateUser(req, res, next) {
    try {
      const { id, pass } = req.body

      let hashedPassword = await hashPassword(pass)

      await users.update(
        {
          password: hashedPassword,
        },
        { where: { id } }
      )
      res.status(201).json({ message: 'User updated succesfully' })
    } catch (err) {
      next(err)
    }
  }

  static async deleteUser(req, res) {
    try {
      const { id, password } = req.body
      let passwordCheck = await users.findOne({ where: { id } })
      if (password != passwordCheck.password) {
        return res.status(400).json({ message: 'Password does not match' })
      }

      //DELETE QUERY
      users.update(
        {
          isActive: 0,
        },
        {
          where: { id, isActive: 1 },
        }
      )
      res.status(200).json({ message: 'User deleted succesfully' })
    } catch (err) {
      res.status(500).json({ message: `${err.message}` })
    }
  }

  static async getUser(req, res, next) {
    try {
      const { id } = req.body
      let getUser = await users.findOne({
        where: { id, isActive: 1 },
      })
      res.status(200).json(getUser)
    } catch (err) {
      next(err)
    }
  }

  static async forgetPassEmail(req, res) {
    try {
      const { email } = req.body
      let findEmail = await users.findOne({
        where: { email, isActive: 1 },
      })

      if (!findEmail) {
        return res.status(401).json({ message: 'Email not found' })
      }

      let genOtp = await sendMailer(email)

      await users.update(
        {
          otp: genOtp,
          otpExp: fn('NOW'),
        },
        {
          where: { email },
        }
      )
      res.status(200).json({ message: 'Email Sent' })
    } catch (err) {
      res.status(400).json({ message: `${err.message}` })
    }
  }

  static async forgetPassOtp(req, res) {
    try {
      const { email, otp } = req.body
      let userOtp = await users.findOne({
        where: {
          email,
          otpExp: { [Op.gte]: moment().subtract(10, 'minutes').toDate() },
        },
      })

      if (otp == userOtp.otp) {
        return res.status(200).json({ message: 'OTP confirmed!' })
      } else {
        res.status(400).json({ message: 'Otp not found' })
      }
    } catch (err) {
      res.status(401).json({ message: 'OTP is not authorized' })
    }
  }
}

module.exports = userControllers
