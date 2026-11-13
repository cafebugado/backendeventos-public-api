-- ============================================================================
-- Dados FICTÍCIOS para desenvolvimento local. Nada aqui vem da produção — o
-- repositório é público, então nunca cole dados reais (nomes, e-mails, links
-- privados) neste arquivo.
--
-- As datas são RELATIVAS ao dia em que o banco é criado (current_date + N), para
-- que /events/upcoming e /events/:id/recommended sempre tenham eventos futuros.
-- Se os eventos "vencerem" (banco criado há muito tempo), rode `npm run db:reset`.
--
-- IDs fixos de propósito: dá para usar nos exemplos do CONTRIBUTING e em testes
-- manuais (ex.: GET /events/11111111-1111-4111-8111-000000000001/recommended).
-- ============================================================================

-- Helpers que só existem nesta sessão (pg_temp).
CREATE FUNCTION pg_temp.br_date(d date) RETURNS text
  LANGUAGE sql IMMUTABLE AS $$ SELECT to_char(d, 'DD/MM/YYYY') $$;

CREATE FUNCTION pg_temp.dia_semana(d date) RETURNS text
  LANGUAGE sql IMMUTABLE AS $$
    SELECT (ARRAY['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
                  'Quinta-feira', 'Sexta-feira', 'Sábado'])[extract(dow FROM d)::int + 1]
  $$;

-- ---------------------------------------------------------------------------
-- Tags
-- ---------------------------------------------------------------------------
INSERT INTO tags (id, nome, cor) VALUES
  ('22222222-2222-4222-8222-000000000001', 'Frontend',   '#2563eb'),
  ('22222222-2222-4222-8222-000000000002', 'Backend',    '#16a34a'),
  ('22222222-2222-4222-8222-000000000003', 'JavaScript', '#eab308'),
  ('22222222-2222-4222-8222-000000000004', 'Python',     '#0ea5e9'),
  ('22222222-2222-4222-8222-000000000005', 'Carreira',   '#db2777'),
  ('22222222-2222-4222-8222-000000000006', 'Sem cor',    NULL);

-- ---------------------------------------------------------------------------
-- Eventos: cada um cobre um caso das regras da API
-- ---------------------------------------------------------------------------
INSERT INTO eventos (id, nome, slug, descricao, data_evento, horario, dia_semana,
                     periodo, link, imagem, modalidade, endereco, cidade, estado,
                     status, motivo_recusa, created_by, created_at)
SELECT e.id::uuid, e.nome, e.slug, e.descricao,
       pg_temp.br_date(current_date + e.dias), e.horario,
       pg_temp.dia_semana(current_date + e.dias),
       e.periodo, e.link, e.imagem, e.modalidade, e.endereco, e.cidade, e.estado,
       e.status, e.motivo_recusa, e.created_by::uuid,
       now() - make_interval(hours => e.criado_ha_horas)
FROM (VALUES
  -- Publicados e futuros: aparecem em published, upcoming, featured, recommended.
  ('11111111-1111-4111-8111-000000000001', 'Meetup de React (exemplo)', 'meetup-react-exemplo',
   'Evento fictício para desenvolvimento local.', 7, '19:00', 'Noturno',
   'https://example.com/meetup-react', 'https://placehold.co/800x450?text=React',
   'Presencial', 'Rua Exemplo, 100', 'São Paulo', 'SP', 'publicado', NULL,
   '33333333-3333-4333-8333-000000000001', 1),
  ('11111111-1111-4111-8111-000000000002', 'Live de Node.js (exemplo)', 'live-nodejs-exemplo',
   'Transmissão fictícia.', 14, '20:00', 'Noturno',
   'https://example.com/live-node', NULL,
   'Online', NULL, NULL, NULL, 'publicado', NULL,
   '33333333-3333-4333-8333-000000000002', 2),
  ('11111111-1111-4111-8111-000000000003', 'Workshop de Python (exemplo)', 'workshop-python-exemplo',
   NULL, 30, '09:00', 'Matinal',
   'https://example.com/workshop-python', 'https://placehold.co/800x450?text=Python',
   'Híbrido', 'Av. Fictícia, 200', 'Belo Horizonte', 'MG', 'publicado', NULL,
   NULL, 3),
  -- Publicado, mas já passou: aparece em published, NÃO em upcoming. Tem galeria.
  ('11111111-1111-4111-8111-000000000004', 'Hackathon passado (exemplo)', 'hackathon-passado-exemplo',
   'Já aconteceu — tem álbum na galeria.', -10, '14:00', 'Vespertino',
   'https://example.com/hackathon', NULL,
   'Presencial', 'Praça Exemplo, s/n', 'Recife', 'PE', 'publicado', NULL,
   '33333333-3333-4333-8333-000000000001', 240),
  -- NÃO publicados: nunca podem aparecer em nenhuma rota pública.
  ('11111111-1111-4111-8111-000000000005', 'Rascunho (não deve aparecer)', 'rascunho-nao-deve-aparecer',
   NULL, 5, '10:00', 'Diurno', 'https://example.com/rascunho', NULL,
   'Online', NULL, NULL, NULL, 'rascunho', NULL, NULL, 0),
  ('11111111-1111-4111-8111-000000000006', 'Recusado (não deve aparecer)', 'recusado-nao-deve-aparecer',
   NULL, 20, '10:00', 'Diurno', 'https://example.com/recusado', NULL,
   'Online', NULL, NULL, NULL, 'recusado', 'Motivo interno de moderação', NULL, 0),
  ('11111111-1111-4111-8111-000000000007', 'Em análise (não deve aparecer)', 'em-analise-nao-deve-aparecer',
   NULL, 3, '18:00', 'Noturno', 'https://example.com/em-analise', NULL,
   'Online', NULL, NULL, NULL, 'em_analise', NULL, NULL, 0)
) AS e(id, nome, slug, descricao, dias, horario, periodo, link, imagem, modalidade,
       endereco, cidade, estado, status, motivo_recusa, created_by, criado_ha_horas);

-- Publicado com data em texto livre (dado legado): aparece em published, mas
-- NÃO em upcoming (falha no regex DD/MM/YYYY do repository).
INSERT INTO eventos (id, nome, slug, data_evento, horario, dia_semana, periodo,
                     link, modalidade, status, created_at)
VALUES ('11111111-1111-4111-8111-000000000008', 'Evento com data a definir (exemplo)',
        'evento-data-a-definir-exemplo', 'A definir', 'A definir', 'A definir',
        'Noturno', 'https://example.com/a-definir', 'Online', 'publicado',
        now() - interval '5 hours');

-- Mais 12 publicados futuros, para testar paginação (?limit/?offset).
INSERT INTO eventos (nome, slug, data_evento, horario, dia_semana, periodo, link,
                     modalidade, cidade, estado, status, created_at)
SELECT 'Encontro da comunidade #' || n || ' (exemplo)',
       'encontro-comunidade-' || n || '-exemplo',
       pg_temp.br_date(current_date + 40 + n), '19:30',
       pg_temp.dia_semana(current_date + 40 + n), 'Noturno',
       'https://example.com/encontro-' || n,
       CASE WHEN n % 2 = 0 THEN 'Online' ELSE 'Presencial' END,
       CASE WHEN n % 2 = 0 THEN NULL ELSE 'Curitiba' END,
       CASE WHEN n % 2 = 0 THEN NULL ELSE 'PR' END,
       'publicado', now() - make_interval(days => n)
FROM generate_series(1, 12) AS n;

-- ---------------------------------------------------------------------------
-- Tags dos eventos (inclui tag em evento não publicado, que não pode vazar)
-- ---------------------------------------------------------------------------
INSERT INTO evento_tags (evento_id, tag_id) VALUES
  ('11111111-1111-4111-8111-000000000001', '22222222-2222-4222-8222-000000000001'),
  ('11111111-1111-4111-8111-000000000001', '22222222-2222-4222-8222-000000000003'),
  ('11111111-1111-4111-8111-000000000002', '22222222-2222-4222-8222-000000000002'),
  ('11111111-1111-4111-8111-000000000002', '22222222-2222-4222-8222-000000000003'),
  ('11111111-1111-4111-8111-000000000003', '22222222-2222-4222-8222-000000000004'),
  ('11111111-1111-4111-8111-000000000003', '22222222-2222-4222-8222-000000000002'),
  ('11111111-1111-4111-8111-000000000004', '22222222-2222-4222-8222-000000000005'),
  ('11111111-1111-4111-8111-000000000005', '22222222-2222-4222-8222-000000000001');

-- ---------------------------------------------------------------------------
-- Contribuintes (fictícios)
-- ---------------------------------------------------------------------------
INSERT INTO contribuintes (github_username, nome, avatar_url, github_url,
                           linkedin_url, portfolio_url) VALUES
  ('pessoa-exemplo-1', 'Pessoa Exemplo Um',   'https://placehold.co/96x96?text=P1',
   'https://github.com/pessoa-exemplo-1', 'https://www.linkedin.com/in/pessoa-exemplo-1', NULL),
  ('pessoa-exemplo-2', 'Pessoa Exemplo Dois', 'https://placehold.co/96x96?text=P2',
   'https://github.com/pessoa-exemplo-2', NULL, 'https://example.com'),
  ('pessoa-exemplo-3', 'Pessoa Exemplo Três', 'https://placehold.co/96x96?text=P3',
   'https://github.com/pessoa-exemplo-3', NULL, NULL);

-- ---------------------------------------------------------------------------
-- Galeria
-- ---------------------------------------------------------------------------
INSERT INTO user_profiles (user_id, nome, sobrenome) VALUES
  ('33333333-3333-4333-8333-000000000001', 'Autora', 'Exemplo'),
  ('33333333-3333-4333-8333-000000000002', 'Autor',  NULL);

INSERT INTO comunidades (id, nome, created_by) VALUES
  ('44444444-4444-4444-8444-000000000001', 'Comunidade Exemplo', '33333333-3333-4333-8333-000000000001');

INSERT INTO galeria_albuns (id, evento_id, comunidade_id, created_by, created_at) VALUES
  -- Álbum de evento publicado: mostra nome/data do evento.
  ('55555555-5555-4555-8555-000000000001', '11111111-1111-4111-8111-000000000004',
   '44444444-4444-4444-8444-000000000001', '33333333-3333-4333-8333-000000000001', now() - interval '2 days'),
  -- Álbum ligado a um RASCUNHO: a API deve devolver evento = null.
  ('55555555-5555-4555-8555-000000000002', '11111111-1111-4111-8111-000000000005',
   NULL, '33333333-3333-4333-8333-000000000002', now() - interval '1 day'),
  -- Álbum só de comunidade, autor sem user_profile.
  ('55555555-5555-4555-8555-000000000003', NULL,
   '44444444-4444-4444-8444-000000000001', '33333333-3333-4333-8333-000000000099', now());

INSERT INTO galeria_fotos (album_id, url, legenda, ordem, uploaded_by) VALUES
  ('55555555-5555-4555-8555-000000000001', 'https://placehold.co/1200x800?text=Foto+1', 'Abertura', 0, '33333333-3333-4333-8333-000000000001'),
  ('55555555-5555-4555-8555-000000000001', 'https://placehold.co/1200x800?text=Foto+2', NULL,       1, '33333333-3333-4333-8333-000000000002'),
  ('55555555-5555-4555-8555-000000000002', 'https://placehold.co/1200x800?text=Foto+3', 'Rascunho', 0, NULL),
  ('55555555-5555-4555-8555-000000000003', 'https://placehold.co/1200x800?text=Foto+4', NULL,       0, NULL);
