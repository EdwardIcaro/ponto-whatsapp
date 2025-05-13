-- Remover completamente o banco de dados
DROP DATABASE IF EXISTS controle_ponto;

-- Criar novo banco de dados
CREATE DATABASE controle_ponto CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE controle_ponto;

-- Criar tabela colaboradores
CREATE TABLE colaboradores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  numero VARCHAR(20) NOT NULL,
  empresa VARCHAR(100) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  horario DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_numero (numero)
) ENGINE=InnoDB;

-- Criar tabela pontos
CREATE TABLE pontos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  numero VARCHAR(20) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  horario DATETIME NOT NULL,
  status VARCHAR(20) NOT NULL,
  data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (numero) REFERENCES colaboradores(numero)
) ENGINE=InnoDB;

-- Adicionar índices para melhor performance
CREATE INDEX idx_pontos_nome ON pontos(nome);
CREATE INDEX idx_pontos_numero ON pontos(numero);
CREATE INDEX idx_pontos_horario ON pontos(horario);
CREATE INDEX idx_pontos_status ON pontos(status);

-- Inserir dados de exemplo
INSERT INTO colaboradores (nome, numero, empresa, ativo) VALUES
('Andre Vitor', '5511999999999', 'Redmen', true),
('João Silva', '5511988888888', 'Redmen', true),
('Maria Santos', '5511977777777', 'Redmen', true);

INSERT INTO pontos (nome, numero, tipo, horario, status) VALUES
('Andre Vitor', '5511999999999', 'Ponto Registrado', NOW(), 'entrada'),
('João Silva', '5511988888888', 'Ponto Registrado', NOW(), 'entrada'),
('Maria Santos', '5511977777777', 'Ponto Registrado', NOW(), 'entrada');

-- Inserir os colaboradores existentes
INSERT INTO colaboradores (nome, numero, empresa, ativo) VALUES
('Andre Vitor', '5511999999999', 'Redmen', true),
('João Silva', '5511988888888', 'Redmen', true),
('Maria Santos', '5511977777777', 'Redmen', true);

-- Inserir os pontos existentes
INSERT INTO pontos (nome, numero, tipo, horario, status) VALUES
('Andre Vitor', '5511999999999', 'Ponto Registrado', '2025-05-11 13:48:00', 'entrada'),
('João Silva', '5511988888888', 'Ponto Registrado', '2025-05-11 13:48:00', 'entrada'),
('Maria Santos', '5511977777777', 'Ponto Registrado', '2025-05-11 13:48:00', 'entrada');
