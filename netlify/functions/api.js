const { Pool } = require('pg');

// Configuração do banco NeonTech
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_rLH8DGJBsfk2@ep-holy-firefly-acnw4zp1-pooler.sa-east-1.aws.neon.tech/linhas_db?sslmode=require&channel_binding=require',
    ssl: {
        require: true,
        rejectUnauthorized: false
    }
});
if (path === '/test') {
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: 'OK' })
  };
}

// Headers CORS para todas as respostas
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
};

// Handler principal da função Netlify
exports.handler = async (event, context) => {
    // Tratar OPTIONS (preflight CORS)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const { httpMethod, path, queryStringParameters, body } = event;
        const parsedBody = body ? JSON.parse(body) : null;
        console.log(`${httpMethod} ${path}`);

        // Roteamento baseado no path
        const pathParts = path.split('/').filter(p => p);
        const endpoint = pathParts[pathParts.length - 1];
        const subPath = pathParts[pathParts.length - 2];

        // === ENDPOINTS ===

        // Test connection
        if (endpoint === 'test-connection' || endpoint === 'test') {
            const result = await pool.query('SELECT NOW() as current_time');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Conexão com NeonTech estabelecida',
                    timestamp: result.rows[0].current_time,
                    status: 'connected'
                })
            };
        }

        // Initialize database
        if (endpoint === 'init-database' && httpMethod === 'POST') {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // Criar tabelas
                await client.query(`
                    CREATE TABLE IF NOT EXISTS entidades (
                        id SERIAL PRIMARY KEY,
                        nome VARCHAR(255) UNIQUE NOT NULL,
                        total_linhas INTEGER DEFAULT 0,
                        linhas_ativas INTEGER DEFAULT 0,
                        linhas_inativas INTEGER DEFAULT 0,
                        custo_mensal DECIMAL(10,2) DEFAULT 0,
                        cor VARCHAR(7) DEFAULT '#3B82F6',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                await client.query(`
                    CREATE TABLE IF NOT EXISTS planos (
                        id SERIAL PRIMARY KEY,
                        nome VARCHAR(255) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                await client.query(`
                    CREATE TABLE IF NOT EXISTS centros_custo (
                        id SERIAL PRIMARY KEY,
                        nome VARCHAR(255) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                await client.query(`
                    CREATE TABLE IF NOT EXISTS linhas_telefonicas (
                        id SERIAL PRIMARY KEY,
                        titular VARCHAR(255) NOT NULL,
                        numerocelular VARCHAR(20) UNIQUE NOT NULL,
                        valor DECIMAL(8,2) NOT NULL,
                        plano VARCHAR(255) NOT NULL,
                        responsavel VARCHAR(255),
                        conta_contabil VARCHAR(50),
                        codigo_responsavel VARCHAR(20),
                        centro_custo VARCHAR(255),
                        entidade VARCHAR(255),
                        status VARCHAR(20) DEFAULT 'ativa',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                // Verificar e inserir dados iniciais
                const entidadesExist = await client.query('SELECT COUNT(*) FROM entidades');
                if (parseInt(entidadesExist.rows[0].count) === 0) {
                    await client.query(`
                        INSERT INTO entidades (nome, total_linhas, linhas_ativas, linhas_inativas, custo_mensal, cor) VALUES
                        ('145111', 45, 42, 3, 4250.80, '#3B82F6'),
                        ('145112', 28, 25, 3, 2890.50, '#10B981'),
                        ('145121', 32, 30, 2, 3120.75, '#F59E0B'),
                        ('145122', 18, 16, 2, 1650.25, '#8B5CF6')
                    `);

                    await client.query(`
                        INSERT INTO planos (nome) VALUES
                        ('Básico'), ('Básico Plus'), ('Empresarial'), ('Empresarial Pro'),
                        ('Digital Basic'), ('Digital Pro'), ('Corporativo'), ('Corporativo Max'),
                        ('Executivo'), ('Premium'), ('Premium Plus')
                    `);

                    await client.query(`
                        INSERT INTO centros_custo (nome) VALUES
                        ('CC001-Administração'), ('CC002-Vendas'), ('CC003-Operação'),
                        ('CC004-Logística'), ('CC005-Suporte')
                    `);

                    await client.query(`
                        INSERT INTO linhas_telefonicas
                        (titular, numerocelular, valor, plano, responsavel, conta_contabil, codigo_responsavel, centro_custo, entidade)
                        VALUES
                        ('João Carlos Silva Santos', '(11) 99876-5432', 120.50, 'Empresarial Pro', 'Maria Santos', '1.2.3.4.001', 'RES001', 'CC001-Administração', '145111'),
                        ('Alexandre Santos Lopes', '(19) 94532-1098', 78.50, 'Empresarial', 'Bruna Tavares', '1.2.3.4.015', 'RES015', 'CC003-Operação', '145112')
                    `);
                }

                await client.query('COMMIT');
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        message: 'Banco de dados inicializado com sucesso!'
                    })
                };
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        }

        // Get all lines
        if (endpoint === 'linhas' && httpMethod === 'GET') {
            const result = await pool.query('SELECT * FROM linhas_telefonicas ORDER BY created_at DESC');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: result.rows,
                    total: result.rows.length
                })
            };
        }

        // Add new line
        if (endpoint === 'linhas' && httpMethod === 'POST') {
            const { titular, numerocelular, valor, plano, responsavel, conta_contabil, codigo_responsavel, centro_custo, entidade } = parsedBody;
            const result = await pool.query(`
                INSERT INTO linhas_telefonicas
                (titular, numerocelular, valor, plano, responsavel, conta_contabil, codigo_responsavel, centro_custo, entidade)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `, [titular, numerocelular, valor, plano, responsavel, conta_contabil, codigo_responsavel, centro_custo, entidade]);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Linha adicionada com sucesso!',
                    data: result.rows[0]
                })
            };
        }

        // Update line
        if (subPath === 'linhas' && httpMethod === 'PUT') {
            const id = endpoint;
            const { titular, numero_celular, valor, plano, responsavel, conta_contabil, codigo_responsavel, centro_custo, entidade } = parsedBody;
            const result = await pool.query(`
                UPDATE linhas_telefonicas
                SET titular = $1, numero_celular = $2, valor = $3, plano = $4,
                    responsavel = $5, conta_contabil = $6, codigo_responsavel = $7,
                    centro_custo = $8, entidade = $9, updated_at = CURRENT_TIMESTAMP
                WHERE id = $10
                RETURNING *
            `, [titular, numero_celular, valor, plano, responsavel, conta_contabil, codigo_responsavel, centro_custo, entidade, id]);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Linha atualizada com sucesso!',
                    data: result.rows[0]
                })
            };
        }

        // Delete line
        if (subPath === 'linhas' && httpMethod === 'DELETE') {
            const id = endpoint;
            const result = await pool.query('DELETE FROM linhas_telefonicas WHERE id = $1 RETURNING *', [id]);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Linha excluída com sucesso!'
                })
            };
        }

        // Get entities
        if (endpoint === 'entidades') {
            const result = await pool.query('SELECT * FROM entidades ORDER BY nome');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, data: result.rows })
            };
        }

        // Get plans
        if (endpoint === 'planos') {
            const result = await pool.query('SELECT * FROM planos ORDER BY nome');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, data: result.rows })
            };
        }

        // Get cost centers
        if (endpoint === 'centros-custo') {
            const result = await pool.query('SELECT * FROM centros_custo ORDER BY nome');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, data: result.rows })
            };
        }

        // Get statistics
        if (endpoint === 'stats') {
            const totalLines = await pool.query('SELECT COUNT(*) FROM linhas_telefonicas');
            const activeLines = await pool.query("SELECT COUNT(*) FROM linhas_telefonicas WHERE status = 'ativa'");
            const inactiveLines = await pool.query("SELECT COUNT(*) FROM linhas_telefonicas WHERE status != 'ativa'");
            const totalCost = await pool.query('SELECT SUM(valor) FROM linhas_telefonicas');

            const entitiesStats = await pool.query(`
                SELECT
                    entidade,
                    COUNT(*) as total_linhas,
                    SUM(valor) as custo_mensal,
                    SUM(CASE WHEN status = 'ativa' THEN 1 ELSE 0 END) as linhas_ativas,
                    SUM(CASE WHEN status != 'ativa' THEN 1 ELSE 0 END) as linhas_inativas
                FROM linhas_telefonicas
                GROUP BY entidade
                ORDER BY entidade
            `);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: {
                        overview: {
                            totalLinhas: parseInt(totalLines.rows[0].count),
                            linhasAtivas: parseInt(activeLines.rows[0].count),
                            linhasInativas: parseInt(inactiveLines.rows[0].count),
                            custoMensal: parseFloat(totalCost.rows[0].sum || 0)
                        },
                        entities: entitiesStats.rows
                    }
                })
            };
        }

        // Endpoint não encontrado
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Endpoint não encontrado',
                availableEndpoints: [
                    '/test-connection',
                    '/init-database',
                    '/linhas',
                    '/entidades',
                    '/planos',
                    '/centros-custo',
                    '/stats'
                ]
            })
        };

    } catch (error) {
        console.error('Erro na função:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message,
                message: 'Erro interno do servidor'
            })
        };
    }
};
