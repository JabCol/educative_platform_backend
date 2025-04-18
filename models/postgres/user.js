import pool from './connection.js'
import bcrypt from 'bcrypt'
import { SALT_ROUNDS } from '../../config.js'

export class UserModel {
  static async getUser ({ email, username }) {
    // 1. Validate if the user already exists
    let checkUserQuery
    if (email) {
      checkUserQuery = {
        text: 'SELECT * FROM users WHERE email = $1',
        values: [email]
      }
    } else {
      checkUserQuery = {
        text: 'SELECT * FROM users WHERE username = $1',
        values: [username]
      }
    }

    let existingUser
    try {
      existingUser = await pool.query(checkUserQuery)
    } catch (error) {
      console.error('Error checking user existence')
      throw new Error('Database query failed at checking user existence')
    }
    if (existingUser.rows.length <= 0) {
      return false
    }

    return existingUser.rows[0]
  }

  static async create ({
    firstName,
    lastName,
    username,
    email,
    password,
    birthdate,
    phonenumber,
    cellphoneNumber
  }) {
    // 1. Validate if the user already exists
    const checkUserQuery = {
      text: 'SELECT * FROM users WHERE username = $1 OR email = $2',
      values: [username, email]
    }
    let existingUser
    try {
      existingUser = await pool.query(checkUserQuery)
    } catch (error) {
      console.error('Error checking user existence')
      throw new Error('Database query failed at checking user existence')
    }
    if (existingUser.rows.length > 0) {
      return false
    }

    // 2 Generate a UUID for the new user
    let userid
    try {
      userid = await pool.query('SELECT gen_random_uuid() AS uuid')
    } catch (error) {
      console.error('Error generating UUID')
      throw new Error('Database query failed at generating UUID')
    }
    const { uuid } = userid.rows[0] // Desestructuramos el resultado para obtener el UUID

    // 3. Hash the password using bcrypt
    let hashedPassword
    try {
      hashedPassword = await bcrypt.hashSync(password, Number(SALT_ROUNDS)) // Blocks the main thread
    } catch (error) {
      console.error('Error hashing password')
      throw new Error('Password hashing failed')
    }

    // 4. Create the query to insert the new user
    const query = {
      text: 'INSERT INTO users (id, firstname, lastname, username, email, password, birth_date, phonenumber, cellphonenumber) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      values: [uuid, firstName, lastName, username, email, hashedPassword, birthdate, phonenumber || null, cellphoneNumber || null]
    }

    // 5. Execute the query
    let result
    try {
      result = await pool.query(query)
    } catch (error) {
      console.error('Error creating user')
      throw new Error('Database query failed at creating user')
    }
    if (result.rows.length === 0) {
      console.error('Error creating user')
      throw new Error('User creation failed')
    }

    // 6. Return the new user
    return {
      id: result.rows[0].id,
      firstname: result.rows[0].firstname,
      lastname: result.rows[0].lastname,
      username: result.rows[0].username,
      email: result.rows[0].email,
      phonenumber: result.rows[0].phonenumber,
      cellphonenumber: result.rows[0].cellphonenumber,
      birth_date: result.rows[0].birth_date
    }
  }

  static async saveResetToken ({ id, hashedToken, tokenExpiration }) {
    const query = {
      text: `
      UPDATE users 
      SET reset_password_token = $1, reset_password_token_expiration = $2 
      WHERE id = $3 
      RETURNING *`,
      values: [hashedToken, tokenExpiration, id]
    }

    try {
      const result = await pool.query(query)
      return result.rows.length > 0
    } catch (error) {
      console.error('Error updating user with reset token:', error)
      throw new Error('Database query failed at updating user')
    }
  }

  static async updatePassword ({ hashedToken, password }) {
    const query = {
      text: `
      SELECT * FROM users 
      WHERE reset_password_token = $1 
      AND reset_password_token_expiration > $2
    `,
      values: [hashedToken, new Date()]
    }

    let user
    try {
      const result = await pool.query(query)
      user = result.rows[0]
    } catch (err) {
      throw new Error('DB error finding token')
    }

    if (!user) {
      return false
    }

    const hashedPW = await bcrypt.hashSync(password, Number(SALT_ROUNDS))

    const updateQuery = {
      text: `
      UPDATE users 
      SET password = $1, reset_password_token = NULL, reset_password_token_expiration = NULL 
      WHERE id = $2
    `,
      values: [hashedPW, user.id]
    }

    let result
    try {
      result = await pool.query(updateQuery)
    } catch (err) {
      throw new Error('DB error updating password')
    }
    if (result.rowCount === 0) return false
    return true
  }

  static async deleteUser (id) {
    const query = {
      text: 'DELETE FROM users WHERE id = $1 RETURNING *',
      values: [id]
    }

    let result
    try {
      result = await pool.query(query)
    } catch (error) {
      console.error('Error deleting user')
      throw new Error('Database query failed at deleting user')
    }
    if (result.rows.length === 0) return false
    return true
  }
}
