import express from 'express'
import { PORT } from './config.js'

const app = express()

app.disable('x-powered-by')

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(PORT, () => {
  console.log(`Server is listening on port localhost:${PORT}`)
})
