import jwt from 'jsonwebtoken'
import { SECRET_JWT_KEY } from '../config.js'

export function requireAuth (req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
  next()
}

export function verifyToken (req, res, next) {
  const token = req.cookies?.access_token
  req.session = { user: null }

  if (!token) return next()

  try {
    const data = jwt.verify(token, SECRET_JWT_KEY)
    console.log('Token data:', data)
    req.session.user = data
  } catch (error) {
    console.warn('Invalid token')
  }

  next()
}
