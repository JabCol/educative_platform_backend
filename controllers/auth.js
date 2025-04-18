import { validateUser, validatePartialUser } from '../schema/user.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { SECRET_JWT_KEY, URL_FRONT } from '../config.js'
import crypto from 'node:crypto'

export class AuthController {
  constructor ({ authModel }) {
    this.authModel = authModel
  }

  login = async (req, res) => {
    const result = validatePartialUser(req.body)
    if (result.error) {
      // 400 Bad Request
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }
    const user = await this.authModel.getUser(result.data)
    if (user === false) {
      return res.status(401).json({ error: 'Wrong email' })
    }

    // 2. Check if the password is correct
    const { password } = result.data
    let isValid
    try {
      isValid = await bcrypt.compareSync(password, user.password)
    } catch (error) {
      console.error('Error comparing password')
      throw new Error('Password comparison failed')
    }
    if (!isValid) {
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

  register = async (req, res) => {
    const result = validateUser(req.body)
    if (result.error) {
      // 400 Bad Request
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }
    const newUser = await this.authModel.create(result.data)
    if (newUser === false) {
      return res.status(409).json({ error: 'User already exists' })
    }
    res.status(201).json({ message: 'User created', user: newUser }) // Update cache of the client
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

    const user = await this.authModel.getUser(result.data)
    if (user === false) {
      return res.status(401).json({ error: 'Wrong email' })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    const tokenExpiration = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos

    const resultToken = await this.authModel.saveResetToken({
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
      resetUrl: `https://${URL_FRONT}/reset-password?token=${resetToken}`
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

    const user = await this.authModel.updatePassword({ hashedToken, password })
    if (user === false) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
    res.json({ message: 'Password updated successfully' })
  }

  deleteUser = async (req, res) => {
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'ID is required' })

    const result = await this.authModel.deleteUser(id)
    if (result === false) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json({ message: 'User deleted successfully' })
  }
}
