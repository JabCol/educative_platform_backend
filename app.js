import express, { json } from 'express'
import { PORT } from './config.js'
import { corsMiddleware } from './middleware/cors.js'
import { createAuthModel } from './routes/auth.js'
import { createUserModel } from './routes/users.js'
import { createRoleModel } from './routes/roles.js'
import { verifyToken } from './middleware/authentication.js'
import cookieParser from 'cookie-parser'

export const createApp = ({ userModel, roleModel }) => {
  const app = express()

  // Middlewares
  app.use(json()) // Middleware to parse JSON request body
  app.use(cookieParser())
  app.use(corsMiddleware()) // Middleware to handle CORS
  app.use(verifyToken)
  app.disable('x-powered-by')

  app.use('/auth', createAuthModel({ userModel }))
  app.use('/users', createUserModel({ userModel, roleModel }))
  app.use('/roles', createRoleModel({ roleModel }))
  // La última a la que va a llegar
  app.use((req, res) => {
    res.status(404).send('<h1>Error 404</h1>')
  })

  app.listen(PORT, () => {
    console.log(`Server is listening on port localhost:${PORT}`)
  })
}
