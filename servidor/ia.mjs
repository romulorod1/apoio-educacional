/* Núcleo do endpoint de IA do aplicativo (fase 1 do projeto "IA no app").
 *
 * O desenho e o contexto estão no Drive, em
 * agents-comms-coordination\design\planejamento-com-ia\ (CONTEXTO-VIVO.md).
 *
 * Este arquivo é PURO: não importa nada, não lê ambiente nem rede por conta
 * própria. Quem chama (functions/api/ia.js, no Cloudflare Pages) entrega as
 * dependências: verificar o login, ler o corpo, chamar o modelo, classificar o
 * erro da API, registrar e o relógio. Assim a prova (_teste/testa_ia_endpoint.js)
 * exercita cada regra no Node, com dependências falsas, sem chave e sem rede.
 *
 * O que ele garante:
 * - só atende POST, com login válido do Firebase, de um uid da lista IA_UIDS
 *   (segredo do projeto Pages; nunca no repositório);
 * - sem a chave no ambiente (prévias de ramo), responde "indisponível";
 * - o corpo só é lido DEPOIS do login e da lista; tamanho declarado acima do
 *   limite é recusado antes até de conferir o login;
 * - TUDO que custa dinheiro é decidido aqui, nunca pelo aparelho: o modelo, os
 *   betas, o teto de saída e de esforço por rota, e os tipos de conteúdo e de
 *   ferramenta aceitos (só ferramentas do cliente; nada de busca na web,
 *   execução de código, documento por URL, imagem por URL ou cache_control
 *   vindo do aparelho);
 * - limita o tamanho do pedido, o texto, as imagens, as mensagens e a
 *   frequência por uid;
 * - o registro guarda só metadados (rota, uso em tokens, tempo, código): nunca
 *   o texto, as imagens ou o e-mail;
 * - o erro da API vira um código do app, sem repassar a mensagem crua.
 */

export const MODELO = 'claude-sonnet-5-5';

/* Fallback no servidor para recusa de segurança (padrão da skill claude-api
 * para o Sonnet 5.5). Para este uso quase nunca dispara. */
export const BETAS = ['server-side-fallback-2026-07-01'];

export const LIMITES = {
  bytes: 8 * 1024 * 1024,     // corpo do pedido (as imagens em base64 moram aqui)
  texto: 300000,              // caracteres de texto somados (sistema, mensagens, ferramentas): ~100 mil tokens
  imagens: 10,                // blocos de imagem somados em todas as mensagens
  mensagens: 60,              // turnos da conversa
  maxTokens: 16000,           // teto de saída por chamada
  porHora: 60,                // chamadas por uid por hora (por instância)
  ferramentas: 20
};

/* Cada rota diz o esforço padrão, os esforços permitidos, o teto de saída e se
 * pode pedir saída estruturada e ferramentas. "teste" é a fumaça: curta e
 * barata, esforço fixo. */
export const ROTAS = {
  teste:        { esforco: 'low',    esforcos: ['low'],                   maxTokens: 300,   formato: false, ferramentas: false },
  planejamento: { esforco: 'medium', esforcos: ['low', 'medium', 'high'], maxTokens: 16000, formato: true,  ferramentas: false },
  assistente:   { esforco: 'low',    esforcos: ['low', 'medium'],         maxTokens: 4000,  formato: false, ferramentas: true }
};

const TIPOS_DE_IMAGEM = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
/* O que o assistente devolve e o aparelho reenvia sem mudar nos turnos de
 * ajuste (os blocos de thinking têm de voltar intactos). */
const BLOCOS_DO_ASSISTENTE = ['text', 'thinking', 'redacted_thinking', 'tool_use', 'fallback'];

/* A configuração web do Firebase não é segredo: é a mesma do nuvem.js. */
export const FIREBASE_API_KEY = 'AIzaSyB1p6CvU0gw-MUjKjJhEVZ4wEioje73DOI';
const URL_LOOKUP = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=';

function resposta(status, corpo) { return { status, corpo }; }
function erro(status, codigo) { return resposta(status, { ok: false, codigo }); }

function bytesDe(texto) {
  return new TextEncoder().encode(texto).length;
}

export function uidsPermitidos(env) {
  return String((env && env.IA_UIDS) || '').split(',').map(s => s.trim()).filter(Boolean);
}

/* O "exp" do idToken (segundos), lido do payload SEM confiar nele para
 * autenticar: serve só para o cache nunca durar mais que o próprio token. */
function expiraEmMs(idToken) {
  try {
    const parte = String(idToken).split('.')[1];
    if (!parte) return null;
    const b64 = parte.replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(b64 + '==='.slice((b64.length + 3) % 4)));
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch (e) { return null; }
}

/* Confere o idToken do Firebase pelo próprio Identity Toolkit. A resposta
 * válida traz users[0].localId; token vencido, adulterado ou de outro projeto
 * (a key amarra o projeto) volta com erro. Só uid PERMITIDO entra no cache, por
 * até 5 minutos e nunca além do exp do token. Devolve o uid ou null. */
export async function verificarTokenFirebase(idToken, fetchFn, cache, agora, permitidos) {
  const guardado = cache && cache.get(idToken);
  if (guardado && guardado.ate > agora) return guardado.uid;
  if (guardado) cache.delete(idToken);
  let r;
  try {
    r = await fetchFn(URL_LOOKUP + FIREBASE_API_KEY, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken })
    });
  } catch (e) {
    return null;
  }
  if (!r || !r.ok) return null;
  let dados;
  try { dados = await r.json(); } catch (e) { return null; }
  const u = dados && Array.isArray(dados.users) && dados.users[0];
  const uid = u && typeof u.localId === 'string' && u.localId ? u.localId : null;
  if (!uid || u.disabled) return null;
  if (cache && Array.isArray(permitidos) && permitidos.indexOf(uid) >= 0) {
    const exp = expiraEmMs(idToken);
    const ate = Math.min(agora + 5 * 60 * 1000, exp === null ? Infinity : exp);
    if (ate > agora) {
      cache.set(idToken, { uid, ate });
      if (cache.size > 50) cache.delete(cache.keys().next().value);
    }
  }
  return uid;
}

/* Valida o conteúdo de UMA mensagem e soma texto e imagens em "conta".
 * Devolve null se está bom, ou o código do problema. Profundidade fixa: o
 * único aninhamento aceito é o content de um tool_result. */
function validarConteudo(m, conta) {
  if (typeof m.content === 'string') { conta.texto += m.content.length; return null; }
  if (!Array.isArray(m.content) || m.content.length === 0) return 'pedido_invalido';
  for (const b of m.content) {
    if (!b || typeof b !== 'object' || Array.isArray(b)) return 'pedido_invalido';
    if (Object.prototype.hasOwnProperty.call(b, 'cache_control')) return 'nao_permitido';
    if (m.role === 'assistant') {
      if (BLOCOS_DO_ASSISTENTE.indexOf(b.type) < 0) return 'nao_permitido';
      /* O bloco INTEIRO conta no teto de texto (o thinking com a assinatura,
       * o input do tool_use), e não só o campo text: senão um turno do
       * assistente reenviado pelo aparelho carregaria texto sem limite até o
       * teto de 8 MB do corpo. */
      conta.texto += JSON.stringify(b).length;
      continue;
    }
    if (b.type === 'text') {
      if (typeof b.text !== 'string') return 'pedido_invalido';
      conta.texto += b.text.length;
    } else if (b.type === 'image') {
      const c = validarImagem(b, conta);
      if (c) return c;
    } else if (b.type === 'tool_result') {
      if (typeof b.tool_use_id !== 'string') return 'pedido_invalido';
      if (typeof b.content === 'string') conta.texto += b.content.length;
      else if (Array.isArray(b.content)) {
        for (const d of b.content) {
          if (!d || typeof d !== 'object') return 'pedido_invalido';
          if (Object.prototype.hasOwnProperty.call(d, 'cache_control')) return 'nao_permitido';
          if (d.type === 'text' && typeof d.text === 'string') conta.texto += d.text.length;
          else if (d.type === 'image') { const c = validarImagem(d, conta); if (c) return c; }
          else return 'nao_permitido';
        }
      } else if (b.content !== undefined) return 'pedido_invalido';
    } else {
      return 'nao_permitido'; // documento, busca, código, URL: nada disso vem do aparelho
    }
  }
  return null;
}

function validarImagem(b, conta) {
  const s = b.source;
  if (!s || s.type !== 'base64' || TIPOS_DE_IMAGEM.indexOf(s.media_type) < 0 || typeof s.data !== 'string') return 'nao_permitido';
  conta.imagens++;
  return null;
}

/* Só ferramentas do CLIENTE (o app executa, a API não cobra nada por elas).
 * Copia só os campos conhecidos: nada de "type" de ferramenta de servidor. */
function limparFerramentas(lista, conta) {
  const saida = [];
  for (const t of lista) {
    if (!t || typeof t !== 'object' || Array.isArray(t)) return { codigo: 'pedido_invalido' };
    if (t.type !== undefined && t.type !== 'custom') return { codigo: 'nao_permitido' };
    if (typeof t.name !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(t.name)) return { codigo: 'pedido_invalido' };
    if (!t.input_schema || typeof t.input_schema !== 'object') return { codigo: 'pedido_invalido' };
    const limpa = { name: t.name, input_schema: t.input_schema };
    if (typeof t.description === 'string') limpa.description = t.description;
    if (t.strict === true) limpa.strict = true;
    conta.texto += JSON.stringify(limpa).length;
    saida.push(limpa);
  }
  return { ferramentas: saida };
}

/* Valida o corpo e devolve { params } ou { codigo }. O aparelho manda só o
 * conteúdo; modelo, betas, teto, esforço permitido e tipos aceitos são daqui. */
export function montarParametros(corpo) {
  if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) return { codigo: 'pedido_invalido' };
  if (typeof corpo.rota !== 'string' || !Object.prototype.hasOwnProperty.call(ROTAS, corpo.rota)) return { codigo: 'rota_desconhecida' };
  const rota = ROTAS[corpo.rota];
  const conta = { texto: 0, imagens: 0 };

  const msgs = corpo.messages;
  if (!Array.isArray(msgs) || msgs.length === 0) return { codigo: 'pedido_invalido' };
  if (msgs.length > LIMITES.mensagens) return { codigo: 'conversa_longa' };
  for (const m of msgs) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) return { codigo: 'pedido_invalido' };
    const c = validarConteudo(m, conta);
    if (c) return { codigo: c };
  }
  if (msgs[0].role !== 'user') return { codigo: 'pedido_invalido' };

  const params = {
    model: MODELO,
    max_tokens: rota.maxTokens,
    messages: msgs.map(m => ({ role: m.role, content: m.content })),
    output_config: { effort: rota.esforco },
    betas: BETAS.slice(),
    fallbacks: 'default'
  };

  if (corpo.max_tokens !== undefined) {
    const mt = corpo.max_tokens;
    if (!Number.isInteger(mt) || mt < 1) return { codigo: 'pedido_invalido' };
    params.max_tokens = Math.min(mt, rota.maxTokens, LIMITES.maxTokens);
  }
  if (corpo.esforco !== undefined) {
    if (rota.esforcos.indexOf(corpo.esforco) < 0) return { codigo: 'nao_permitido' };
    params.output_config.effort = corpo.esforco;
  }
  if (corpo.system !== undefined) {
    if (typeof corpo.system !== 'string') return { codigo: 'pedido_invalido' };
    conta.texto += corpo.system.length;
    params.system = corpo.system;
  }
  if (corpo.formato !== undefined) {
    if (!rota.formato) return { codigo: 'nao_permitido_na_rota' };
    const f = corpo.formato;
    if (!f || typeof f !== 'object' || f.type !== 'json_schema' || !f.schema || typeof f.schema !== 'object') return { codigo: 'pedido_invalido' };
    params.output_config.format = { type: 'json_schema', schema: f.schema };
    conta.texto += JSON.stringify(f.schema).length;
  }
  if (corpo.tools !== undefined) {
    if (!rota.ferramentas) return { codigo: 'nao_permitido_na_rota' };
    if (!Array.isArray(corpo.tools) || corpo.tools.length > LIMITES.ferramentas) return { codigo: 'pedido_invalido' };
    const f = limparFerramentas(corpo.tools, conta);
    if (f.codigo) return { codigo: f.codigo };
    params.tools = f.ferramentas;
  }
  if (conta.imagens > LIMITES.imagens) return { codigo: 'imagens_demais' };
  if (conta.texto > LIMITES.texto) return { codigo: 'texto_demais' };
  // Cache de prompt automático: o prefixo estável (sistema e ferramentas) é
  // reaproveitado entre os turnos de ajuste. Na fumaça não vale a pena.
  if (corpo.rota !== 'teste') params.cache_control = { type: 'ephemeral' };
  return { params };
}

/* Janela de uma hora por uid, em memória da instância. Não é um limite global
 * (o Cloudflare pode ter várias instâncias); o teto de verdade são os limites
 * de gasto do Console (organização em US$ 20 por mês). Isto só freia um laço
 * do aparelho. */
export function dentroDaTaxa(memoria, uid, agora) {
  const hora = 60 * 60 * 1000;
  const lista = (memoria.get(uid) || []).filter(t => t > agora - hora);
  if (lista.length >= LIMITES.porHora) { memoria.set(uid, lista); return false; }
  lista.push(agora);
  memoria.set(uid, lista);
  return true;
}

function usoDe(r) {
  const u = (r && r.usage) || {};
  return {
    input_tokens: u.input_tokens || 0,
    output_tokens: u.output_tokens || 0,
    cache_read_input_tokens: u.cache_read_input_tokens || 0,
    cache_creation_input_tokens: u.cache_creation_input_tokens || 0
  };
}

/* O atendimento inteiro.
 * pedido: { metodo, autorizacao, tamanhoDeclarado (Content-Length ou null),
 *           lerCorpo() -> Promise<string> }   (ou corpoTexto, nas provas)
 * dep: { env, verificarToken(t, permitidos) -> uid|null, chamarModelo(params),
 *        classificar(erro) -> codigo, registrar(obj), agora() -> ms, taxa: Map }
 * Nunca lança: qualquer exceção vira 500 "interno", registrado. */
export async function atender(pedido, dep) {
  const inicio = dep.agora();
  const reg = { quando: new Date(inicio).toISOString(), rota: null, status: 0, codigo: null };
  const fim = r => {
    reg.status = r.status;
    reg.codigo = r.corpo && r.corpo.codigo || null;
    reg.ms = dep.agora() - inicio;
    try { dep.registrar(reg); } catch (e) { /* registro nunca derruba o pedido */ }
    return r;
  };
  try {
    return fim(await atenderSemCapa(pedido, dep, reg, inicio));
  } catch (e) {
    return fim(erro(500, 'interno'));
  }
}

async function atenderSemCapa(pedido, dep, reg, inicio) {
  if (pedido.metodo !== 'POST') return erro(405, 'metodo');
  if (!dep.env || !dep.env.ANTHROPIC_API_KEY) return erro(503, 'indisponivel');

  const m = /^Bearer\s+(\S+)$/.exec(pedido.autorizacao || '');
  if (!m) return erro(401, 'sem_login');
  const declarado = Number(pedido.tamanhoDeclarado);
  if (pedido.tamanhoDeclarado != null && Number.isFinite(declarado) && declarado > LIMITES.bytes) return erro(413, 'pedido_grande');

  const permitidos = uidsPermitidos(dep.env);
  const uid = await dep.verificarToken(m[1], permitidos);
  if (!uid) return erro(401, 'login_invalido');
  if (permitidos.indexOf(uid) < 0) return erro(403, 'sem_permissao');
  reg.uid = uid.slice(0, 6);

  const texto = typeof pedido.lerCorpo === 'function' ? await pedido.lerCorpo() : (pedido.corpoTexto || '');
  if (bytesDe(texto) > LIMITES.bytes) return erro(413, 'pedido_grande');
  let corpo;
  try { corpo = JSON.parse(texto); } catch (e) { return erro(400, 'pedido_invalido'); }
  if (corpo && typeof corpo.rota === 'string') reg.rota = corpo.rota.slice(0, 20);

  const montado = montarParametros(corpo);
  if (montado.codigo) return erro(400, montado.codigo);
  if (!dentroDaTaxa(dep.taxa, uid, inicio)) return erro(429, 'muitos_pedidos');

  let r;
  try {
    r = await dep.chamarModelo(montado.params);
  } catch (e) {
    const codigo = dep.classificar(e);
    const status = codigo === 'rede' ? 504 : codigo === 'pedido_recusado_pela_api' ? 502 : 503;
    return erro(status, codigo);
  }
  if (!r || typeof r !== 'object') return erro(502, 'resposta_vazia');
  reg.modelo = r.model || null;
  reg.uso = usoDe(r);
  reg.stop = r.stop_reason || null;
  if (r.stop_reason === 'refusal') {
    const cat = r.stop_details && r.stop_details.category || null;
    return resposta(200, { ok: false, codigo: 'recusa', categoria: cat });
  }
  return resposta(200, {
    ok: true,
    resposta: {
      id: r.id, model: r.model, stop_reason: r.stop_reason,
      content: r.content, usage: reg.uso
    }
  });
}

/* Classifica o erro do SDK sem repassar a mensagem ao aparelho. Recebe a classe
 * Anthropic para usar os tipos do próprio SDK (instanceof), como pede a skill.
 * O limite de gasto definido pelo dono volta como 400 invalid_request_error e
 * só se distingue pela mensagem documentada ("You have reached your specified
 * ... usage limits"); o teto da faixa volta como 429 com
 * error.details.error_code = enforced_spend_limit_reached. */
export function classificarErroDaApi(e, Anthropic) {
  const corpo = e && e.error && e.error.error ? e.error.error : (e && e.error) || {};
  const msg = String(corpo.message || '');
  const det = corpo.details || {};
  if (Anthropic && e instanceof Anthropic.APIConnectionError) return 'rede';
  if (Anthropic && e instanceof Anthropic.RateLimitError) {
    return det.error_code === 'enforced_spend_limit_reached' ? 'limite_mensal' : 'ocupado';
  }
  if (Anthropic && e instanceof Anthropic.BadRequestError) {
    return /^You have reached your specified/.test(msg) ? 'limite_mensal' : 'pedido_recusado_pela_api';
  }
  if (Anthropic && (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError)) return 'indisponivel';
  if (Anthropic && e instanceof Anthropic.APIError) return 'ocupado';
  return 'indisponivel';
}
