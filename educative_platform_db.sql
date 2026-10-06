
CREATE TABLE users (
    id UUID PRIMARY KEY,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    birthdate DATE,
    phoneNumber VARCHAR(100),
    cellphoneNumber VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMPTZ,
    reset_password_token VARCHAR(260),
    reset_password_token_expiration TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    status BOOLEAN DEFAULT TRUE
);

CREATE TABLE users_roles (
    userid UUID,
    roleid UUID,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (userid, roleid),
    FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (roleid) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE roles_permissions (
    roleid UUID,
    permissionid UUID,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (roleid, permissionid),
    FOREIGN KEY (roleid) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permissionid) REFERENCES permissions(id) ON DELETE CASCADE
);