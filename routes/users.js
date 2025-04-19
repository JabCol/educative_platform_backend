import { Router } from 'express'
import { UserController } from '../controllers/user.js'
import { requireAuth } from '../middleware/authentication.js'
import { upload } from '../middleware/file.js'

export const createUserModel = ({ userModel, roleModel }) => {
  // How to read a json in ESM with require
  const userRouter = Router()

  const userController = new UserController({ userModel, roleModel })

  userRouter.get('/', requireAuth, userController.getAll)
  userRouter.get('/:id', requireAuth, userController.getById)
  userRouter.post('/create', requireAuth, userController.create)
  userRouter.patch('/update', requireAuth, userController.update)
  userRouter.delete('/delete', requireAuth, userController.delete)
  userRouter.post('/bulk-create', requireAuth, upload.single('file'), userController.bulkCreateUsers)
  userRouter.delete('/bulk-delete', requireAuth, upload.single('file'), userController.bulkDeleteUsers)

  return userRouter
}
