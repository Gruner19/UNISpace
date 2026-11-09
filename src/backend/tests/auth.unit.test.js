'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { gerarHashSenha, verificarSenha } = require('../src/utils/senhaUtil');
const { gerarToken, verificarToken, extrairTokenDoHeader } = require('../src/utils/jwtUtil');
const { validarPayloadLogin } = require('../src/validators/authValidator');
const { AuthService } = require('../src/services/authService');
const { UsuarioRepository } = require('../src/repositories/usuarioRepository');

test('P1.1 Unitário — senhaUtil: gera e verifica senhas com segurança', () => {
  const senhaPlana = 'MinhaSenhaSegura123!';
  const hash = gerarHashSenha(senhaPlana);

  assert.ok(hash.includes(':'), 'O hash deve conter o formato salt:hash');
  assert.equal(verificarSenha(senhaPlana, hash), true, 'Deve validar a senha correta');
  assert.equal(verificarSenha('SenhaIncorreta', hash), false, 'Deve rejeitar senha incorreta');
  assert.equal(verificarSenha('', hash), false, 'Deve rejeitar senha vazia');
  assert.equal(verificarSenha(senhaPlana, 'hash-invalido'), false, 'Deve rejeitar hash malformado');
});

test('P1.1 Unitário — jwtUtil: gera, decodifica e valida tokens JWT', () => {
  const payload = { id: 'usr-1', email: 'aluno@aluno.ufop.edu.br', perfil: 'ESTUDANTE' };
  const secret = 'chave-teste-secreta';

  const token = gerarToken(payload, secret, '1h');
  assert.ok(typeof token === 'string' && token.split('.').length === 3, 'Deve retornar token com 3 partes');

  const decodificado = verificarToken(token, secret);
  assert.equal(decodificado.id, payload.id);
  assert.equal(decodificado.email, payload.email);
  assert.equal(decodificado.perfil, payload.perfil);
  assert.ok(decodificado.exp > Math.floor(Date.now() / 1000), 'Deve possuir timestamp de expiração futuro');

  // Token com assinatura adulterada
  assert.throws(
    () => verificarToken(token, 'chave-diferente'),
    /Assinatura de token inválida/
  );

  // Token expirado
  const tokenExpirado = gerarToken(payload, secret, -10);
  assert.throws(
    () => verificarToken(tokenExpirado, secret),
    /Token expirado/
  );

  // Extração de Header
  assert.equal(extrairTokenDoHeader(`Bearer ${token}`), token);
  assert.equal(extrairTokenDoHeader(`bearer ${token}`), token);
  assert.equal(extrairTokenDoHeader('Basic 12345'), null);
  assert.equal(extrairTokenDoHeader(null), null);
});

test('P1.1 Unitário — authValidator: RN-02 e validações de campos de login', () => {
  // Caso de sucesso
  const valido = validarPayloadLogin({
    email: 'estudante@aluno.ufop.edu.br',
    senha: 'Senha123Valida'
  });
  assert.equal(valido.email, 'estudante@aluno.ufop.edu.br');
  assert.equal(valido.senha, 'Senha123Valida');

  // Rejeita domínios não institucionais (RN-02 -> 403)
  assert.throws(
    () => validarPayloadLogin({ email: 'usuario@gmail.com', senha: '123' }),
    (erro) => erro.codigo === 'EMAIL_NAO_INSTITUCIONAL' && erro.statusHttp === 403
  );
  assert.throws(
    () => validarPayloadLogin({ email: 'usuario@hotmail.com', senha: '123' }),
    (erro) => erro.codigo === 'EMAIL_NAO_INSTITUCIONAL' && erro.statusHttp === 403
  );

  // Rejeita e-mail ausente ou malformado (400)
  assert.throws(
    () => validarPayloadLogin({ email: '', senha: '123' }),
    (erro) => erro.codigo === 'EMAIL_OBRIGATORIO' && erro.statusHttp === 400
  );
  assert.throws(
    () => validarPayloadLogin({ email: 'email_sem_arroba', senha: '123' }),
    (erro) => erro.codigo === 'EMAIL_FORMATO_INVALIDO' && erro.statusHttp === 400
  );

  // Rejeita senha ausente (400)
  assert.throws(
    () => validarPayloadLogin({ email: 'aluno@ufop.edu.br', senha: '' }),
    (erro) => erro.codigo === 'SENHA_OBRIGATORIA' && erro.statusHttp === 400
  );
});

test('P1.1 Unitário — authService: fluxo de login com sucesso e credenciais inválidas', async () => {
  const senhaOriginal = 'SenhaForte123!';
  const senhaHash = gerarHashSenha(senhaOriginal);

  const usuarios = [
    {
      id: 'usr-ativo',
      nome: 'Usuário Ativo',
      emailInstitucional: 'ativo@aluno.ufop.edu.br',
      senhaHash,
      perfil: 'ESTUDANTE',
      ativo: true
    },
    {
      id: 'usr-inativo',
      nome: 'Usuário Inativo',
      emailInstitucional: 'inativo@aluno.ufop.edu.br',
      senhaHash,
      perfil: 'ESTUDANTE',
      ativo: false
    }
  ];

  const repo = new UsuarioRepository(usuarios);
  const service = new AuthService(repo);

  // 1. Sucesso
  const resultado = await service.login({
    email: 'ativo@aluno.ufop.edu.br',
    senha: senhaOriginal
  });
  assert.ok(resultado.token, 'Deve retornar o token JWT');
  assert.equal(resultado.usuario.id, 'usr-ativo');
  assert.equal(resultado.usuario.email, 'ativo@aluno.ufop.edu.br');
  assert.equal(resultado.usuario.senhaHash, undefined, 'Não deve expor o hash de senha');

  // 2. Senha incorreta -> 401
  await assert.rejects(
    () => service.login({ email: 'ativo@aluno.ufop.edu.br', senha: 'SenhaErrada' }),
    (erro) => erro.codigo === 'CREDENCIAS_INVALIDAS' && erro.statusHttp === 401
  );

  // 3. Usuário inexistente -> 401 (mensagem genérica anti-enumeração)
  await assert.rejects(
    () => service.login({ email: 'inexistente@aluno.ufop.edu.br', senha: senhaOriginal }),
    (erro) => erro.codigo === 'CREDENCIAS_INVALIDAS' && erro.statusHttp === 401
  );

  // 4. Usuário inativo -> 403
  await assert.rejects(
    () => service.login({ email: 'inativo@aluno.ufop.edu.br', senha: senhaOriginal }),
    (erro) => erro.codigo === 'USUARIO_INATIVO' && erro.statusHttp === 403
  );
});
