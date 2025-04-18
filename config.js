import dotenv from 'dotenv'

dotenv.config()

// Destructure environment variables
export const {
  PORT = process.env.PORT,
  SALT_ROUNDS = process.env.SALT_ROUNDS,
  SECRET_JWT_KEY = process.env.SECRET_JWT_KEY,
  URL_FRONT = process.env.URL_FRONTEND
} = process.env

export const DEFAULT_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
}
