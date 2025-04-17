import pg from 'pg'
import { DEFAULT_CONFIG } from '../../config.js'

const { Pool } = pg
const pool = new Pool(DEFAULT_CONFIG)

// Verificar conexión al iniciar
pool.connect()
  .then(client => {
    console.log('✅ Conexión a PostgreSQL exitosa')
    client.release() // Liberar el cliente
  })
  .catch(err => {
    console.error('❌ Error al conectar a PostgreSQL:', err.message)
  })

export default pool
