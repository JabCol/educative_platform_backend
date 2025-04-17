import { validateUser, validatePartialUser } from '../schema/user.js'
import jwt from 'jsonwebtoken'
import { SECRET_JWT_KEY } from '../config.js'

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
      return res.status(401).json({ error: 'Invalid credentials' })
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
    console.log('Logout')
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    }).json({ message: 'Logged out successfully' })
  }
}
