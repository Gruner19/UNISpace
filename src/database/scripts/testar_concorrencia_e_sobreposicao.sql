-- ============================================================================
-- UNISpace — Script de Verificação de Anti-Sobreposição e Auditoria (T6.1)
-- Executa testes no banco para comprovar:
-- 1. Criação de reserva válida gera registro automático em auditoria_reservas.
-- 2. Tentativa de reserva sobreposta no mesmo espaço/horário é bloqueada (23P01).
-- 3. Tentativa de alterar ou excluir registro de auditoria é bloqueada (42501).
-- ============================================================================

DO $$
DECLARE
    v_espaco_id UUID;
    v_usuario_1 UUID;
    v_usuario_2 UUID;
    v_reserva_1 UUID;
    v_qtd_auditoria INTEGER;
    v_falhou_sobreposicao BOOLEAN := FALSE;
    v_falhou_mutacao_auditoria BOOLEAN := FALSE;
BEGIN
    -- 1. Prepara dados de teste isolados
    INSERT INTO espacos (codigo, nome, tipo, capacidade, localizacao, predio, duracao_minima_minutos, duracao_maxima_minutos, bloco_minutos)
    VALUES ('LAB-TEST-T61', 'Laboratório de Engenharia de Software', 'LABORATORIO', 30, 'Sala 204', 'ICEB III', 30, 180, 30)
    RETURNING id INTO v_espaco_id;

    INSERT INTO usuarios (nome, email_institucional, senha_hash, perfil)
    VALUES ('Estudante 1', 'estudante1.t61@aluno.ufop.edu.br', 'hash1', 'ESTUDANTE')
    RETURNING id INTO v_usuario_1;

    INSERT INTO usuarios (nome, email_institucional, senha_hash, perfil)
    VALUES ('Estudante 2', 'estudante2.t61@aluno.ufop.edu.br', 'hash2', 'ESTUDANTE')
    RETURNING id INTO v_usuario_2;

    -- 2. Insere primeira reserva válida (14:00 às 16:00)
    INSERT INTO reservas (codigo_confirmacao, espaco_id, usuario_id, data, horario_inicio, horario_fim, numero_participantes, finalidade, ip_solicitante)
    VALUES ('RES-T61-01', v_espaco_id, v_usuario_1, CURRENT_DATE + 1, '14:00', '16:00', 10, 'Estudo em grupo ESII', '127.0.0.1')
    RETURNING id INTO v_reserva_1;

    -- Verifica se a auditoria foi gerada automaticamente (RN-13)
    SELECT COUNT(*) INTO v_qtd_auditoria
      FROM auditoria_reservas
     WHERE reserva_id = v_reserva_1 AND acao = 'CRIACAO_RESERVA';

    IF v_qtd_auditoria <> 1 THEN
        RAISE EXCEPTION 'FALHA TESTE 1: Registro de auditoria nao foi criado automaticamente.';
    END IF;
    RAISE NOTICE '[OK] Teste 1: Reserva criada e auditada automaticamente em auditoria_reservas.';

    -- 3. Tenta inserir reserva sobreposta (15:00 às 17:00) no mesmo espaço e dia (RN-01 / RN-10)
    BEGIN
        INSERT INTO reservas (codigo_confirmacao, espaco_id, usuario_id, data, horario_inicio, horario_fim, numero_participantes, finalidade)
        VALUES ('RES-T61-02', v_espaco_id, v_usuario_2, CURRENT_DATE + 1, '15:00', '17:00', 8, 'Tentativa conflitante');
    EXCEPTION
        WHEN exclusion_violation THEN
            v_falhou_sobreposicao := TRUE;
            RAISE NOTICE '[OK] Teste 2: Constraint excl_reservas_sem_sobreposicao_horario bloqueou reserva sobreposta (SQLSTATE 23P01).';
    END;

    IF NOT v_falhou_sobreposicao THEN
        RAISE EXCEPTION 'FALHA TESTE 2: O banco permitiu duas reservas sobrepostas no mesmo espaco!';
    END IF;

    -- 4. Tenta adulterar ou apagar registro da tabela de auditoria (RN-13)
    BEGIN
        DELETE FROM auditoria_reservas WHERE reserva_id = v_reserva_1;
    EXCEPTION
        WHEN insufficient_privilege THEN
            v_falhou_mutacao_auditoria := TRUE;
            RAISE NOTICE '[OK] Teste 3: Trigger trg_impedir_mutacao_auditoria impediu DELETE na tabela de auditoria (SQLSTATE 42501).';
    END;

    IF NOT v_falhou_mutacao_auditoria THEN
        RAISE EXCEPTION 'FALHA TESTE 3: A tabela de auditoria permitiu exclusao de registros!';
    END IF;

    -- Limpeza por rollback intencional de teste ou remoção controlada
    RAISE NOTICE '=== TODOS OS TESTES DE BANCO DA T6.1 PASSARAM COM SUCESSO ===';
END$$;
