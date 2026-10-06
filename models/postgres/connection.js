import pg from 'pg'
import { DEFAULT_CONFIG, DEFAULT_CONFIG_TEST, PROD_CONFIG } from '../../config.js'

const { Pool } = pg

let selectedConfig;
let selectedMessage;

if (process.env.NODE_ENV === 'test') {
  selectedConfig = DEFAULT_CONFIG_TEST;
  selectedMessage = '✅ Successfully connected to PostgreSQL (Test Database)';
} else if (process.env.NODE_ENV === 'production') {
  selectedConfig = PROD_CONFIG;
  selectedMessage = '✅ Successfully connected to PostgreSQL (Production Database)';
} else {
  selectedConfig = DEFAULT_CONFIG;
  selectedMessage = '✅ Successfully connected to PostgreSQL (Development Database)';
}

const pool = new Pool(selectedConfig)

// Verificar conexión al iniciar
pool.connect()
  .then(client => {
    console.log(selectedMessage)
    client.release() // Liberar el cliente
  })
  .catch(err => {
    console.error('❌ Error al conectar a PostgreSQL:', err.message)
  })

export default pool
