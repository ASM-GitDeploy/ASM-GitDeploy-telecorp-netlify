// netlify/functions/api.js

import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Extrai a rota após "/.netlify/functions/api"
  const raw = event.rawPath || event.path;
  const prefix = '/.netlify/functions/api';
  const path = raw.startsWith(prefix) ? raw.slice(prefix.length) : raw;

  try {
    // 1) Endpoint de teste
    if (path === '/test' && event.httpMethod === 'GET') {
      return { statusCode: 200, headers, body: JSON.stringify({ message: 'OK' }) };
    }

    // 2) GET /linhas
    if (path === '/linhas' && event.httpMethod === 'GET') {
      const result = await sql`SELECT * FROM linhas_telefonicas ORDER BY id`;
      return { statusCode: 200, headers, body: JSON.stringify({ linhas: result }) };
    }

    // 3) POST /linhas
    if (path === '/linhas' && event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      if (!data.numerocelular) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'numerocelular obrigatório' }) };
      }
      const inserted = await sql`
        INSERT INTO linhas_telefonicas
          (titular, numero_celular, valor, plano,
           responsavel, codigoresponsavel, contacontabil,
           centrocusto, entidade, status)
        VALUES (
          ${data.titular}, ${data.numerocelular}, ${data.valor}, ${data.plano},
          ${data.responsavel}, ${data.codigoresponsavel}, ${data.contacontabil},
          ${data.centrocusto}, ${data.entidade}, ${data.status}
        )
        RETURNING *`;
      return { statusCode: 201, headers, body: JSON.stringify(inserted[0]) };
    }

    // Rota não encontrada
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Endpoint não encontrado' }) };

  } catch (error) {
    console.error('🛑 ERRO NA FUNCTION:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro interno do servidor', details: error.message })
    };
  }
};
