import pool from './connection.js'
import bcrypt from 'bcrypt'
import { SALT_ROUNDS } from '../../config.js'

export class UserModel {
  static async getUser ({ email, username }) {
    // 1. Validate if the user already exists
    const checkUserQuery = {
      text: `SELECT id, firstName, lastName, username, email, birthdate, phoneNumber, cellphoneNumber 
              FROM users 
              WHERE ($1::text IS NULL OR email = $1)
              AND ($2::text IS NULL OR username = $2)
          `,
      values: [email || null, username || null]
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

  static async getById (id) {
    // 1. Validate if the user already exists
    const query = {
      text: 'SELECT id, firstName, lastName, username, email, birthdate, phoneNumber, cellphoneNumber FROM users WHERE id = $1',
      values: [id]
    }

    let user
    try {
      const { rows } = await pool.query(query)
      user = rows[0]
    } catch (error) {
      console.error('Error checking user existence')
      throw new Error('Database query failed at checking user existence')
    }
    if (user.length <= 0) {
      return false
    }

    return user
  }

  static async comparePassword ({ id, password }) {
    const query = {
      text: 'SELECT * FROM users WHERE id = $1',
      values: [id]
    }
    let user
    try {
      const { rows } = await pool.query(query)
      user = rows[0]
    } catch (error) {
      console.error('Error getting user')
      throw new Error('Database query failed at getting user to veryfied password')
    }

    let isValid
    try {
      isValid = await bcrypt.compareSync(password, user.password)
    } catch (error) {
      console.error('Error comparing password')
      throw new Error('Password comparison failed')
    }
    if (!isValid) {
      return false
    }
    return true
  }

  static async getAll ({ name, lastname, email, role }) {
    const conditions = []
    const values = []
    let idx = 1

    if (name) {
      conditions.push(`u.firstname ILIKE '%' || $${idx} || '%'`)
      values.push(name)
      idx++
    }
    if (lastname) {
      conditions.push(`u.lastname ILIKE '%' || $${idx} || '%'`)
      values.push(lastname)
      idx++
    }
    if (email) {
      conditions.push(`u.email ILIKE '%' || $${idx} || '%'`)
      values.push(email)
      idx++
    }
    if (role) {
      conditions.push(`r.name ILIKE '%' || $${idx} || '%'`)
      values.push(role)
      idx++
    }
    conditions.push('u.is_active = true')

    const queryFilters = {
      text: ` SELECT u.id, u.firstName, u.lastName, u.username, u.email, u.birthdate, 
                    u.phoneNumber, u.cellphoneNumber, r.name as role 
                    FROM users as u
                    JOIN users_roles as ur on u.id = ur.userid
                    JOIN roles as r on ur.roleid = r.id
                    WHERE ${conditions.join(' AND ')}
            `,
      values
    }
    if (values.length > 0) {
      let users
      try {
        const { rows } = await pool.query(queryFilters)
        users = rows
      } catch (error) {
        console.error('Error getting users')
        throw new Error('Database query failed at getting users')
      }
      if (users.length === 0) {
        return false
      }
      // 3. Return the users
      return users
    }

    // If no filters, return all users
    const query = {
      text: 'SELECT id, firstName, lastName, username, email, birthdate, phoneNumber, cellphoneNumber FROM users WHERE is_active = true'
    }
    let users
    try {
      const { rows } = await pool.query(query)
      users = rows
    } catch (error) {
      console.error('Error getting users')
      throw new Error('Database query failed at getting users')
    }
    if (users.length === 0) {
      return false
    }
    return users
  }

  static async create ({
    firstName,
    lastName,
    username,
    email,
    password,
    birthdate,
    phoneNumber,
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
      text: 'INSERT INTO users (id, firstName, lastName, username, email, password, birthdate, phoneNumber, cellphoneNumber) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, firstName, lastName, username, email, birthdate, phoneNumber, cellphoneNumber',
      values: [uuid, firstName, lastName, username, email, hashedPassword, birthdate, phoneNumber || null, cellphoneNumber || null]
    }

    // 5. Execute the query
    let user
    try {
      const { rows } = await pool.query(query)
      user = rows
    } catch (error) {
      console.error('Error creating user')
      throw new Error('Database query failed at creating user')
    }
    if (user?.length === 0) {
      return false
    }

    // 8. Return the new user
    return user
  }

  static async update ({ id, input }) {
    const allowedFields = [
      'firstName',
      'lastName',
      'username',
      'email',
      'birthdate',
      'phoneNumber',
      'cellphoneNumber'
    ]
    const fields = []
    const values = []
    let idx = 1
    for (const key of allowedFields) {
      if (key in input) {
        fields.push(`${key} = $${idx}`)
        values.push(input[key])
        idx++
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update')
    }
    values.push(id)

    const query = {
      text: `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} 
      RETURNING id, firstName, lastName, username, email, birthdate, phoneNumber, cellphoneNumber`,
      values
    }
    let user
    try {
      const { rows } = await pool.query(query)
      user = rows[0]
    } catch (error) {
      console.error('Error updating user')
      throw new Error('Database query failed at updating user')
    }
    if (!user || user.length === 0) {
      return false
    }

    return user
  }

  static async softDeleteUser (id) {
    const query = {
      text: 'UPDATE users SET is_active = false WHERE id = $1 RETURNING *',
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
      console.error('Error updating user with reset token:')
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
}
