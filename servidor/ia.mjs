/* Núcleo do endpoint de IA do aplicativo (fase 1 do projeto "IA no app").
 *
 * O desenho e o contexto estão no Drive, em
 * agents-comms-coordination\design\planejamento-com-ia\ (CONTEXTO-VIVO.md).
 *
 * Este arquivo é PURO: não importa nada, não lê ambiente nem rede por conta
 * própria. Quem chama (functions/api/ia.js, no Cloudflare Pages) entrega as
 * dependências: verificar o login, chamar o modelo, classificar o erro da API,
 * registrar e o relógio. Assim a prova (_teste/testa_ia_endpoint.js) exercita
 * cada regra no Node, com dependências falsas, sem chave e sem rede.
 *
 * O que ele garante:
 * - só atende POST, com login válido do Firebase, de um uid da lista IA_UIDS
 *   (segredo do projeto Pages; nunca no repositório);
 * - sem a chave no ambiente (prévias de ramo), responde "indisponível";
 * - limita o tamanho do pedido, a quantidade de imagens e de mensagens, o
 *   max_tokens e a frequência por uid;
 * - o modelo, o esforço permitido e o teto de tokens são decididos AQUI, nunca
 *   pelo aparelho;
 * - o registro guarda só metadados (rota, uso em tokens, tempo, código): nunca
 *   o texto, as imagens ou o e-mail;
 * - o erro da API vira um código do app, sem repassar a mensagem crua.
 */

export const MODELO = 'claude-sonnet-5-5';

/* Fallback no servidor para recusa de segurança (padrão da skill claude-api
 * para o Sonnet 5.5). Para este uso quase nunca dispara. */
export const BETAS = ['server-side-fallback-2026-07-01'];

export const LIMITES = {
  bytes: 8 * 1024 * 1024,     // corpo do pedido
  imagens: 10,                // blocos de imagem somados em todas as mensagens
  mensagens: 60,              // turnos da conversa
  maxTokens: 16000,           // teto de saída por chamada
  porHora: 60,                // chamadas por uid por hora (por instância)
  sistemaCaracteres: 200000,
  ferramentas: 20
};

/* Cada rota diz o esforço padrão, o teto de saída e se pode pedir saída
 * estruturada e ferramentas. "teste" é a fumaça: curta e barata. */
export const ROTAS = {
  teste:        { esforco: 'low',    maxTokens: 300,   formato: false, ferramentas: false },
  planejamento: { esforco: 'medium', maxTokens: 16000, formato: true,  ferramentas: false },
  assistente:   { esforco: 'low',    maxTokens: 4000,  formato: false, ferramentas: true }
};
const ESFORCOS = ['low', 'medium', 'high'];

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

/* Confere o idToken do Firebase pelo próprio Identity Toolkit. A resposta
 * válida traz users[0].localId; token vencido, adulterado ou de outro projeto
 * volta com erro. O resultado fica guardado por 5 minutos (nunca além da
 * validade do token, que é de 1 hora). Devolve o uid ou null. */
export async function verificarTokenFirebase(idToken, fetchFn, cache, agora) {
  const guardado = cache && cache.get(idToken);
  if (guardado && guardado.ate > agora) return guardado.uid;
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
  if (cache) {
    cache.set(idToken, { uid, ate: agora + 5 * 60 * 1000 });
    if (cache.size > 200) cache.delete(cache.keys().next().value);
  }
  return uid;
}

/* Quantos blocos de imagem a conversa leva, olhando também dentro de
 * tool_result (o assistente pode devolver imagem como resultado). */
function contarImagens(mensagens) {
  let n = 0;
  const olha = bloco => {
    if (!bloco || typeof bloco !== 'object') return;
    if (bloco.type === 'image') n++;
    if (Array.isArray(bloco.content)) bloco.content.forEach(olha);
  };
  mensagens.forEach(m => { if (Array.isArray(m.content)) m.content.forEach(olha); });
  return n;
}

/* Valida o corpo e devolve { params } ou { codigo }. O aparelho manda só o
 * conteúdo; modelo, betas, teto e esforço permitidos são daqui. */
export function montarParametros(corpo) {
  if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) return { codigo: 'pedido_invalido' };
  const rota = ROTAS[corpo.rota];
  if (!rota || !Object.prototype.hasOwnProperty.call(ROTAS, corpo.rota)) return { codigo: 'rota_desconhecida' };

  const msgs = corpo.messages;
  if (!Array.isArray(msgs) || msgs.length === 0) return { codigo: 'pedido_invalido' };
  if (msgs.length > LIMITES.mensagens) return { codigo: 'conversa_longa' };
  for (const m of msgs) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) return { codigo: 'pedido_invalido' };
    if (typeof m.content !== 'string' && !Array.isArray(m.content)) return { codigo: 'pedido_invalido' };
  }
  if (msgs[0].role !== 'user') return { codigo: 'pedido_invalido' };
  if (contarImagens(msgs) > LIMITES.imagens) return { codigo: 'imagens_demais' };

  const params = {
    model: MODELO,
    max_tokens: rota.maxTokens,
    messages: msgs,
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
    if (ESFORCOS.indexOf(corpo.esforco) < 0) return { codigo: 'pedido_invalido' };
    params.output_config.effort = corpo.esforco;
  }
  if (corpo.system !== undefined) {
    if (typeof corpo.system !== 'string' && !Array.isArray(corpo.system)) return { codigo: 'pedido_invalido' };
    const tamanho = typeof corpo.system === 'string' ? corpo.system.length : JSON.stringify(corpo.system).length;
    if (tamanho > LIMITES.sistemaCaracteres) return { codigo: 'pedido_grande' };
    params.system = corpo.system;
  }
  if (corpo.formato !== undefined) {
    if (!rota.formato) return { codigo: 'nao_permitido_na_rota' };
    if (!corpo.formato || typeof corpo.formato !== 'object' || corpo.formato.type !== 'json_schema') return { codigo: 'pedido_invalido' };
    params.output_config.format = corpo.formato;
  }
  if (corpo.tools !== undefined) {
    if (!rota.ferramentas) return { codigo: 'nao_permitido_na_rota' };
    if (!Array.isArray(corpo.tools) || corpo.tools.length > LIMITES.ferramentas) return { codigo: 'pedido_invalido' };
    params.tools = corpo.tools;
  }
  // Cache de prompt automático: o prefixo estável (sistema e ferramentas) é
  // reaproveitado entre os turnos de ajuste. Na fumaça não vale a pena.
  if (corpo.rota !== 'teste') params.cache_control = { type: 'ephemeral' };
  return { params };
}

/* Janela de uma hora por uid, em memória da instância. Não é um limite global
 * (o Cloudflare pode ter várias instâncias); o teto de verdade são os limites
 * de gasto do Console. Isto só freia um laço do aparelho. */
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

/* O atendimento inteiro. pedido: { metodo, autorizacao, corpoTexto }.
 * dep: { env, verificarToken(t) -> uid|null, chamarModelo(params) -> resposta,
 *        classificar(erro) -> codigo, registrar(obj), agora() -> ms, taxa: Map } */
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

  if (pedido.metodo !== 'POST') return fim(erro(405, 'metodo'));
  if (!dep.env || !dep.env.ANTHROPIC_API_KEY) return fim(erro(503, 'indisponivel'));

  const m = /^Bearer\s+(\S+)$/.exec(pedido.autorizacao || '');
  if (!m) return fim(erro(401, 'sem_login'));
  const uid = await dep.verificarToken(m[1]);
  if (!uid) return fim(erro(401, 'login_invalido'));
  if (uidsPermitidos(dep.env).indexOf(uid) < 0) return fim(erro(403, 'sem_permissao'));
  reg.uid = uid.slice(0, 6);

  const texto = pedido.corpoTexto || '';
  if (bytesDe(texto) > LIMITES.bytes) return fim(erro(413, 'pedido_grande'));
  let corpo;
  try { corpo = JSON.parse(texto); } catch (e) { return fim(erro(400, 'pedido_invalido')); }
  if (corpo && typeof corpo.rota === 'string') reg.rota = corpo.rota.slice(0, 20);

  const montado = montarParametros(corpo);
  if (montado.codigo) return fim(erro(400, montado.codigo));
  if (!dentroDaTaxa(dep.taxa, uid, inicio)) return fim(erro(429, 'muitos_pedidos'));

  let r;
  try {
    r = await dep.chamarModelo(montado.params);
  } catch (e) {
    const codigo = dep.classificar(e);
    const status = codigo === 'rede' ? 504 : codigo === 'pedido_recusado_pela_api' ? 502 : 503;
    return fim(erro(status, codigo));
  }
  reg.modelo = r && r.model || null;
  reg.uso = usoDe(r);
  reg.stop = r && r.stop_reason || null;
  if (r && r.stop_reason === 'refusal') {
    const cat = r.stop_details && r.stop_details.category || null;
    return fim(resposta(200, { ok: false, codigo: 'recusa', categoria: cat }));
  }
  return fim(resposta(200, {
    ok: true,
    resposta: {
      id: r.id, model: r.model, stop_reason: r.stop_reason,
      content: r.content, usage: reg.uso
    }
  }));
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
