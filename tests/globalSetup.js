const http = require('http');

module.exports = async function globalSetup() {
  const url = process.env.API_URL || 'http://localhost:8000';
  
  return new Promise((resolve) => {
    const req = http.get(`${url}/api/autores`, (res) => {
      console.log(`\n\x1b[32m✔ Servidor Spring Boot detectado com sucesso em ${url}! Iniciando os testes Jest das rotas...\x1b[0m\n`);
      resolve();
    });

    req.on('error', () => {
      console.log(
        `\n\x1b[33m⚠ Atenção: A aplicação Spring Boot não foi detectada em ${url}.\x1b[0m\n` +
        `\x1b[36mℹ Dica: Para rodar os testes das rotas com a API ativa, inicie o backend em outro terminal:\x1b[0m\n` +
        `   cd editora_aprimorado\n` +
        `   mvnw.cmd spring-boot:run  (Windows)  ou  ./mvnw spring-boot:run  (Linux/macOS)\n`
      );
      resolve();
    });

    req.setTimeout(2000, () => {
      req.destroy();
      resolve();
    });
  });
};
