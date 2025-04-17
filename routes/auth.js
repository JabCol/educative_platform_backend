import { Router } from 'express'
import { AuthController } from '../controllers/auth.js'
import { requireAuth } from '../middleware/authentication.js'

export const createAuthModel = ({ authModel }) => {
  // How to read a json in ESM with require
  const authRouter = Router()

  const authController = new AuthController({ authModel })

  authRouter.post('/register', authController.register)
  authRouter.post('/login', authController.login)
  authRouter.get('/logout', requireAuth, authController.logout)

  return authRouter
}
