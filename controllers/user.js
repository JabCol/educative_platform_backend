import { validateUser, validatePartialUser } from '../schema/user.js'

export class UserController {
  constructor ({ userModel, roleModel }) {
    this.userModel = userModel
    this.roleModel = roleModel
  }

  getAll = async (req, res) => {
    const { name, lastname, email, role } = req.query
    const users = await this.userModel.getAll({ name, lastname, email, role })
    if (users === false) {
      return res.status(404).json({ error: 'No users found' })
    }
    res.json(users)
  }

  getById = async (req, res) => {
    const { id } = req.params
    if (!id) return res.status(400).json({ error: 'ID is required' })
    const validation = validatePartialUser({ id })
    if (validation.error) {
      // 400 Bad Request
      return res.status(400).json({ error: JSON.parse(validation.error.message) })
    }

    const user = await this.userModel.getById(id)
    const roles = await this.roleModel.getByUserId({ userId: user.id })
    if (user === false) {
      return res.status(404).json({ error: 'User not found' })
    }
    const completeUser = {
      ...user,
      roles
    }
    res.json(completeUser)
  }

  create = async (req, res) => {
    const result = validateUser(req.body)
    if (result.error) {
      // 400 Bad Request
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }
    const newUser = await this.userModel.create(result.data)
    if (newUser === false) {
      return res.status(409).json({ error: 'User already exists' })
    }
    res.status(201).json({ message: 'User created', user: newUser })
  }

  update = async (req, res) => {
    const validation = validatePartialUser(req.body)
    if (validation.error) {
      // 400 Bad Request
      return res.status(400).json({ error: JSON.parse(validation.error.message) })
    }

    const { id } = req.body
    const user = await this.userModel.update({ id, input: validation.data })
    const roles = await this.roleModel.getByUserId({ userId: user.id })
    if (user === false) {
      return res.status(404).json({ error: 'User not found' })
    }
    const completeUser = {
      ...user,
      roles
    }
    res.json({ message: 'User updated successfully', completeUser })
  }

  delete = async (req, res) => {
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'ID is required' })
    const validation = validatePartialUser({ id })
    if (validation.error) {
      // 400 Bad Request
      return res.status(400).json({ error: JSON.parse(validation.error.message) })
    }

    const result = await this.userModel.softDeleteUser(id)
    if (result === false) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json({ message: 'User deleted successfully' })
  }

  bulkCreateUsers = async (req, res) => {
    // const results = []

    // fs.createReadStream(req.file.path)
    //   .pipe(csv())
    //   .on('data', (row) => results.push(row))
    //   .on('end', async () => {
    //   // Aquí results es un array de objetos { firstName, lastName, email, ... }
    //     for (const u of results) {
    //     // validación, hash de password, INSERT en BD
    //     // await createUser(u);
    //     }
    //     // Borra el archivo temporal
    //     fs.unlinkSync(req.file.path)
    //     res.json({ created: results.length })
    //   })
  }

  bulkDeleteUsers = async (req, res) => {
  }
}
