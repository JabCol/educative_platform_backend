import { UserModel } from './models/postgres/user.js'
import { RoleModel } from './models/postgres/roles.js'
import { createApp } from './app.js'

createApp({ userModel: UserModel, roleModel: RoleModel })
