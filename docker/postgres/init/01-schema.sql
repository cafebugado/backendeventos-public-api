-- ============================================================================
-- ARQUIVO GERADO — NÃO EDITAR À MÃO.
-- Fonte: prisma/schema.prisma. Para regenerar: npm run db:schema
-- O CI (job db-schema) falha se este arquivo não bater com o schema.prisma.
-- ============================================================================

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "eventos" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "data_evento" TEXT NOT NULL,
    "horario" TEXT NOT NULL,
    "dia_semana" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "imagem" TEXT,
    "modalidade" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "status" TEXT DEFAULT 'publicado',
    "motivo_recusa" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT DEFAULT '#2563eb',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento_tags" (
    "id" UUID NOT NULL,
    "evento_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contribuintes" (
    "id" UUID NOT NULL,
    "github_username" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "avatar_url" TEXT NOT NULL,
    "github_url" TEXT NOT NULL,
    "linkedin_url" TEXT,
    "portfolio_url" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contribuintes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "galeria_albuns" (
    "id" UUID NOT NULL,
    "evento_id" UUID,
    "comunidade_id" UUID,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "galeria_albuns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "galeria_fotos" (
    "id" UUID NOT NULL,
    "album_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "storage_path" TEXT,
    "legenda" TEXT,
    "ordem" INTEGER DEFAULT 0,
    "uploaded_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "galeria_fotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comunidades" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comunidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "user_id" UUID NOT NULL,
    "nome" TEXT,
    "sobrenome" TEXT,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "eventos_slug_unique" ON "eventos"("slug");

-- CreateIndex
CREATE INDEX "eventos_data_evento_idx" ON "eventos"("data_evento");

-- CreateIndex
CREATE INDEX "eventos_status_idx" ON "eventos"("status");

-- CreateIndex
CREATE INDEX "eventos_created_by_idx" ON "eventos"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "tags_nome_key" ON "tags"("nome");

-- CreateIndex
CREATE INDEX "evento_tags_evento_id_idx" ON "evento_tags"("evento_id");

-- CreateIndex
CREATE INDEX "evento_tags_tag_id_idx" ON "evento_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "evento_tags_evento_id_tag_id_key" ON "evento_tags"("evento_id", "tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "contribuintes_github_username_key" ON "contribuintes"("github_username");

-- CreateIndex
CREATE UNIQUE INDEX "galeria_albuns_evento_id_unique" ON "galeria_albuns"("evento_id");

-- CreateIndex
CREATE INDEX "galeria_albuns_comunidade_id_idx" ON "galeria_albuns"("comunidade_id");

-- CreateIndex
CREATE INDEX "galeria_albuns_created_by_idx" ON "galeria_albuns"("created_by");

-- CreateIndex
CREATE INDEX "galeria_fotos_album_id_idx" ON "galeria_fotos"("album_id");

-- CreateIndex
CREATE INDEX "galeria_fotos_uploaded_by_idx" ON "galeria_fotos"("uploaded_by");

-- CreateIndex
CREATE UNIQUE INDEX "comunidades_nome_key" ON "comunidades"("nome");

-- AddForeignKey
ALTER TABLE "evento_tags" ADD CONSTRAINT "evento_tags_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_tags" ADD CONSTRAINT "evento_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "galeria_albuns" ADD CONSTRAINT "galeria_albuns_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "galeria_albuns" ADD CONSTRAINT "galeria_albuns_comunidade_id_fkey" FOREIGN KEY ("comunidade_id") REFERENCES "comunidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "galeria_fotos" ADD CONSTRAINT "galeria_fotos_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "galeria_albuns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

