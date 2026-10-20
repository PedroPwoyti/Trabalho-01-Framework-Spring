const { api, gerarEmailUnico } = require('./config');

describe('Rotas de Artigos (/api/artigos)', () => {
  let autorId;
  let artigoCriadoId;

  // Antes de rodar os testes de artigos, cria um Autor para associação
  beforeAll(async () => {
    const res = await api
      .post('/api/autores')
      .send({
        nome: 'Clarice Lispector Teste',
        email: gerarEmailUnico('clarice.artigo'),
        biografia: 'Escritora para teste de artigos.',
      });

    if (res.status === 201) {
      autorId = res.body.id;
    }
  });

  describe('POST /api/artigos - Cadastro de Artigo', () => {
    it('deve cadastrar um artigo associado a um autor com sucesso (201 Created)', async () => {
      const novoArtigo = {
        titulo: 'A Hora da Estrela',
        resumo: 'Obra emblemática de Clarice Lispector relatando a vida de Macabéa.',
        publicado: true,
        autor: {
          id: autorId,
        },
      };

      const res = await api
        .post('/api/artigos')
        .send(novoArtigo)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.titulo).toBe(novoArtigo.titulo);
      expect(res.body.resumo).toBe(novoArtigo.resumo);
      expect(res.body.publicado).toBe(true);
      expect(res.body.autor).toBeDefined();
      expect(res.body.autor.id).toBe(autorId);
      expect(res.headers.location).toBeDefined();

      artigoCriadoId = res.body.id;
    });

    it('deve rejeitar cadastro sem título ou com título em branco (400 Bad Request)', async () => {
      const artigoInvalido = {
        titulo: '',
        resumo: 'Resumo válido',
        publicado: false,
        autor: { id: autorId },
      };

      await api
        .post('/api/artigos')
        .send(artigoInvalido)
        .expect(400);
    });

    it('deve rejeitar cadastro sem resumo ou com resumo em branco (400 Bad Request)', async () => {
      const artigoInvalido = {
        titulo: 'Título válido',
        resumo: '',
        publicado: false,
        autor: { id: autorId },
      };

      await api
        .post('/api/artigos')
        .send(artigoInvalido)
        .expect(400);
    });

    it('deve rejeitar cadastro com autor inexistente (404 Not Found)', async () => {
      const artigoAutorInexistente = {
        titulo: 'Artigo Sem Autor Válido',
        resumo: 'Tentando associar a um autor ID 999999',
        publicado: false,
        autor: { id: 999999 },
      };

      await api
        .post('/api/artigos')
        .send(artigoAutorInexistente)
        .expect(404);
    });

    it('deve rejeitar cadastro sem informar o autor (400 Bad Request)', async () => {
      const artigoSemAutor = {
        titulo: 'Artigo Solitário',
        resumo: 'Sem campo autor',
        publicado: false,
      };

      await api
        .post('/api/artigos')
        .send(artigoSemAutor)
        .expect(400);
    });
  });

  describe('GET /api/artigos - Listagem e Filtro por Título', () => {
    it('deve listar todos os artigos cadastrados (200 OK)', async () => {
      const res = await api
        .get('/api/artigos')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      const artigoEncontrado = res.body.find((a) => a.id === artigoCriadoId);
      expect(artigoEncontrado).toBeDefined();
    });

    it('deve filtrar artigos pelo título utilizando query parameter (?titulo=...)', async () => {
      const res = await api
        .get('/api/artigos?titulo=Estrela')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((a) => a.titulo.includes('Estrela'))).toBe(true);
    });
  });

  describe('GET /api/artigos/publicados - Listagem de Artigos Publicados', () => {
    it('deve listar apenas artigos com publicado = true (200 OK)', async () => {
      const res = await api
        .get('/api/artigos/publicados')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((artigo) => {
        expect(artigo.publicado).toBe(true);
      });
    });
  });

  describe('GET /api/artigos/:id - Busca de Artigo por ID', () => {
    it('deve retornar o artigo pelo ID com dados do autor associado (200 OK)', async () => {
      const res = await api
        .get(`/api/artigos/${artigoCriadoId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.id).toBe(artigoCriadoId);
      expect(res.body.titulo).toBe('A Hora da Estrela');
      expect(res.body.autor).toBeDefined();
      expect(res.body.autor.id).toBe(autorId);
    });

    it('deve retornar 404 Not Found para artigo inexistente', async () => {
      await api
        .get('/api/artigos/999999')
        .expect(404);
    });
  });

  describe('PUT /api/artigos/:id - Atualização de Artigo', () => {
    it('deve atualizar o artigo com sucesso (200 OK)', async () => {
      const artigoAtualizado = {
        titulo: 'A Hora da Estrela (Edição Comemorativa)',
        resumo: 'Resumo expandido e revisado com prefácio exclusivo.',
        publicado: false,
        autor: {
          id: autorId,
        },
      };

      const res = await api
        .put(`/api/artigos/${artigoCriadoId}`)
        .send(artigoAtualizado)
        .expect(200);

      expect(res.body.id).toBe(artigoCriadoId);
      expect(res.body.titulo).toBe(artigoAtualizado.titulo);
      expect(res.body.resumo).toBe(artigoAtualizado.resumo);
      expect(res.body.publicado).toBe(false);
    });

    it('deve retornar 404 Not Found ao tentar atualizar artigo inexistente', async () => {
      const dados = {
        titulo: 'Fantasma',
        resumo: 'Resumo fantasma',
        publicado: true,
        autor: { id: autorId },
      };

      await api
        .put('/api/artigos/999999')
        .send(dados)
        .expect(404);
    });
  });

  describe('GET /api/autores/:id/artigos - Verificar Associação', () => {
    it('deve listar o artigo quando consultado através da rota do autor', async () => {
      const res = await api
        .get(`/api/autores/${autorId}/artigos`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((a) => a.id === artigoCriadoId)).toBe(true);
    });
  });

  describe('DELETE /api/artigos/:id - Remoção de Artigo', () => {
    it('deve remover artigo com sucesso (204 No Content)', async () => {
      await api
        .delete(`/api/artigos/${artigoCriadoId}`)
        .expect(204);

      // Confirma que não existe mais
      await api
        .get(`/api/artigos/${artigoCriadoId}`)
        .expect(404);
    });

    it('deve retornar 404 Not Found ao tentar remover artigo inexistente', async () => {
      await api
        .delete('/api/artigos/999999')
        .expect(404);
    });
  });

  afterAll(async () => {
    if (autorId) {
      await api.delete(`/api/autores/${autorId}`).catch(() => {});
    }
  });
});
