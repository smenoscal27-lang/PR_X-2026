-- =====================================================
-- EDUQUEST — Script de base de datos
-- Base de datos: eduquest
-- Motor: MySQL 8.0+
-- =====================================================

CREATE DATABASE IF NOT EXISTS eduquest
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE eduquest;

-- ─── Tabla de usuarios ───
CREATE TABLE IF NOT EXISTS users (
  id             INT          NOT NULL AUTO_INCREMENT,
  email          VARCHAR(255) NOT NULL,
  role           ENUM('student', 'teacher') NOT NULL DEFAULT 'student',
  matricula_code VARCHAR(50)  NOT NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY idx_users_matricula_code (matricula_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- idx_users_matricula_code: índice único que acelera el login por matrícula

-- ─── Datos de prueba obligatorios ───
INSERT INTO users (email, role, matricula_code) VALUES
  ('admin@institucion.edu.ec',  'teacher', 'ADMIN-001'),
  ('alumno1@institucion.edu.ec', 'student', 'ALUMNO-101')
ON DUPLICATE KEY UPDATE
  role           = VALUES(role),
  matricula_code = VALUES(matricula_code);
