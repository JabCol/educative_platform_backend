import pool from './connection.js'

export class RoleModel {
  static async getAll ({ email, username }) {
  }

  static async getByUserId ({ userId }) {
    const query = {
      text: `SELECT r.id, r.name
                        FROM users_roles as ur
                        JOIN roles as r ON ur.roleId = r.id
                        WHERE ur.userId = $1`,
      values: [userId]
    }
    let roles
    try {
      const { rows } = await pool.query(query)
      roles = rows
    } catch (error) {
      console.error('Error getting user roles')
      throw new Error('Database query failed at getting user roles')
    }
    return roles
  }

  static async update ({ userId, roleIds }) {
    // 0. Validar que los roleIds sean válidos
    const { rows: existingRoles } = await pool.query(
      'SELECT id FROM roles WHERE id = ANY($1)',
      [roleIds]
    )

    if (existingRoles.length !== roleIds.length) {
      throw new Error('Some roleIds do not exist')
    }

    // 1. Eliminar todos los roles actuales de este usuario
    try {
      await pool.query(
        'DELETE FROM users_roles WHERE userId = $1',
        [userId]
      )
    } catch (error) {
      console.error('Error deleting user roles')
      throw new Error('Database query failed at deleting user roles')
    }

    // 2. Construir un INSERT en bloque
    //    VALUES ($1, $2), ($3, $4), ...
    const values = []
    const placeholders = roleIds.map((roleId, i) => {
      // cada par (userId, roleId) ocupa dos posiciones en values
      values.push(userId, roleId)
      const idx1 = i * 2 + 1
      const idx2 = i * 2 + 2
      return `($${idx1}, $${idx2})`
    })

    const insertSQL = {
      text: `INSERT INTO users_roles (userId, roleId)
              VALUES ${placeholders.join(', ')}
              RETURNING userid, roleid
            `,
      values
    }

    // 3. Ejecutar el INSERT
    let roles
    try {
      const { rows } = await pool.query(insertSQL)
      roles = rows
    } catch (error) {
      console.error('Error inserting user roles')
      throw new Error('Database query failed at inserting user roles')
    }

    // 4. Si no se insertaron roles, retornar false
    if (roles.length === 0) {
      return false
    }
    // 5. Retornar los roles insertados
    return roles
  }
}
