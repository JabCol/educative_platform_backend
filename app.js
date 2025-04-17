import express, { json } from 'express'
import { PORT } from './config.js'
import { corsMiddleware } from './middleware/cors.js'
import { createAuthModel } from './routes/auth.js'
import { verifyToken } from './middleware/authentication.js'
import cookieParser from 'cookie-parser'

export const createApp = ({ authModel }) => {
  const app = express()

  // Middlewares
  app.use(json()) // Middleware to parse JSON request body
  app.use(cookieParser())
  app.use(corsMiddleware()) // Middleware to handle CORS
  app.use(verifyToken)
  app.disable('x-powered-by')

  app.use('/auth', createAuthModel({ authModel }))

  app.listen(PORT, () => {
    console.log(`Server is listening on port localhost:${PORT}`)
  })
}
