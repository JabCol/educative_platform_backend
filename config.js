import dotenv from 'dotenv'

dotenv.config()

// Destructure environment variables
export const {
  PORT = process.env.PORT,
  SALT_ROUNDS = process.env.SALT_ROUNDS, // Default value for salt rounds to use in bcrypt
  SECRET_JWT_KEY = process.env.SECRET_JWT_KEY// Default value for JWT secret key
} = process.env

export const DEFAULT_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
}
