import { validatePartialRole } from '../schema/role.js'

export class RoleController {
  constructor ({ roleModel }) {
    this.roleModel = roleModel
  }

  getByUserId = async (req, res) => {
    const { id } = req.params
    if (!id) return res.status(400).json({ error: 'ID is required' })
    const validation = validatePartialRole({ id })
    if (validation.error) {
      // 400 Bad Request
      return res.status(400).json({ error: JSON.parse(validation.error.message) })
    }
    const roles = await this.roleModel.getByUserId({ userId: id })
    if (roles === false) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(roles)
  }

  update = async (req, res) => {
    const validation = validatePartialRole(req.body)
    if (validation.error) {
      // 400 Bad Request
      return res.status(400).json({ error: JSON.parse(validation.error.message) })
    }
    const { id, roleIds } = req.body
    const roles = await this.roleModel.update({ userId: id, roleIds })
    if (roles === false) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json({ message: 'Roles updated successfully', id, roles })
  }
}
