-- ============================================================================
-- UNISpace — Migração 002 (T9.1): Aprovação e rejeição de reserva especial
-- Issue: #10 (sub-issue T9.1) — CU Aprovar reserva especial
-- Banco de Dados: PostgreSQL 15+
-- Observação: ALTER TYPE ... ADD VALUE não pode executar dentro de transação;
-- rode este script fora de BEGIN/COMMIT.
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'acao_auditoria_enum'::regtype
          AND enumlabel = 'APROVACAO_RESERVA'
    ) THEN
        ALTER TYPE acao_auditoria_enum ADD VALUE 'APROVACAO_RESERVA';
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'acao_auditoria_enum'::regtype
          AND enumlabel = 'REJEICAO_RESERVA'
    ) THEN
        ALTER TYPE acao_auditoria_enum ADD VALUE 'REJEICAO_RESERVA';
    END IF;
END$$;

-- A trigger trg_registrar_auditoria_automatica_reserva (migração 001) dispara
-- em UPDATE de reservas e mapeia mudanças de status para ações de auditoria.
-- Estende o mapeamento para incluir as transições de T9.1 (não destrutivo;
-- recria o trigger com o novo mapeamento).
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
        -- T9.1: aprovação e rejeição de reserva especial
        IF OLD.status = 'PENDENTE_APROVACAO' AND NEW.status = 'CONFIRMADA' THEN
            v_acao := 'APROVACAO_RESERVA';
        ELSIF OLD.status = 'PENDENTE_APROVACAO' AND NEW.status = 'CANCELADA_ADMIN' THEN
            v_acao := 'REJEICAO_RESERVA';
        ELSIF NEW.status = 'CANCELADA_BLOQUEIO' THEN
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

-- T9.1: adiciona ações de auditoria APROVACAO_RESERVA e REJEICAO_RESERVA e atualiza trigger de auditoria.
