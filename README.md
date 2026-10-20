# 📚 Desenvolvimento Web — Trabalho 01: Framework Spring Boot

![Logo UEPG](http://136.248.68.47/logouepg.png)

> **Universidade Estadual de Ponta Grossa (UEPG)**  
> **Curso:** Engenharia de Software  
> **Disciplina:** Desenvolvimento Web  
> **Ano/Semestre:** 2026/2  

---

## 📖 Visão Geral do Projeto

Este repositório contém a implementação completa do **Trabalho 01 da disciplina de Desenvolvimento Web**. Trata-se de uma **API RESTful** desenvolvida com o framework **Spring Boot**, focada no gerenciamento de uma **Editora**, contemplando as entidades **Autor** e **Artigo** com relacionamento relacional `@ManyToOne` / `@OneToMany`, validações de integridade, tratamento global de exceções, documentação das rotas e **baterias completas de testes automatizados** (tanto testes de integração em **Java/Spring Boot com MockMvc e JUnit 5**, quanto testes de rotas ponta a ponta com **JavaScript / Jest e Supertest**).

---

## 🛠️ Tecnologias e Ferramentas

### Backend (Spring Boot)
* **Java 17+** (Compatível com JDKs 17 a 26)
* **Spring Boot 4.1.1**
  * **Spring Web MVC**: Construção dos controladores REST e mapeamento de rotas.
  * **Spring Data JPA / Hibernate 7**: Persistência de dados e mapeamento objeto-relacional.
  * **Spring Boot Starter Validation**: Validações de entrada (`@NotBlank`, `@Email`, `@Valid`).
* **PostgreSQL 18.x**: Banco de dados relacional.
* **Lombok**: Redução de boilerplate (getters, setters, construtores, equals/hashcode).
* **Maven Wrapper (`mvnw` / `mvnw.cmd`)**: Build e gestão de dependências sem necessidade de instalação manual do Maven.

### Testes Automatizados
* **Jest + Supertest**: Suíte de testes de integração HTTP em Node.js cobrindo 100% das rotas e cenários de sucesso e erro.
* **Spring Test (MockMvc + JUnit 5)**: Testes de integração nativos do Spring Boot no diretório `editora_aprimorado/src/test`.
* **Postman**: Coleções de requisições organizadas e exportadas para testes manuais e em equipe (`postman/` e `editora_aprimorado/docs/`).

---

## 🏗️ Estrutura de Diretórios

```text
Trabalho-01-Framework-Spring/
├── README.md                      # Documentação completa do projeto e das rotas
├── package.json                   # Configurações e scripts dos testes Jest
├── jest.config.js                 # Configuração do Jest com globalSetup
├── tests/                         # Suíte de testes Jest para as rotas da API
│   ├── config.js                  # Configurações do Supertest e utilitários
│   ├── globalSetup.js             # Verificação prévia da disponibilidade da API
│   ├── autores.test.js            # Testes Jest das rotas de Autores (/api/autores)
│   └── artigos.test.js            # Testes Jest das rotas de Artigos (/api/artigos)
├── postman/                       # Coleção de requisições Postman versionadas
│   └── collections/Editora API/
│       ├── Autores/               # Requests de teste para autores
│       └── Artigos/               # Requests de teste para artigos
└── editora_aprimorado/            # Código-fonte da aplicação Spring Boot
    ├── pom.xml                    # Configuração Maven e dependências
    ├── mvnw / mvnw.cmd            # Wrapper Maven para Linux/macOS e Windows
    └── src/
        ├── main/
        │   ├── java/dw/editora/
        │   │   ├── control/       # Controllers REST (AutorController, ArtigoController)
        │   │   ├── entity/        # Entidades JPA (Autor, Artigo)
        │   │   ├── repository/    # Interfaces Spring Data JPA
        │   │   ├── service/       # Regras de negócio e validações
        │   │   └── exception/     # Tratamento centralizado de erros (GlobalExceptionHandler)
        │   └── resources/
        │       └── application.properties # Configuração do banco PostgreSQL
        └── test/                  # Testes nativos Spring Boot com MockMvc e JUnit 5
```

---

## 🚦 O que Cada Rota Faz (Documentação da API)

A aplicação expõe sua API REST sob a URL base:  
`http://localhost:8000/api`

---

### 1. Rotas de Autores (`/api/autores`)

Gerenciamento completo do ciclo de vida dos autores e consulta dos seus artigos vinculados.

| Método | Endpoint | Status Sucesso | O que a rota faz |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/autores` | `201 Created` | **Cadastra um novo autor.** Valida se o `nome` não está em branco, se o `email` é válido e se não está duplicado. Retorna o autor criado no corpo e o header `Location: /api/autores/{id}`. |
| `GET` | `/api/autores` | `200 OK` | **Lista todos os autores cadastrados.** Se fornecido o parâmetro opcional `?nome=texto`, filtra os autores que contenham o termo no nome (sem distinção de maiúsculas/minúsculas). |
| `GET` | `/api/autores/nome?filtro={termo}` | `200 OK` | **Busca autores por termo no nome.** Realiza uma busca textual (`contains ignore case`) no campo `nome`. Retorna uma lista com os autores correspondentes. |
| `GET` | `/api/autores/{id}` | `200 OK` | **Consulta um autor específico pelo ID.** Retorna os dados cadastrais do autor (`id`, `nome`, `email`, `biografia`). Retorna `404 Not Found` caso o ID não exista. |
| `PUT` | `/api/autores/{id}` | `200 OK` | **Atualiza os dados de um autor existente.** Atualiza `nome`, `email` e `biografia`. Garante que o novo e-mail não entre em conflito com o de outro autor (`409 Conflict`). Retorna `404 Not Found` se o autor não existir. |
| `DELETE` | `/api/autores/{id}` | `204 No Content` | **Remove um autor pelo ID.** Exclui o registro caso não possua artigos vinculados. Retorna `404 Not Found` se o ID não existir e impede exclusão se houver artigos associados. |
| `DELETE` | `/api/autores` | `204 No Content` | **Remove todos os autores.** Limpa a tabela de autores do banco de dados. |
| `GET` | `/api/autores/{id}/artigos` | `200 OK` | **Lista todos os artigos de um determinado autor.** Retorna a lista de artigos cujo `autor_id` corresponde ao ID informado. Retorna `404 Not Found` se o autor não existir e `[]` (lista vazia) se ele não tiver artigos. |

#### Exemplos de Requisição e Resposta — Autores

##### Criar Autor (`POST /api/autores`)
* **Requisição:**
  ```http
  POST /api/autores HTTP/1.1
  Host: localhost:8000
  Content-Type: application/json

  {
    "nome": "Machado de Assis",
    "email": "machado@editora.com",
    "biografia": "Fundador e primeiro presidente da Academia Brasileira de Letras."
  }
  ```
* **Resposta (`201 Created` — Header `Location: /api/autores/1`):**
  ```json
  {
    "id": 1,
    "nome": "Machado de Assis",
    "email": "machado@editora.com",
    "biografia": "Fundador e primeiro presidente da Academia Brasileira de Letras."
  }
  ```

##### Erro de Conflito de E-mail (`409 Conflict`)
* **Resposta:**
  ```json
  {
    "timestamp": "2026-10-19T22:30:00.000",
    "status": 409,
    "error": "Conflito de dados",
    "message": "Já existe um autor cadastrado com o e-mail: machado@editora.com",
    "path": "/api/autores"
  }
  ```

---

### 2. Rotas de Artigos (`/api/artigos`)

Gerenciamento de artigos associados a autores via chave estrangeira.

| Método | Endpoint | Status Sucesso | O que a rota faz |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/artigos` | `201 Created` | **Cadastra um novo artigo associado a um autor.** Requer `titulo`, `resumo`, `publicado` e o objeto `autor` contendo `{"id": <id_autor>}`. Valida a existência do autor (`404` se não existir). Retorna o artigo criado com os dados do autor e o header `Location: /api/artigos/{id}`. |
| `GET` | `/api/artigos` | `200 OK` | **Lista todos os artigos.** Aceita o parâmetro opcional `?titulo=texto` para filtrar por correspondência no título. Cada item retornado inclui os dados do respectivo autor. |
| `GET` | `/api/artigos/{id}` | `200 OK` | **Consulta um artigo por ID.** Retorna o artigo completo com as informações do seu autor associado. Retorna `404 Not Found` se o artigo não existir. |
| `GET` | `/api/artigos/publicados` | `200 OK` | **Lista apenas os artigos publicados.** Filtra no banco de dados e retorna todos os artigos onde `publicado == true`. |
| `PUT` | `/api/artigos/{id}` | `200 OK` | **Atualiza um artigo existente por ID.** Atualiza campos como `titulo`, `resumo`, `publicado` e permite reatribuir o autor via `autor.id`. Retorna `404 Not Found` se o artigo ou o autor informado não existirem. |
| `DELETE` | `/api/artigos/{id}` | `204 No Content` | **Remove um artigo pelo ID.** Exclui o artigo especificado. Retorna `404 Not Found` se o artigo não existir. |
| `DELETE` | `/api/artigos` | `204 No Content` | **Remove todos os artigos.** Limpa integralmente a tabela de artigos. |

#### Exemplos de Requisição e Resposta — Artigos

##### Criar Artigo (`POST /api/artigos`)
* **Requisição:**
  ```http
  POST /api/artigos HTTP/1.1
  Host: localhost:8000
  Content-Type: application/json

  {
    "titulo": "Dom Casmurro",
    "resumo": "Narrativa psicológica focada na dúvida de Bentinho sobre a fidelidade de Capitu.",
    "publicado": true,
    "autor": {
      "id": 1
    }
  }
  ```
* **Resposta (`201 Created` — Header `Location: /api/artigos/1`):**
  ```json
  {
    "id": 1,
    "titulo": "Dom Casmurro",
    "resumo": "Narrativa psicológica focada na dúvida de Bentinho sobre a fidelidade de Capitu.",
    "publicado": true,
    "autor": {
      "id": 1,
      "nome": "Machado de Assis",
      "email": "machado@editora.com",
      "biografia": "Fundador e primeiro presidente da Academia Brasileira de Letras."
    }
  }
  ```

##### Listar Artigos de um Autor (`GET /api/autores/1/artigos`)
* **Resposta (`200 OK`):**
  ```json
  [
    {
      "id": 1,
      "titulo": "Dom Casmurro",
      "resumo": "Narrativa psicológica focada na dúvida de Bentinho sobre a fidelidade de Capitu.",
      "publicado": true,
      "autor": {
        "id": 1,
        "nome": "Machado de Assis",
        "email": "machado@editora.com",
        "biografia": "Fundador e primeiro presidente da Academia Brasileira de Letras."
      }
    }
  ]
  ```

---

## ⚙️ Configuração do Ambiente e Execução

### 1. Pré-requisitos
* **Java JDK 17** ou superior instalado e configurado no `PATH`.
* **Node.js 18+** e **npm** instalados.
* **PostgreSQL** instalado e ativo na porta `5432`.

### 2. Configuração do Banco de Dados
Crie a base de dados no PostgreSQL:
```sql
CREATE DATABASE editora;
```

A aplicação lê as variáveis de ambiente com padrões configurados em [`editora_aprimorado/src/main/resources/application.properties`](editora_aprimorado/src/main/resources/application.properties):
* Porta da aplicação: `8000`
* Banco: `editora`
* Usuário padrão: `postgres`
* Senha padrão: `SENHA`

Caso sua senha do PostgreSQL seja diferente, configure antes de executar:
* **Windows (PowerShell):**
  ```powershell
  $env:DB_PASSWORD="sua_senha_aqui"
  ```
* **Linux / macOS:**
  ```bash
  export DB_PASSWORD="sua_senha_aqui"
  ```

> [!TIP]
> **Fallback Automático (Zero Configuração):** Se o PostgreSQL não estiver rodando ou não estiver instalado na máquina, a aplicação detecta automaticamente a ausência do serviço e utiliza o banco de dados em memória **H2** (configurado em modo de compatibilidade PostgreSQL). Dessa forma, a aplicação e os testes funcionam imediatamente sem necessidade de configuração prévia de banco de dados.

### 3. Executando o Servidor Spring Boot
Acesse a pasta da aplicação e inicie via Maven Wrapper:

* **Windows:**
  ```powershell
  cd editora_aprimorado
  .\mvnw.cmd spring-boot:run
  ```
* **Linux / macOS:**
  ```bash
  cd editora_aprimorado
  ./mvnw spring-boot:run
  ```
A API ficará disponível em `http://localhost:8000`.

---

## 🧪 Testes Automatizados

O projeto conta com duas camadas completas de testes automatizados:

### 1. Testes de Rotas com Jest e Supertest (Node.js)
Testes ponta a ponta que efetuam requisições HTTP reais contra todos os endpoints da API, validando códigos de status, cabeçalhos, integridade do corpo de resposta e regras de validação.

1. Instale as dependências (já instaladas no repositório):
   ```bash
   npm install
   ```
2. Com a API Spring Boot em execução, execute a suíte de testes:
   ```bash
   # Executar todos os testes de rotas
   npm test

   # Executar somente testes de autores
   npm run test:autores

   # Executar somente testes de artigos
   npm run test:artigos

   # Executar com relatório de cobertura
   npm run test:coverage
   ```

### 2. Testes de Integração com Spring Boot (MockMvc + JUnit 5)
Testes nativos em Java que validam o contexto Spring, os Controllers, os Services e a persistência em banco isolado (`editora_test`).

* **Windows:**
  ```powershell
  cd editora_aprimorado
  .\mvnw.cmd clean test
  ```
* **Linux / macOS:**
  ```bash
  cd editora_aprimorado
  ./mvnw clean test
  ```

---

## 📜 Licença

Este projeto é distribuído sob a licença MIT. É permitida a reprodução, modificação e distribuição para fins acadêmicos e educacionais.

---

## Alunos

Nome: Luis Felipe da Rosa Teixeira
RA: 25090823
Nome: Otavio de Quadros Sonnenstrahl
RA: 25119823
Nome: Pedro Paulo Woytichoski Neto
RA: 25068123
