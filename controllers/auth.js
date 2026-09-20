import { validatePartialUser } from '../schema/user.js'
import jwt from 'jsonwebtoken'
import { SECRET_JWT_KEY, URL_FRONT } from '../config.js'
import { sendResetPasswordEmail } from '../services/email.js'
import crypto from 'node:crypto'

/**
 * Controller class to handle authentication flows including login, logout,
 * password recovery request, and password reset.
 */
export class AuthController {
  /**
   * @param {Object} options
   * @param {Object} options.userModel - UserModel instance for database operations.
   */
  constructor({ userModel }) {
    this.userModel = userModel
  }

  /**
   * Authenticates user credentials and issues an HTTP-only JWT cookie upon success.
   *
   * @async
   * @param {import('express').Request} req - Express request object containing login credentials.
   * @param {import('express').Response} res - Express response object.
   * @returns {Promise<void>}
   */
  login = async (req, res) => {
    const result = validatePartialUser(req.body)
    if (result.error) {
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    const user = await this.userModel.getUser(result.data)
    if (user === false) {
      return res.status(401).json({ error: 'Invalid credentials!!!' })
    }

    const { password } = result.data
    let isValid
    try {
      isValid = await this.userModel.comparePassword({ id: user.id, password })
    } catch (error) {
      console.error('Error comparing password')
      throw new Error('Password comparison failed')
    }

    if (isValid === false) {
      return res.status(401).json({ error: 'Invalid credentials!!!' })
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, roles: user.roles },
      SECRET_JWT_KEY,
      { expiresIn: '1h' }
    )

    res
      .cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000 // 1 hour
      })
      .status(200)
      .json({ message: 'Logged In!!!', id: user.id, roles: user.roles })
  }

  /**
   * Clears the authentication JWT cookie to log out the user.
   *
   * @async
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {Promise<void>}
   */
  logout = async (req, res) => {
    res
      .clearCookie('access_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      })
      .json({ message: 'Logged out successfully' })
  }

  /**
   * Generates a password reset token, saves it to the database, and sends an email to the user.
   *
   * @async
   * @param {import('express').Request} req - Express request object containing the username.
   * @param {import('express').Response} res - Express response object.
   * @returns {Promise<void>}
   */
  forgotPassword = async (req, res) => {
    try {
      const result = validatePartialUser(req.body)
      if (result.error) {
        return res.status(400).json({ error: JSON.parse(result.error.message) })
      }

      if (!result.data.username) {
        return res.status(400).json({ error: 'Username is required' })
      }

      const user = await this.userModel.getUser(result.data)
      if (user === false) {
        return res.status(200).json({
          message: 'If an account is associated with this username, password reset instructions will be sent.'
        })
      }

      const resetToken = crypto.randomBytes(32).toString('hex')
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
      const tokenExpiration = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

      const resultToken = await this.userModel.saveResetToken({
        id: user.id,
        hashedToken,
        tokenExpiration
      })

      if (!resultToken) {
        return res.status(500).json({ error: 'Error saving token' })
      }

      const emailResponse = await sendResetPasswordEmail({
        toEmail: user.email,
        resetUrl: `${URL_FRONT}/reset-password/${resetToken}`
      })

      if (!emailResponse || !emailResponse.accepted || emailResponse.accepted.length === 0) {
        return res.status(500).json({ error: 'Failed to deliver email to destination.' })
      }

      res.status(200).json({
        message: 'If an account is associated with this username, password reset instructions will be sent.'
      })
    } catch (error) {
      res.status(500).json({ error: 'Could not send reset password email.' })
    }
  }

  /**
   * Validates the reset token and updates the user's password in the database.
   *
   * @async
   * @param {import('express').Request} req - Express request object containing the URL token parameter and new password.
   * @param {import('express').Response} res - Express response object.
   * @returns {Promise<void>}
   */
  resetPassword = async (req, res) => {
    const result = validatePartialUser(req.body)
    if (result.error) {
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    const { token } = req.params
    const { password } = req.body

    if (!token) return res.status(400).json({ error: 'Token is required' })

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await this.userModel.updatePassword({ hashedToken, password })
    if (user === false) {
      return res.status(401).json({ error: 'Invalid or expired token. Do the process again.' })
    }

    res.status(200).json({ message: 'Password updated successfully' })
  }
}