import dotenv from 'dotenv'

dotenv.config()

// Destructure environment variables
export const {
  PORT = 3000,
  SALT_ROUNDS = 10, // Default value for salt rounds to use in bcrypt
  SECRET_JWT_KEY = process.env.SECRET_JWT_KEY// Default value for JWT secret key
} = process.env
