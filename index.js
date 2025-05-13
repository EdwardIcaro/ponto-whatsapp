require('dotenv').config();
const venom = require('venom-bot');
const express = require('express');
const mysql = require('mysql2');
const app = express();

// Configuração do banco de dados
const configDB = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'controle_ponto'
};

// Função para reconectar ao banco de dados
function reconectarBanco() {
  console.log('🔄 Reconectando ao banco de dados...');
  return new Promise((resolve, reject) => {
    const novaConexao = mysql.createConnection(configDB);

    novaConexao.connect((err) => {
      if (err) {
        console.error('❌ Erro ao reconectar ao banco de dados:', err);
        return reject(err);
      }
      console.log('✅ Reconectado ao banco de dados com sucesso!');
      resolve(novaConexao);
    });
  });
}

// Middleware para verificar conexão com o banco
async function verificarConexaoBanco(req, res, next) {
  try {
    await new Promise((resolve, reject) => {
      db.ping((err) => {
        if (err) {
          console.error('❌ Conexão com o banco perdida:', err);
          reconectarBanco()
            .then(novaConexao => {
              db = novaConexao;
              resolve();
            })
            .catch(err => reject(err));
        } else {
          resolve();
        }
      });
    });
    next();
  } catch (error) {
    console.error('❌ Erro ao verificar conexão:', error);
    res.status(500).json({ error: 'Erro ao verificar conexão com o banco de dados', details: error.message });
  }
}

// Middleware para ignorar mensagens do status@broadcast
async function ignorarStatusBroadcast(client, message) {
  if (message.from === 'status@broadcast') {
    console.log('🔍 Ignorando mensagem de status@broadcast');
    return false;
  }
  return true;
}
const PORT = 3000;

const registros = []; // Aqui vamos guardar os dados em memória por enquanto

// Coordenadas das empresas
const EMPRESAS = {
  empresa1: { nome: 'Empresa 1', latitude: -5.531006364647842, longitude: -47.488644840452835 },
  empresa2: { nome: 'Empresa 2', latitude: -5.510141843353245, longitude: -47.47490373073289 },
};
const RAIO_PERMITIDO = 0.5; // Raio permitido em quilômetros

// Tipos de status permitidos
const TIPOS_STATUS = {
  ENTRADA: 'entrada',
  INICIO_INTERVALO: 'inicio_intervalo',
  FIM_INTERVALO: 'fim_intervalo',
  SAIDA: 'saida'
};

// Palavras-chave para o sistema de intervalo
const PALAVRAS_CHAVE = {
  INICIO_INTERVALO: 'intervalo',
  FIM_INTERVALO: 'retornar',
  SAIDA: 'saida'
};

// Configuração da conexão com o banco de dados
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Usuário padrão do MySQL
  password: '', // Deixe vazio se não configurou uma senha
  database: 'controle_ponto', // Nome do banco de dados
});

// Conectar ao banco de dados
db.connect((err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err);
    return;
  }
  console.log('✅ Conectado ao banco de dados MySQL!');
});

db.ping((err) => {
  if (err) {
    console.error('❌ Conexão com o banco de dados perdida:', err);
  } else {
    console.log('✅ Conexão com o banco de dados está ativa.');
  }
});

// API para Gerenciar Colaboradores

// Listar colaboradores
app.get('/api/colaboradores', (req, res) => {
  const query = 'SELECT * FROM colaboradores ORDER BY nome';
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Erro ao buscar colaboradores:', err);
      return res.status(500).json({ 
        error: 'Erro ao buscar colaboradores',
        details: err.message
      });
    }
    res.json(results);
  });
});

// Adicionar colaborador
app.post('/api/colaboradores', express.json(), (req, res) => {
  // Log do corpo da requisição
  console.log('✅ Requisição recebida:', {
    nome: req.body.nome,
    numero: req.body.numero,
    empresa: req.body.empresa
  });

  const { nome, numero, empresa } = req.body;
  
  // Normalizar o número
  const numeroNormalizado = normalizarNumero(numero);
  console.log('✅ Número normalizado:', {
    original: numero,
    normalizado: numeroNormalizado
  });
  
  // Validar se a empresa é válida
  const empresasValidas = ['Empresa 1', 'Empresa 2'];
  if (!empresasValidas.includes(empresa)) {
    console.log('❌ Empresa inválida:', empresa);
    return res.status(400).json({
      error: '❌ Empresa inválida. Escolha uma empresa válida.'
    });
  }

  // Verificar se o número já existe
  db.query('SELECT id FROM colaboradores WHERE numero = ?', [numeroNormalizado], (err, results) => {
    if (err) {
      console.error('❌ Erro ao verificar colaborador:', {
        error: err,
        numero: numeroNormalizado
      });
      return res.status(500).json({
        error: 'Erro ao verificar colaborador',
        details: err.message
      });
    }

    if (results.length > 0) {
      console.log('❌ Número já existe:', {
        numero: numeroNormalizado,
        id: results[0].id
      });
      return res.status(400).json({
        error: 'Já existe um colaborador com este número'
      });
    }

    console.log('✅ Número disponível para uso:', numeroNormalizado);
    if (err) {
      console.error('❌ Erro ao verificar colaborador:', err);
      return res.status(500).json({
        error: 'Erro ao verificar colaborador',
        details: err.message
      });
    }

    if (results.length > 0) {
      return res.status(400).json({
        error: 'Já existe um colaborador com este número'
      });
    }

    // Inserir o novo colaborador
    const query = 'INSERT INTO colaboradores (nome, numero, empresa) VALUES (?, ?, ?)';
    db.query(query, [nome, numero, empresa], (err, result) => {
      if (err) {
        console.error('❌ Erro ao adicionar colaborador:', err);
        return res.status(500).json({
          error: 'Erro ao adicionar colaborador',
          details: err.message
        });
      }

      if (result.affectedRows === 1) {
        console.log('✅ Colaborador adicionado com sucesso:', {
          id: result.insertId,
          nome,
          numero: numeroNormalizado,
          empresa
        });
        return res.status(201).json({
          success: true,
          message: 'Colaborador adicionado com sucesso',
          data: {
            id: result.insertId,
            nome,
            numero: numeroNormalizado,
            empresa
          }
        });
      }

      console.error('❌ Inserção não afetou nenhuma linha');
      return res.status(500).json({
        error: 'Erro ao adicionar colaborador. Por favor, tente novamente'
      });
    });
  });
});

// Servir os arquivos HTML
app.use(express.static('public'));

// Servir a página de colaboradores
app.get('/colaboradores', (req, res) => {
  res.sendFile(__dirname + '/public/colaboradores.html');
});

// Servir a página de pontos
app.get('/pontos', (req, res) => {
  res.sendFile(__dirname + '/pontos.html');
});

// API para remover colaborador
app.delete('/api/colaboradores/:id', (req, res) => {
  const id = req.params.id;
  
  // Primeiro verificar se o colaborador existe
  db.query('SELECT numero FROM colaboradores WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('❌ Erro ao verificar colaborador:', err);
      return res.status(500).json({ error: 'Erro ao verificar colaborador', details: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Colaborador não encontrado' });
    }

    const numero = results[0].numero;

    // Remover todos os pontos do colaborador
    db.query('DELETE FROM pontos WHERE numero = ?', [numero], (err) => {
      if (err) {
        console.error('❌ Erro ao remover pontos:', err);
        return res.status(500).json({ error: 'Erro ao remover pontos', details: err.message });
      }

      // Agora remover o colaborador
      db.query('DELETE FROM colaboradores WHERE id = ?', [id], (err, result) => {
        if (err) {
          console.error('❌ Erro ao remover colaborador:', err);
          return res.status(500).json({ error: 'Erro ao remover colaborador', details: err.message });
        }
        
        res.status(200).json({ 
          success: true,
          message: 'Colaborador e seus pontos removidos com sucesso' 
        });
      });
    });
  });
});

// API para enviar os dados ao site
app.get('/api/pontos', verificarConexaoBanco, (req, res) => {
  const query = 'SELECT * FROM pontos ORDER BY horario DESC';
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Erro ao buscar pontos:', err);
      res.status(500).json({ error: 'Erro ao buscar pontos', details: err.message });
      return;
    }
    res.json(results);
  });
});

// Iniciar servidor web
app.listen(PORT, () => {
  console.log(`🌐 Painel disponível em http://localhost:${PORT}`);
});

// Configuração do Venom-Bot
venom
  .create({
    session: 'session-ponto',
    headless: false, // Mantém o navegador visível
    browserArgs: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920x1080'
    ],
    useChrome: true,
    debug: true,
    logQR: true,
    autoClose: 60000, // Fecha o bot após 60 segundos sem atividade
    waitTime: 10000, // Tempo de espera entre ações
    killProcess: true,
    disableSpins: true,
    disableWelcome: true,
    disableLogs: false
  })
  .then((client) => {
    console.log('✅ Bot iniciado com sucesso!');
    start(client);
  })
  .catch((error) => {
    console.error('❌ Erro ao iniciar o Venom-Bot:', error);
    console.error('❌ Detalhes do erro:', error.stack);
  });

// Função para registrar ponto
async function registrarPonto(nome, numero, tipo, status) {
  try {
    // Verificar se o colaborador existe
    const colaborador = await verificarColaborador(numero);
    if (!colaborador) {
      console.error('❌ Colaborador não encontrado:', numero);
      return null;
    }

    // Usar o número do colaborador exatamente como está no banco
    const numeroDoColaborador = colaborador.numero;

    const agora = new Date();
    const horario = agora.toISOString().slice(0, 19).replace('T', ' ');

    // Inserir o registro no banco de dados
    const query = 'INSERT INTO pontos (nome, numero, tipo, horario, status) VALUES (?, ?, ?, ?, ?)';
    const valores = [nome, numeroDoColaborador, tipo, horario, status];

    return new Promise((resolve, reject) => {
      db.query(query, valores, (err, result) => {
        if (err) {
          console.error('❌ Erro ao registrar ponto no banco de dados:', err);
          return reject(err);
        }

        console.log('✅ Ponto registrado com sucesso:', {
          id: result.insertId,
          nome,
          numero: numeroDoColaborador,
          tipo,
          horario,
          status
        });

        // Verificar se o registro foi efetivamente salvo
        db.query('SELECT id, status FROM pontos WHERE id = ?', [result.insertId], (err, results) => {
          if (err) {
            console.error('❌ Erro ao verificar registro salvo:', err);
            return reject(err);
          }

          if (results.length === 0) {
            console.error('❌ Registro não encontrado após inserção:', {
              id: result.insertId,
              valores
            });
            return reject(new Error('Registro não foi salvo no banco de dados'));
          }

          const pontoSalvo = results[0];
          console.log('✅ Registro confirmado no banco:', {
            id: pontoSalvo.id,
            status: pontoSalvo.status
          });
          resolve(result);
        });
      });
    });
  } catch (error) {
    console.error('❌ Erro ao processar registro de ponto:', error);
    throw error;
  }
}

function registrarUsuario(nome, numero, empresa) {
  // Normalizar o número antes de registrar
  const numeroNormalizado = normalizarNumero(numero);
  
  const agora = new Date();
  const horario = agora.toISOString().slice(0, 19).replace('T', ' '); // Formato DATETIME do MySQL

  const query = 'INSERT INTO pontos (nome, numero, tipo, horario) VALUES (?, ?, ?, ?)';
  db.query(query, [nome, numeroNormalizado, `Primeiro Contato (${empresa})`, horario], (err, result) => {
    if (err) {
      console.error('❌ Erro ao registrar usuário no banco de dados:', err);
      return;
    }
    console.log(`✅ Usuário registrado no banco de dados: ${nome} (${numero}) na empresa ${empresa}`);
  });
}

async function verificarUsuario(numero) {
  // Normalizar o número antes de verificar
  const numeroNormalizado = normalizarNumero(numero);
  
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM pontos WHERE numero = ? LIMIT 1';
    db.query(query, [numeroNormalizado], (err, results) => {
      if (err) {
        console.error('❌ Erro ao verificar usuário no banco de dados:', err);
        return reject(err);
      }
      console.log('🔍 Verificando usuário:', {
        numeroOriginal: numero,
        numeroNormalizado,
        resultado: results
      });
      resolve(results.length > 0 ? results[0] : null);
    });
  });
}

// Função para normalizar número de telefone
function normalizarNumero(numero, forceNormalization = true) {
  try {
    if (!numero) {
      throw new Error('Número não fornecido');
    }

    // Se não for para forçar a normalização e o número já estiver no formato correto, retornar como está
    if (!forceNormalization && !numero.startsWith('@c.us:')) {
      return numero;
    }

    // Remover prefixos comuns
    if (numero.startsWith('@c.us:')) {
      numero = numero.substring(6); // Remove '@c.us:'
    }

    // Remover caracteres não numéricos
    const numeroLimpo = numero.replace(/[^0-9]/g, '');

    // Verificar se o número é válido
    if (numeroLimpo.length < 11) {
      throw new Error('Número muito curto');
    }
    if (numeroLimpo.length > 13) {
      throw new Error('Número muito longo');
    }

    // Adicionar prefixo 55 se necessário
    const numeroFinal = numeroLimpo.startsWith('55') ? numeroLimpo : '55' + numeroLimpo;

    console.log('✅ Número normalizado:', {
      original: numero,
      limpo: numeroLimpo,
      final: numeroFinal
    });

    return numeroFinal;
  } catch (error) {
    console.error('❌ Erro ao normalizar número:', {
      numero,
      error: error.message
    });
    return null;
  }
}

async function verificarColaborador(numero) {
  try {
    // Verificar conexão com o banco
    await new Promise((resolve, reject) => {
      db.ping((err) => {
        if (err) {
          console.error('❌ Conexão com o banco perdida:', err);
          reconectarBanco()
            .then(novaConexao => {
              db = novaConexao;
              resolve();
            })
            .catch(err => reject(err));
        } else {
          resolve();
        }
      });
    });

    // Se o número já estiver no formato correto, não normalizar
    const numeroNormalizado = normalizarNumero(numero, numero.startsWith('@c.us:'));
    if (!numeroNormalizado) {
      console.error('❌ Número inválido:', numero);
      return null;
    }

    return new Promise((resolve, reject) => {
      // Primeiro tentar com o número normalizado
      db.query('SELECT * FROM colaboradores WHERE numero = ? LIMIT 1', [numeroNormalizado], (err, results) => {
        if (err) {
          console.error('❌ Erro ao verificar colaborador no banco de dados:', err);
          return reject(err);
        }

        // Se não encontrou, tentar com o número completo @c.us:
        if (results.length === 0) {
          db.query('SELECT * FROM colaboradores WHERE numero = ? LIMIT 1', [numero], (err, results2) => {
            if (err) {
              console.error('❌ Erro ao verificar colaborador no banco de dados (tentativa 2):', err);
              return reject(err);
            }
            console.log('🔍 Verificando colaborador:', {
              numeroOriginal: numero,
              numeroNormalizado,
              resultado: results2
            });
            resolve(results2.length > 0 ? results2[0] : null);
          });
        } else {
          console.log('🔍 Colaborador encontrado:', {
            numeroOriginal: numero,
            numeroNormalizado,
            resultado: results[0]
          });
          resolve(results[0]);
        }
      });
    });
  } catch (error) {
    console.error('❌ Erro ao verificar colaborador:', error);
    return null;
  }
}

async function verificarUltimoRegistro(numero) {
  try {
    // Se o número já estiver no formato correto, não normalizar
    const numeroNormalizado = normalizarNumero(numero, numero.startsWith('@c.us:'));
    if (!numeroNormalizado) {
      console.error('❌ Número inválido:', numero);
      return null;
    }

    const query = 'SELECT nome, numero, tipo, horario, status FROM pontos WHERE numero = ? ORDER BY horario DESC LIMIT 1';
    const resultados = await new Promise((resolve, reject) => {
      db.query(query, [numeroNormalizado], (err, results) => {
        if (err) {
          console.error('❌ Erro ao verificar último registro:', err);
          return reject(err);
        }
        resolve(results);
      });
    });

    const ultimo = resultados.length > 0 ? resultados[0] : null;
    if (ultimo) {
      console.log('🔍 Último registro:', {
        id: ultimo.id,
        nome: ultimo.nome,
        tipo: ultimo.tipo,
        horario: ultimo.horario,
        status: ultimo.status,
        numero: ultimo.numero
      });
    }
    
    return ultimo;
  } catch (error) {
    console.error('❌ Erro ao verificar último registro:', error);
    return null;
  }
}

async function enviarMenu(client, numero, nome) {
  await client.sendButtons(
    numero,
    `Faça o registro da sua atividade\n\nOlá ${nome}, tudo bem? Escolha uma opção no menu clicando no botão abaixo.`,
    [
      { buttonText: { displayText: 'Intervalo' } },
      { buttonText: { displayText: 'Saída' } },
    ],
    'Registrar'
  );
}

function start(client) {
  const usuariosPendentes = {}; // Objeto para armazenar usuários aguardando o nome

  client.onMessage(async (message) => {
    // Ignorar mensagens do status@broadcast
    const deveProcessar = await ignorarStatusBroadcast(client, message);
    if (!deveProcessar) {
      return;
    }

    const numero = message.from;
    const texto = message.body.trim().toLowerCase();

    try {
      // Verificar se o número está cadastrado como colaborador
      const colaborador = await verificarColaborador(numero);

      if (!colaborador) {
        await client.sendText(
          numero,
          `❌ Você não está autorizado a usar este sistema. Entre em contato com o administrador.`
        );
        return;
      }

      // Verificar o último registro do colaborador
      const ultimoRegistro = await verificarUltimoRegistro(numero);

      // Se não houver registro ou o último foi saída, só pode registrar entrada
      if (!ultimoRegistro || ultimoRegistro.status === TIPOS_STATUS.SAIDA) {
        console.log('🔍 Status inicial ou SAIDA detectado');
        if (texto.includes('entrada')) {
          await registrarPonto(colaborador.nome, numero, 'Ponto Registrado', TIPOS_STATUS.ENTRADA);
          await client.sendText(
            numero,
            `✅ Ponto de entrada registrado com sucesso!`
          );
          return;
        } else {
          await client.sendText(
            numero,
            `❌ Você precisa registrar uma entrada antes de registrar intervalo ou saída.`
          );
          return;
        }
      }

      // Se o último registro foi entrada, pode iniciar intervalo
      if (ultimoRegistro && ultimoRegistro.status === TIPOS_STATUS.ENTRADA) {
        console.log('🔍 Status ENTRADA detectado');
        if (texto.includes(PALAVRAS_CHAVE.INICIO_INTERVALO)) {
          await registrarPonto(colaborador.nome, numero, 'Ponto Registrado', TIPOS_STATUS.INICIO_INTERVALO);
          await client.sendText(
            numero,
            `✅ Intervalo iniciado com sucesso! Use "${PALAVRAS_CHAVE.FIM_INTERVALO}" para finalizar o intervalo.`
          );
          return;
        }
        
        // Se não for intervalo, mostrar menu
        if (texto === 'oi' || texto === 'menu') {
          await enviarMenu(client, numero, colaborador.nome);
          return;
        }

        await client.sendText(
          numero,
          `❌ Aguardando início de intervalo. Use "${PALAVRAS_CHAVE.INICIO_INTERVALO}" para iniciar.`
        );
        return;
      }

      // Após início do intervalo, só pode finalizar
      if (ultimoRegistro && ultimoRegistro.status === TIPOS_STATUS.INICIO_INTERVALO) {
        console.log('✅ Status INICIO_INTERVALO detectado');
        if (texto.includes(PALAVRAS_CHAVE.FIM_INTERVALO)) {
          registrarPonto(colaborador.nome, numero, 'Ponto Registrado', TIPOS_STATUS.FIM_INTERVALO);
          await client.sendText(
            numero,
            `✅ Intervalo finalizado com sucesso! Agora você pode registrar a saída.`
          );
          return;
        } else if (texto.includes(PALAVRAS_CHAVE.SAIDA)) {
          await client.sendText(
            numero,
            `❌ Você não pode registrar saída durante o intervalo. Use "${PALAVRAS_CHAVE.FIM_INTERVALO}" para finalizar o intervalo primeiro.`
          );
          return;
        } else {
          await client.sendText(
            numero,
            `❌ Você precisa finalizar o intervalo antes de registrar a saída. Use "${PALAVRAS_CHAVE.FIM_INTERVALO}" para finalizar.`
          );
          return;
        }
      }

      // Após finalizar intervalo, só pode sair
      if (ultimoRegistro.status === TIPOS_STATUS.FIM_INTERVALO) {
        if (texto.includes(PALAVRAS_CHAVE.SAIDA)) {
          registrarPonto(colaborador.nome, numero, 'Ponto Registrado', TIPOS_STATUS.SAIDA);
          await client.sendText(
            numero,
            `✅ Saída registrada com sucesso! Expediente finalizado.`
          );
          return;
        } else {
          await client.sendText(
            numero,
            `❌ Você só pode registrar a saída neste momento.`
          );
          return;
        }
      }

      if (message.type === 'location') {
        const empresaKey = colaborador.empresa.toLowerCase().replace(/\s+/g, '');
        console.log('🔍 Empresa do colaborador:', colaborador.empresa);
        console.log('🔍 Chave derivada da empresa:', empresaKey); // Log para depuração
        const empresa = EMPRESAS[empresaKey];

        if (!empresa) {
          await client.sendText(
            numero,
            `❌ A empresa associada ao seu cadastro não foi encontrada. Entre em contato com o administrador.`
          );
          return;
        }

        const distancia = calcularDistancia(
          message.lat,
          message.lng,
          empresa.latitude,
          empresa.longitude
        );

        if (distancia > RAIO_PERMITIDO) {
          await client.sendText(
            numero,
            `❌ Você está fora do raio permitido para registrar o ponto na ${colaborador.empresa}.`
          );
          return;
        }

        // Registrar o ponto com base no contexto
        let status = 'entrada';
        if (ultimoRegistro && ultimoRegistro.status === 'entrada') {
          status = texto.includes('intervalo') ? 'intervalo' : 'saida';
        } else if (ultimoRegistro && ultimoRegistro.status === 'intervalo') {
          status = 'saida';
        }

        registrarPonto(colaborador.nome, numero, 'Ponto Registrado', status);
        await client.sendText(
          numero,
          `✅ Ponto de ${status} registrado com sucesso na ${colaborador.empresa}!`
        );
      }
    } catch (error) {
      console.error('❌ Erro no fluxo do WhatsApp:', error);
      await client.sendText(
        numero,
        `❌ Ocorreu um erro no sistema. Por favor, tente novamente mais tarde.`
      );
    }
  });
}

function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon1 - lon2) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distância em km
}
