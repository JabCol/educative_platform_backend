# 📚 Plataforma Educativa - Backend

Este proyecto es la parte **backend** de una plataforma educativa destinada a una fundación que atiende a niños de bajos recursos. El objetivo es ofrecer una base sólida para futuras funcionalidades pedagógicas, permitiendo la **gestión de usuarios**, **asignación de roles** y **protección de rutas**. Actualmente, se encuentra en desarrollo.

## 🚀 Tecnologías utilizadas

- **Node.js**  
- **Express.js**  
- **PostgreSQL**  
- **JavaScript**
- **Arquitectura MVC**
- **Inyección de dependencias**
- **Middleware personalizado**

## 🧠 Funcionalidades principales

- **Autenticación de usuarios**
  - Registro, login, logout y restablecimiento de contraseña.
- **Protección de rutas**
  - Middleware para verificar la sesión y los permisos del usuario.
- **Gestión de usuarios**
  - Crear, editar, eliminar y obtener usuarios.
  - Filtros por nombre, apellido, correo o rol.
- **Gestión de roles**
  - Consultar roles asignados a cada usuario.
- **Arquitectura limpia**
  - Separación de responsabilidades en modelos, rutas y controladores.
- **Escalabilidad y mantenibilidad**
  - Uso de principios SOLID e inyección de dependencias.

## ⚙️ Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/JabCol/educative_platform_backend.git
cd educative_platform_backend
````

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` con las siguientes variables:

```env
# Configuraciones del proyecto
PORT=
SALT_ROUNDS=
URL_FRONTEND=

# Base de datos local
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_PORT=

# JWT
SECRET_JWT_KEY=
```

### 4. Ejecutar el servidor

```bash
npm run dev
```

## 📌 Estado del proyecto

🚧 Proyecto en desarrollo. Actualmente se encuentra implementada la parte backend.
