import { Router } from 'express'
import { RoleController } from '../controllers/role.js'
import { requireAuth } from '../middleware/authentication.js'

export const createRoleModel = ({ roleModel }) => {
  const roleRouter = Router()

  const roleController = new RoleController({ roleModel })

  roleRouter.get('/get-userroles/:id', requireAuth, roleController.getByUserId)
  roleRouter.patch('/update', requireAuth, roleController.update)

  return roleRouter
}
