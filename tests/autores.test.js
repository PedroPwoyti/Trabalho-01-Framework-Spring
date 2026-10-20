const { api, gerarEmailUnico } = require('./config');

describe('Rotas de Autores (/api/autores)', () => {
  let autorCriadoId;
  const emailAutor = gerarEmailUnico('machado');

  describe('POST /api/autores - Cadastro de Autor', () => {
    it('deve cadastrar um novo autor com sucesso (201 Created)', async () => {
      const novoAutor = {
        nome: 'Machado de Assis',
        email: emailAutor,
        biografia: 'Fundador da Academia Brasileira de Letras.',
      };

      const res = await api
        .post('/api/autores')
        .send(novoAutor)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.nome).toBe(novoAutor.nome);
      expect(res.body.email).toBe(novoAutor.email);
      expect(res.body.biografia).toBe(novoAutor.biografia);
      expect(res.headers.location).toBeDefined();

      autorCriadoId = res.body.id;
    });

    it('deve retornar 400 Bad Request ao tentar cadastrar autor com nome em branco', async () => {
      const autorInvalido = {
        nome: '',
        email: gerarEmailUnico('invalido'),
        biografia: 'Sem nome',
      };

      const res = await api
        .post('/api/autores')
        .send(autorInvalido)
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('deve retornar 400 Bad Request ao tentar cadastrar autor com e-mail inválido', async () => {
      const autorEmailInvalido = {
        nome: 'Autor Email Inválido',
        email: 'email-invalido-sem-arroba',
        biografia: 'Email incorreto',
      };

      const res = await api
        .post('/api/autores')
        .send(autorEmailInvalido)
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('deve retornar 409 Conflict ao tentar cadastrar autor com e-mail duplicado', async () => {
      const autorDuplicado = {
        nome: 'Outro Machado',
        email: emailAutor,
        biografia: 'Tentativa de duplicidade.',
      };

      const res = await api
        .post('/api/autores')
        .send(autorDuplicado)
        .expect(409);

      expect(res.body).toHaveProperty('error');
      expect(res.body.message).toContain('Já existe um autor cadastrado com o e-mail');
    });
  });

  describe('GET /api/autores - Listagem e Filtro de Autores', () => {
    it('deve listar todos os autores cadastrados (200 OK)', async () => {
      const res = await api
        .get('/api/autores')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      const autorEncontrado = res.body.find((a) => a.id === autorCriadoId);
      expect(autorEncontrado).toBeDefined();
    });

    it('deve filtrar autores pelo parâmetro de query (?nome=...)', async () => {
      const res = await api
        .get('/api/autores?nome=Machado')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((a) => a.nome.includes('Machado'))).toBe(true);
    });
  });

  describe('GET /api/autores/nome - Busca por Nome com Query Param filtro', () => {
    it('deve retornar autores cujo nome contém o filtro especificado (200 OK)', async () => {
      const res = await api
        .get('/api/autores/nome?filtro=Machado')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].nome).toContain('Machado');
    });
  });

  describe('GET /api/autores/:id - Busca por ID', () => {
    it('deve buscar autor existente por ID com sucesso (200 OK)', async () => {
      const res = await api
        .get(`/api/autores/${autorCriadoId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.id).toBe(autorCriadoId);
      expect(res.body.nome).toBe('Machado de Assis');
    });

    it('deve retornar 404 Not Found para ID inexistente', async () => {
      await api
        .get('/api/autores/999999')
        .expect(404);
    });
  });

  describe('PUT /api/autores/:id - Atualização de Autor', () => {
    it('deve atualizar os dados do autor com sucesso (200 OK)', async () => {
      const autorAtualizado = {
        nome: 'Joaquim Maria Machado de Assis',
        email: emailAutor,
        biografia: 'Biografia atualizada: Maior escritor da literatura brasileira.',
      };

      const res = await api
        .put(`/api/autores/${autorCriadoId}`)
        .send(autorAtualizado)
        .expect(200);

      expect(res.body.id).toBe(autorCriadoId);
      expect(res.body.nome).toBe(autorAtualizado.nome);
      expect(res.body.biografia).toBe(autorAtualizado.biografia);
    });

    it('deve retornar 404 Not Found ao tentar atualizar autor inexistente', async () => {
      const autorDados = {
        nome: 'Fantasma',
        email: gerarEmailUnico('fantasma'),
        biografia: 'Nao existe',
      };

      await api
        .put('/api/autores/999999')
        .send(autorDados)
        .expect(404);
    });

    it('deve retornar 409 Conflict ao atualizar para e-mail já existente em outro autor', async () => {
      // Cria um segundo autor
      const emailOutro = gerarEmailUnico('outro');
      const outroAutor = await api
        .post('/api/autores')
        .send({
          nome: 'Outro Autor',
          email: emailOutro,
          biografia: 'Outro autor de teste',
        })
        .expect(201);

      // Tenta atualizar o primeiro autor usando o e-mail do segundo
      const res = await api
        .put(`/api/autores/${autorCriadoId}`)
        .send({
          nome: 'Machado Conflito',
          email: emailOutro,
          biografia: 'Tentando usar email alheio',
        })
        .expect(409);

      expect(res.body).toHaveProperty('error');

      // Limpa o segundo autor criado
      await api.delete(`/api/autores/${outroAutor.body.id}`);
    });
  });

  describe('GET /api/autores/:id/artigos - Artigos de um Autor', () => {
    it('deve retornar lista de artigos (ou vazia) para autor existente (200 OK)', async () => {
      const res = await api
        .get(`/api/autores/${autorCriadoId}/artigos`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('deve retornar 404 Not Found ao buscar artigos de autor inexistente', async () => {
      await api
        .get('/api/autores/999999/artigos')
        .expect(404);
    });
  });

  describe('DELETE /api/autores/:id - Remoção de Autor por ID', () => {
    it('deve remover autor com sucesso quando não possui artigos (204 No Content)', async () => {
      // Cria autor temporário para deletar
      const autorTemp = await api
        .post('/api/autores')
        .send({
          nome: 'Autor Para Deletar',
          email: gerarEmailUnico('temp.del'),
          biografia: 'Será removido em breve.',
        })
        .expect(201);

      await api
        .delete(`/api/autores/${autorTemp.body.id}`)
        .expect(204);

      // Confirma que não existe mais
      await api
        .get(`/api/autores/${autorTemp.body.id}`)
        .expect(404);
    });

    it('deve retornar 404 Not Found ao tentar remover autor inexistente', async () => {
      await api
        .delete('/api/autores/999999')
        .expect(404);
    });
  });

  afterAll(async () => {
    if (autorCriadoId) {
      await api.delete(`/api/autores/${autorCriadoId}`).catch(() => {});
    }
  });
});
