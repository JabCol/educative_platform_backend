import multer from 'multer'
import path from 'node:path'

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/') // La carpeta donde se guardarán los archivos
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)) // Nombre único
  }
})

export const upload = multer({ storage })
