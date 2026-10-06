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

export const DEFAULT_CONFIG_TEST = {
  host: process.env.DB_HOST_TEST,
  user: process.env.DB_USER_TEST,
  password: process.env.DB_PASSWORD_TEST,
  database: process.env.DB_NAME_TEST,
  port: process.env.DB_PORT_TEST
}

export const PROD_CONFIG = {
  // Will be defined later
}

export const SEND_EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  user: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASS
}