-- ============================================================================
-- Mesma role somente-leitura da produção (public_api_readonly), mas com uma
-- senha LOCAL e pública — este banco só existe na máquina de quem roda o
-- docker compose e só tem dados fictícios. Não use esta senha em outro lugar.
--
-- A API local conecta com esta role, então um INSERT/UPDATE acidental falha
-- aqui do mesmo jeito que falharia na produção.
-- ============================================================================

CREATE ROLE public_api_readonly WITH LOGIN PASSWORD 'readonly_local';

GRANT USAGE ON SCHEMA public TO public_api_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO public_api_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO public_api_readonly;
