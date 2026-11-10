-- ============================================================================
-- O que existe no banco real e o schema.prisma não descreve.
-- Mantido à mão. Se a produção mudar (migrations do backend FastAPI), atualize
-- aqui também. Ver "Ambiente local" no CONTRIBUTING.md.
-- ============================================================================

-- No Prisma, @default(uuid()) é gerado pelo cliente, então o 01-schema.sql cria
-- as colunas `id` sem default. No banco real elas têm default no Postgres; sem
-- isso o seed (e qualquer INSERT manual) teria que informar o id.
ALTER TABLE eventos        ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE tags           ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE evento_tags    ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE contribuintes  ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE galeria_albuns ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE galeria_fotos  ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE comunidades    ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- CHECK constraints reais (documentadas nos comentários do schema.prisma).
ALTER TABLE eventos ADD CONSTRAINT eventos_periodo_check
  CHECK (periodo IN ('Matinal', 'Diurno', 'Vespertino', 'Noturno'));

ALTER TABLE eventos ADD CONSTRAINT eventos_status_check
  CHECK (status IN ('rascunho', 'publicado', 'arquivado', 'em_analise', 'recusado'));
