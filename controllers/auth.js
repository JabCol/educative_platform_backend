import { validatePartialUser } from '../schema/user.js'
import jwt from 'jsonwebtoken'
import { SECRET_JWT_KEY, URL_FRONT } from '../config.js'
import crypto from 'node:crypto'

export class AuthController {
  constructor ({ userModel }) {
    this.userModel = userModel
  }

  login = async (req, res) => {
    const result = validatePartialUser(req.body)
    if (result.error) {
      // 400 Bad Request
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }
    const user = await this.userModel.getUser(result.data)
    if (user === false) {
      return res.status(401).json({ error: 'Wrong username' })
    }

    // 2. Check if the password is correct
    const { password } = result.data
    let isValid
    try {
      isValid = await this.userModel.comparePassword({ id: user.id, password })
    } catch (error) {
      console.error('Error comparing password')
      throw new Error('Password comparison failed')
    }
    if (isValid === false) {
      return res.status(401).json({ error: 'Wrong password!!!' })
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      SECRET_JWT_KEY,
      { expiresIn: '1h' }
    )
    res
      .cookie('access_token', token, {
        httpOnly: true, // La cookie solo se puede acceder en el servidor
        secure: process.env.NODE_ENV === 'production', // Solo en producción
        sameSite: 'strict', // Solo para el mismo sitio
        maxAge: 3600000 // 1 hora
      })
      .status(200).json({ message: 'Logged In!!!', id: user.id })
  }

  logout = async (req, res) => {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    }).json({ message: 'Logged out successfully' })
  }

  forgotPassword = async (req, res) => {
    const result = validatePartialUser(req.body)
    if (result.error) {
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    const user = await this.userModel.getUser(result.data)
    if (user === false) {
      return res.status(401).json({ error: 'Account not found' })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    const tokenExpiration = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos

    const resultToken = await this.userModel.saveResetToken({
      id: user.id,
      hashedToken,
      tokenExpiration
    })

    if (!resultToken) {
      return res.status(500).json({ error: 'Error saving token' })
    }

    // Aquí deberías enviar un email con el resetToken
    // Por ahora, lo enviamos al frontend como ejemplo
    res.json({
      message: 'Reset password link generated',
      resetUrl: `${URL_FRONT}/auth/reset-password/${resetToken}`
    })
  }

  resetPassword = async (req, res) => {
    const result = validatePartialUser(req.body)
    if (result.error) {
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    const { token } = req.params
    const { password } = req.body

    if (!token) return res.status(400).json({ error: 'Token is required' })
    // Siempre da el mismo resultado para el mismo token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await this.userModel.updatePassword({ hashedToken, password })
    if (user === false) {
      return res.status(401).json({ error: 'Invalid or expired token. Do the process again.' })
    }
    res.json({ message: 'Password updated successfully' })
  }
}
