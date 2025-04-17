import { UserModel } from './models/postgres/user.js'
import { createApp } from './app.js'

createApp({ authModel: UserModel })
