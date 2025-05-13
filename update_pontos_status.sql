-- Atualizar registros existentes para usar os valores corretos do ENUM
UPDATE pontos SET status = 'intervalo' WHERE status = 'inicio_intervalo';
UPDATE pontos SET status = 'intervalo' WHERE status = 'fim_intervalo';

-- Dropar e recriar o ENUM com os valores corretos
ALTER TABLE pontos MODIFY COLUMN status ENUM('entrada', 'intervalo', 'saida') NOT NULL DEFAULT 'entrada';
