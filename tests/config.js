const request = require('supertest');

const API_URL = process.env.API_URL || 'http://localhost:8000';
const api = request(API_URL);

/**
 * Gera um e-mail único com timestamp para evitar conflitos de unicidade
 */
function gerarEmailUnico(prefixo = 'teste') {
  return `${prefixo}.${Date.now()}.${Math.floor(Math.random() * 10000)}@editora.com`;
}

module.exports = {
  API_URL,
  api,
  gerarEmailUnico,
};
