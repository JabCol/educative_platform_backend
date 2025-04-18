import { Router } from 'express'
import { AuthController } from '../controllers/auth.js'
import { requireAuth } from '../middleware/authentication.js'

export const createAuthModel = ({ userModel }) => {
  // How to read a json in ESM with require
  const authRouter = Router()

  const authController = new AuthController({ userModel })

  authRouter.post('/login', authController.login)
  authRouter.get('/logout', requireAuth, authController.logout)
  authRouter.post('/forgot-password', authController.forgotPassword)
  authRouter.patch('/reset-password/:token', authController.resetPassword)

  return authRouter
}
