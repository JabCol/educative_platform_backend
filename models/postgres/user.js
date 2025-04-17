import pool from './connection.js'
import bcrypt from 'bcrypt'
import { SALT_ROUNDS } from '../../config.js'

export class UserModel {
  static async getUser ({ username, password }) {
    // 1. Validate if the user already exists
    const checkUserQuery = {
      text: 'SELECT * FROM users WHERE username = $1',
      values: [username]
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

    // 2. Check if the password is correct
    let isValid
    try {
      isValid = await bcrypt.compareSync(password, existingUser.rows[0].password)
    } catch (error) {
      console.error('Error comparing password')
      throw new Error('Password comparison failed')
    }
    if (!isValid) {
      return false
    }

    // 3. Return the user
    return {
      id: existingUser.rows[0].id
    }
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
}
