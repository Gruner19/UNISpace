const usuarioDemonstracao = {
  id: 'user-demo-1',
  email: 'demo@aluno.ufop.edu.br'
};

export async function criarReserva(dados) {
  let resposta;

  try {
    resposta = await fetch('/api/v1/reservas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-usuario-id': usuarioDemonstracao.id,
        'x-usuario-email': usuarioDemonstracao.email
      },
      body: JSON.stringify(dados)
    });
  } catch {
    throw new Error('Não foi possível conectar à API. Verifique se o backend está em execução.');
  }

  const resultado = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    throw new Error(
      resultado?.erro?.mensagem || 'Não foi possível concluir a reserva. Tente novamente.'
    );
  }

  if (!resultado?.dados) {
    throw new Error('A API retornou uma resposta inesperada ao criar a reserva.');
  }

  return resultado.dados;
}
