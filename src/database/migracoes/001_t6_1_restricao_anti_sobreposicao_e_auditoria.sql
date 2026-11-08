-- ============================================================================
-- UNISpace — Migração 001 (T6.1): Restrição Anti-Sobreposição e Auditoria
-- Issue: #35 (Sub-issue de #7 / T6 — CU Reservar Ambiente)
-- Responsável: Jordan Rivaldo Correa García (I3)
-- Banco de Dados: PostgreSQL 15+
-- Regras Atendidas: RN-01, RN-02, RN-06, RN-08, RN-09, RN-10, RN-12, RN-13
-- ============================================================================

BEGIN;

-- 1. Extensões necessárias para UUID e Exclusão Espacial/Temporal (GiST)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. Tipos Enumerados (idempotentes para integração com P0.4)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_espaco_enum') THEN
        CREATE TYPE tipo_espaco_enum AS ENUM (
            'SALA_ESTUDO',
            'LABORATORIO',
            'AUDITORIO',
            'AREA_ESPORTIVA'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_reserva_enum') THEN
        CREATE TYPE status_reserva_enum AS ENUM (
            'CONFIRMADA',
            'CANCELADA_USUARIO',
            'CANCELADA_ADMIN',
            'CANCELADA_BLOQUEIO',
            'CONCLUIDA',
            'NO_SHOW',
            'PENDENTE_APROVACAO'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'acao_auditoria_enum') THEN
        CREATE TYPE acao_auditoria_enum AS ENUM (
            'CRIACAO_RESERVA',
            'CANCELAMENTO_RESERVA',
            'CANCELAMENTO_POR_BLOQUEIO',
            'CRIACAO_BLOQUEIO',
            'REGISTRO_NO_SHOW'
        );
    END IF;
END$$;

-- 3. Estruturas Base (criadas com IF NOT EXISTS para compatibilidade com P0.4)
CREATE TABLE IF NOT EXISTS espacos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    nome VARCHAR(120) NOT NULL,
    tipo tipo_espaco_enum NOT NULL,
    capacidade INTEGER NOT NULL CHECK (capacidade >= 1),
    localizacao VARCHAR(200) NOT NULL,
    predio VARCHAR(80),
    duracao_minima_minutos INTEGER NOT NULL DEFAULT 30 CHECK (duracao_minima_minutos >= 30),
    duracao_maxima_minutos INTEGER NOT NULL DEFAULT 180 CHECK (duracao_maxima_minutos >= duracao_minima_minutos),
    bloco_minutos INTEGER NOT NULL DEFAULT 30 CHECK (bloco_minutos IN (30, 60)),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    email_institucional VARCHAR(180) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(30) NOT NULL DEFAULT 'ESTUDANTE' CHECK (perfil IN ('ESTUDANTE', 'DOCENTE', 'ADMINISTRADOR')),
    cota_semanal_horas NUMERIC(4,2) NOT NULL DEFAULT 6.00,
    no_shows_ultimos_30_dias INTEGER NOT NULL DEFAULT 0,
    suspenso_ate TIMESTAMPTZ,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bloqueios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    espaco_id UUID NOT NULL REFERENCES espacos(id) ON DELETE RESTRICT,
    administrador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL CHECK (data_fim >= data_inicio),
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL CHECK (horario_fim > horario_inicio),
    motivo TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'ENCERRADO', 'CANCELADO')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabela de Reservas com Restrição Anti-Sobreposição Física (RN-01, RN-10)
CREATE TABLE IF NOT EXISTS reservas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_confirmacao VARCHAR(16) UNIQUE NOT NULL,
    espaco_id UUID NOT NULL REFERENCES espacos(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    data DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    numero_participantes INTEGER NOT NULL CHECK (numero_participantes >= 1),
    finalidade TEXT NOT NULL CHECK (char_length(trim(finalidade)) >= 5),
    status status_reserva_enum NOT NULL DEFAULT 'CONFIRMADA',
    contabiliza_cota BOOLEAN NOT NULL DEFAULT TRUE,
    cancelada_em TIMESTAMPTZ,
    motivo_cancelamento TEXT,
    ip_solicitante VARCHAR(64),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Restrição de coerência básica de intervalo de tempo
    CONSTRAINT chk_reservas_intervalo_valido CHECK (horario_fim > horario_inicio)
);

-- 5. Aplicação da Constraint de Exclusão GiST Anti-Sobreposição (RN-01 e RN-10)
-- Impede fisicamente no motor do PostgreSQL que duas reservas CONFIRMADAS
-- ocupem o mesmo espaco_id com intervalos de tempo [inicio, fim) sobrepostos.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'excl_reservas_sem_sobreposicao_horario'
    ) THEN
        ALTER TABLE reservas
        ADD CONSTRAINT excl_reservas_sem_sobreposicao_horario
        EXCLUDE USING gist (
            espaco_id WITH =,
            tsrange((data + horario_inicio), (data + horario_fim), '[)') WITH &&
        )
        WHERE (status = 'CONFIRMADA');
    END IF;
END$$;

-- 6. Tabela Imutável de Auditoria de Reservas (RN-13)
CREATE TABLE IF NOT EXISTS auditoria_reservas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reserva_id UUID REFERENCES reservas(id) ON DELETE RESTRICT,
    bloqueio_id UUID REFERENCES bloqueios(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    acao acao_auditoria_enum NOT NULL,
    status_anterior VARCHAR(40),
    status_novo VARCHAR(40),
    detalhes JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_solicitante VARCHAR(64),
    data_hora TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Trigger de Imutabilidade Estrita na Auditoria (Append-Only para RN-13)
CREATE OR REPLACE FUNCTION fn_impedir_mutacao_auditoria()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'VIOLACAO_AUDITORIA_IMUTAVEL: Registros na tabela auditoria_reservas sao imutaveis e nao podem sofrer %.', TG_OP
        USING ERRCODE = '42501';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_impedir_mutacao_auditoria ON auditoria_reservas;
CREATE TRIGGER trg_impedir_mutacao_auditoria
BEFORE UPDATE OR DELETE ON auditoria_reservas
FOR EACH ROW
EXECUTE FUNCTION fn_impedir_mutacao_auditoria();

-- 8. Trigger Defensiva de Integridade no Banco: Espaço Ativo (RN-12), Capacidade (RN-09) e Bloqueios (RN-06)
CREATE OR REPLACE FUNCTION fn_validar_regras_reserva_bd()
RETURNS TRIGGER AS $$
DECLARE
    v_espaco_ativo BOOLEAN;
    v_capacidade INTEGER;
    v_duracao_min INTEGER;
    v_duracao_max INTEGER;
    v_duracao_solicitada INTEGER;
    v_conflito_bloqueio INTEGER;
BEGIN
    -- Só valida em inserções ou se a reserva permanecer CONFIRMADA
    IF NEW.status = 'CONFIRMADA' THEN
        SELECT ativo, capacidade, duracao_minima_minutos, duracao_maxima_minutos
          INTO v_espaco_ativo, v_capacidade, v_duracao_min, v_duracao_max
          FROM espacos
         WHERE id = NEW.espaco_id
         FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'ESPACO_NAO_ENCONTRADO: O espaco informado nao existe.'
                USING ERRCODE = 'P0002';
        END IF;

        -- RN-12: Espaços desativados não aceitam novas reservas
        IF NOT v_espaco_ativo THEN
            RAISE EXCEPTION 'ESPACO_INATIVO: Espacos desativados nao aceitam novas reservas (RN-12).'
                USING ERRCODE = '23514';
        END IF;

        -- RN-09: Número de participantes não pode exceder a capacidade do espaço
        IF NEW.numero_participantes > v_capacidade THEN
            RAISE EXCEPTION 'CAPACIDADE_EXCEDIDA: Participantes (%) excedem a capacidade do espaco (%) (RN-09).',
                NEW.numero_participantes, v_capacidade
                USING ERRCODE = '23514';
        END IF;

        -- RN-08: Validação de duração mínima e máxima em minutos
        v_duracao_solicitada := EXTRACT(EPOCH FROM (NEW.horario_fim - NEW.horario_inicio)) / 60;
        IF v_duracao_solicitada < v_duracao_min OR v_duracao_solicitada > v_duracao_max THEN
            RAISE EXCEPTION 'DURACAO_INVALIDA: Duracao solicitada (% min) fora dos limites permitidos [% a % min] (RN-08).',
                v_duracao_solicitada, v_duracao_min, v_duracao_max
                USING ERRCODE = '23514';
        END IF;

        -- RN-06: Bloqueio do administrador tem prioridade sobre qualquer reserva
        SELECT COUNT(*) INTO v_conflito_bloqueio
          FROM bloqueios b
         WHERE b.espaco_id = NEW.espaco_id
           AND b.status = 'ATIVO'
           AND b.data_inicio <= NEW.data
           AND b.data_fim >= NEW.data
           AND b.horario_inicio < NEW.horario_fim
           AND b.horario_fim > NEW.horario_inicio;

        IF v_conflito_bloqueio > 0 THEN
            RAISE EXCEPTION 'ESPACO_BLOQUEADO_MANUTENCAO: Existe bloqueio administrativo ativo para este espaco e horario (RN-06).'
                USING ERRCODE = '23P01';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_regras_reserva_bd ON reservas;
CREATE TRIGGER trg_validar_regras_reserva_bd
BEFORE INSERT OR UPDATE ON reservas
FOR EACH ROW
EXECUTE FUNCTION fn_validar_regras_reserva_bd();

-- 9. Trigger Automática de Registro de Auditoria em Criação/Alteração de Reserva (RN-13)
CREATE OR REPLACE FUNCTION fn_registrar_auditoria_automatica_reserva()
RETURNS TRIGGER AS $$
DECLARE
    v_acao acao_auditoria_enum;
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO auditoria_reservas (
            reserva_id, usuario_id, acao, status_anterior, status_novo, detalhes, ip_solicitante
        ) VALUES (
            NEW.id,
            NEW.usuario_id,
            'CRIACAO_RESERVA',
            NULL,
            NEW.status::TEXT,
            jsonb_build_object(
                'espaco_id', NEW.espaco_id,
                'data', NEW.data,
                'horario_inicio', NEW.horario_inicio,
                'horario_fim', NEW.horario_fim,
                'codigo_confirmacao', NEW.codigo_confirmacao
            ),
            NEW.ip_solicitante
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        IF NEW.status = 'CANCELADA_BLOQUEIO' THEN
            v_acao := 'CANCELAMENTO_POR_BLOQUEIO';
        ELSIF NEW.status = 'NO_SHOW' THEN
            v_acao := 'REGISTRO_NO_SHOW';
        ELSE
            v_acao := 'CANCELAMENTO_RESERVA';
        END IF;

        INSERT INTO auditoria_reservas (
            reserva_id, usuario_id, acao, status_anterior, status_novo, detalhes, ip_solicitante
        ) VALUES (
            NEW.id,
            NEW.usuario_id,
            v_acao,
            OLD.status::TEXT,
            NEW.status::TEXT,
            jsonb_build_object(
                'espaco_id', NEW.espaco_id,
                'data', NEW.data,
                'motivo_cancelamento', NEW.motivo_cancelamento,
                'contabiliza_cota', NEW.contabiliza_cota
            ),
            NEW.ip_solicitante
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_registrar_auditoria_automatica_reserva ON reservas;
CREATE TRIGGER trg_registrar_auditoria_automatica_reserva
AFTER INSERT OR UPDATE ON reservas
FOR EACH ROW
EXECUTE FUNCTION fn_registrar_auditoria_automatica_reserva();

-- 10. Índices de Performance (Atendimento ao RNF1 < 2s)
CREATE INDEX IF NOT EXISTS idx_reservas_espaco_data_status
    ON reservas (espaco_id, data, status, horario_inicio, horario_fim);

CREATE INDEX IF NOT EXISTS idx_reservas_usuario_semana
    ON reservas (usuario_id, data, status)
    WHERE contabiliza_cota = TRUE;

CREATE INDEX IF NOT EXISTS idx_auditoria_reserva_id
    ON auditoria_reservas (reserva_id, data_hora DESC);

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_id
    ON auditoria_reservas (usuario_id, data_hora DESC);

COMMIT;
