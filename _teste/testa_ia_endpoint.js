/* testa_ia_endpoint.js (projeto IA no app, fase 1; sem navegador, sem rede, sem chave)
 *
 * Exercita o núcleo do endpoint de IA (servidor/ia.mjs) com dependências
 * falsas: o login do Firebase, o modelo e o relógio são funções desta prova.
 * Cada regra é provada nos DOIS lados: o pedido certo passa e o errado é
 * barrado pela mesma regra. Uma prova que só olha o lado que barra passaria
 * com um endpoint que barra tudo.
 *
 * O que não dá para provar aqui (o SDK de verdade, o Cloudflare de verdade, a
 * chave) é provado pela chamada de fumaça depois do deploy, com a conta de
 * teste, registrada no CONTEXTO-VIVO do projeto.
 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');

let passes = 0, falhas = 0;
function conf(rotulo, ok, detalhe) {
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK    ' : '  FALHA ') + rotulo + (ok || detalhe === undefined ? '' : '  [' + detalhe + ']'));
}

const UID_OK = 'uidPermitido000000000000000a';
const UID_OUTRO = 'uidObservador0000000000000b';
const TOKEN_OK = 'token-da-conta-permitida';
const TOKEN_OUTRO = 'token-do-observador';
const MARCA = 'MARCA_SECRETA_DO_CONTEUDO_7f3a';

function respostaDoModelo(extra) {
  return Object.assign({
    id: 'msg_falso', model: 'claude-sonnet-5-5', stop_reason: 'end_turn',
    content: [{ type: 'thinking', thinking: '', signature: 'sig' }, { type: 'text', text: 'oi' }],
    usage: { input_tokens: 12, output_tokens: 3, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }
  }, extra || {});
}

function novoAmbiente(opcoes) {
  const o = opcoes || {};
  const log = [];
  const chamadas = [];
  let relogio = 1767225600000; // 01/01/2026, fixo
  const dep = {
    env: o.env !== undefined ? o.env : { ANTHROPIC_API_KEY: 'chave-falsa', IA_UIDS: ' ' + UID_OK + ' , outro ' },
    taxa: new Map(),
    agora: () => relogio,
    registrar: r => log.push(JSON.stringify(r)),
    verificarToken: async t => (t === TOKEN_OK ? UID_OK : t === TOKEN_OUTRO ? UID_OUTRO : null),
    chamarModelo: async p => { chamadas.push(p); if (o.falha) throw o.falha; return respostaDoModelo(o.resposta); },
    classificar: e => (e && e.codigoFalso) || 'indisponivel'
  };
  return { dep, log, chamadas, avancar: ms => { relogio += ms; } };
}

function pedido(corpo, token, metodo) {
  return {
    metodo: metodo || 'POST',
    autorizacao: token === null ? '' : 'Bearer ' + (token || TOKEN_OK),
    corpoTexto: typeof corpo === 'string' ? corpo : JSON.stringify(corpo)
  };
}
const SIMPLES = { rota: 'teste', messages: [{ role: 'user', content: 'diga oi ' + MARCA }] };

(async () => {
  const N = await import(pathToFileURL(path.join(__dirname, '..', 'servidor', 'ia.mjs')).href);

  console.log('\n=== o caminho feliz ===');
  {
    const a = novoAmbiente();
    const r = await N.atender(pedido(SIMPLES), a.dep);
    conf('pedido certo responde 200 com ok', r.status === 200 && r.corpo.ok === true, JSON.stringify(r));
    conf('devolve o content inteiro, com o bloco de thinking (o aparelho reenvia nos ajustes)',
      r.corpo.resposta && r.corpo.resposta.content.length === 2 && r.corpo.resposta.content[0].type === 'thinking');
    const p = a.chamadas[0] || {};
    conf('o modelo é o do servidor (claude-sonnet-5-5)', p.model === 'claude-sonnet-5-5', p.model);
    conf('o fallback de recusa vai ligado (beta e "default")',
      Array.isArray(p.betas) && p.betas[0] === 'server-side-fallback-2026-07-01' && p.fallbacks === 'default');
    conf('rota teste: esforço low e teto de 300 tokens', p.output_config && p.output_config.effort === 'low' && p.max_tokens === 300);
    conf('rota teste: sem cache de prompt', p.cache_control === undefined);
    conf('o uso em tokens volta na resposta', r.corpo.resposta.usage.input_tokens === 12);
  }

  console.log('\n=== o aparelho não escolhe modelo nem passa do teto ===');
  {
    const a = novoAmbiente();
    await N.atender(pedido({ rota: 'planejamento', model: 'claude-opus-5-5', max_tokens: 999999, messages: SIMPLES.messages }), a.dep);
    const p = a.chamadas[0] || {};
    conf('campo model do aparelho é ignorado', p.model === 'claude-sonnet-5-5', p.model);
    conf('max_tokens pedido acima do teto vira o teto da rota (16000)', p.max_tokens === 16000, p.max_tokens);
    conf('rota planejamento: esforço medium e cache de prompt ligado',
      p.output_config.effort === 'medium' && p.cache_control && p.cache_control.type === 'ephemeral');
    const b = novoAmbiente();
    await N.atender(pedido({ rota: 'planejamento', max_tokens: 2000, messages: SIMPLES.messages }), b.dep);
    conf('max_tokens abaixo do teto é respeitado (controle do lado que passa)', (b.chamadas[0] || {}).max_tokens === 2000);
    const c = novoAmbiente();
    const rc = await N.atender(pedido({ rota: 'teste', esforco: 'max', messages: SIMPLES.messages }), c.dep);
    conf('esforço fora da lista (max) é recusado', rc.status === 400 && c.chamadas.length === 0);
    const d = novoAmbiente();
    await N.atender(pedido({ rota: 'teste', esforco: 'high', messages: SIMPLES.messages }), d.dep);
    conf('esforço da lista (high) passa', (d.chamadas[0] || {}).output_config.effort === 'high');
  }

  console.log('\n=== método, chave e login ===');
  {
    const a = novoAmbiente();
    const r = await N.atender(pedido(SIMPLES, TOKEN_OK, 'GET'), a.dep);
    conf('GET responde 405 e não chama o modelo', r.status === 405 && a.chamadas.length === 0);
    const b = novoAmbiente({ env: { IA_UIDS: UID_OK } });
    const rb = await N.atender(pedido(SIMPLES), b.dep);
    conf('sem a chave no ambiente (prévia de ramo): 503 indisponivel', rb.status === 503 && rb.corpo.codigo === 'indisponivel' && b.chamadas.length === 0);
    const c = novoAmbiente();
    const rc = await N.atender(pedido(SIMPLES, null), c.dep);
    conf('sem Authorization: 401 sem_login', rc.status === 401 && rc.corpo.codigo === 'sem_login' && c.chamadas.length === 0);
    const d = novoAmbiente();
    const rd = await N.atender(pedido(SIMPLES, 'token-adulterado'), d.dep);
    conf('token que o Firebase não reconhece: 401 login_invalido', rd.status === 401 && rd.corpo.codigo === 'login_invalido' && d.chamadas.length === 0);
    const e = novoAmbiente();
    const re = await N.atender(pedido(SIMPLES, TOKEN_OUTRO), e.dep);
    conf('login válido fora da lista IA_UIDS (o observador): 403', re.status === 403 && re.corpo.codigo === 'sem_permissao' && e.chamadas.length === 0);
    const f = novoAmbiente({ env: { ANTHROPIC_API_KEY: 'k', IA_UIDS: '' } });
    const rf = await N.atender(pedido(SIMPLES), f.dep);
    conf('IA_UIDS vazio: ninguém passa, nem o uid que passaria com a lista', rf.status === 403);
    const g = novoAmbiente({ env: { ANTHROPIC_API_KEY: 'k', IA_UIDS: UID_OK.slice(0, -1) } });
    const rg = await N.atender(pedido(SIMPLES), g.dep);
    conf('uid parecido (prefixo) não passa: a comparação é exata', rg.status === 403);
  }

  console.log('\n=== verificarTokenFirebase (o lookup do Identity Toolkit) ===');
  {
    const pedidos = [];
    const fetchFalso = ok => async (url, init) => {
      pedidos.push({ url, corpo: JSON.parse(init.body) });
      return ok ? { ok: true, json: async () => ({ users: [{ localId: UID_OK, email: 'x@y' }] }) }
        : { ok: false, json: async () => ({ error: { message: 'INVALID_ID_TOKEN' } }) };
    };
    const cache = new Map();
    const uid = await N.verificarTokenFirebase('tk1', fetchFalso(true), cache, 1000);
    conf('token aceito devolve o localId', uid === UID_OK);
    conf('o pedido vai ao accounts:lookup do projeto, com o idToken no corpo',
      /accounts:lookup\?key=AIza/.test(pedidos[0].url) && pedidos[0].corpo.idToken === 'tk1');
    await N.verificarTokenFirebase('tk1', fetchFalso(true), cache, 2000);
    conf('segunda vez em menos de 5 min vem do cache (sem novo pedido)', pedidos.length === 1);
    await N.verificarTokenFirebase('tk1', fetchFalso(true), cache, 1000 + 5 * 60 * 1000 + 1);
    conf('depois de 5 min confere de novo', pedidos.length === 2);
    const nulo = await N.verificarTokenFirebase('tk2', fetchFalso(false), new Map(), 1000);
    conf('token recusado pelo Firebase devolve null', nulo === null);
    const desab = await N.verificarTokenFirebase('tk3', async () => ({ ok: true, json: async () => ({ users: [{ localId: UID_OK, disabled: true }] }) }), new Map(), 1);
    conf('conta desativada devolve null', desab === null);
    const quebra = await N.verificarTokenFirebase('tk4', async () => { throw new Error('sem rede'); }, new Map(), 1);
    conf('sem rede até o Firebase devolve null (não deixa passar)', quebra === null);
  }

  console.log('\n=== limites do pedido ===');
  {
    const grande = 'x'.repeat(N.LIMITES.bytes);
    const a = novoAmbiente();
    const ra = await N.atender(pedido({ rota: 'teste', messages: [{ role: 'user', content: grande }] }), a.dep);
    conf('corpo acima de 8 MB: 413', ra.status === 413 && a.chamadas.length === 0);
    const quase = 'x'.repeat(N.LIMITES.bytes - 200);
    const b = novoAmbiente();
    const rb = await N.atender(pedido({ rota: 'teste', messages: [{ role: 'user', content: quase }] }), b.dep);
    conf('corpo logo abaixo de 8 MB passa (controle do limite)', rb.status === 200, rb.status);
    const img = { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'AAAA' } };
    const dez = novoAmbiente();
    const rdez = await N.atender(pedido({ rota: 'planejamento', messages: [{ role: 'user', content: Array(10).fill(img).concat([{ type: 'text', text: 'oi' }]) }] }), dez.dep);
    conf('10 imagens passam', rdez.status === 200);
    const onze = novoAmbiente();
    const ronze = await N.atender(pedido({ rota: 'planejamento', messages: [{ role: 'user', content: Array(11).fill(img) }] }), onze.dep);
    conf('11 imagens: 400 imagens_demais', ronze.status === 400 && ronze.corpo.codigo === 'imagens_demais');
    const escondida = novoAmbiente();
    const resc = await N.atender(pedido({ rota: 'assistente', messages: [
      { role: 'user', content: Array(6).fill(img) },
      { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'f', input: {} }] },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: Array(6).fill(img) }] }
    ] }), escondida.dep);
    conf('imagens dentro de tool_result também contam (6 + 6 = 12 barra)', resc.status === 400 && resc.corpo.codigo === 'imagens_demais');
    const longa = novoAmbiente();
    const msgs = [];
    for (let i = 0; i < 61; i++) msgs.push({ role: i % 2 ? 'assistant' : 'user', content: 'm' });
    const rl = await N.atender(pedido({ rota: 'teste', messages: msgs }), longa.dep);
    conf('61 mensagens: 400 conversa_longa', rl.status === 400 && rl.corpo.codigo === 'conversa_longa');
    const sessenta = novoAmbiente();
    const r60 = await N.atender(pedido({ rota: 'teste', messages: msgs.slice(0, 59) }), sessenta.dep);
    conf('59 mensagens passam', r60.status === 200, r60.status);
  }

  console.log('\n=== forma do corpo e rotas ===');
  {
    const casos = [
      ['JSON quebrado', '{"rota":', 'pedido_invalido'],
      ['rota desconhecida', { rota: 'hack', messages: SIMPLES.messages }, 'rota_desconhecida'],
      ['rota herdada do Object (toString)', { rota: 'toString', messages: SIMPLES.messages }, 'rota_desconhecida'],
      ['sem mensagens', { rota: 'teste', messages: [] }, 'pedido_invalido'],
      ['papel estranho', { rota: 'teste', messages: [{ role: 'system', content: 'x' }] }, 'pedido_invalido'],
      ['começa pelo assistente', { rota: 'teste', messages: [{ role: 'assistant', content: 'x' }] }, 'pedido_invalido'],
      ['formato na rota teste', { rota: 'teste', formato: { type: 'json_schema', schema: {} }, messages: SIMPLES.messages }, 'nao_permitido_na_rota'],
      ['ferramentas na rota planejamento', { rota: 'planejamento', tools: [], messages: SIMPLES.messages }, 'nao_permitido_na_rota'],
      ['formato que não é json_schema', { rota: 'planejamento', formato: { type: 'texto' }, messages: SIMPLES.messages }, 'pedido_invalido'],
      ['max_tokens zero', { rota: 'teste', max_tokens: 0, messages: SIMPLES.messages }, 'pedido_invalido']
    ];
    for (const [nome, corpo, codigo] of casos) {
      const a = novoAmbiente();
      const r = await N.atender(pedido(corpo), a.dep);
      conf(nome + ': 400 ' + codigo + ' sem chamar o modelo', r.status === 400 && r.corpo.codigo === codigo && a.chamadas.length === 0, JSON.stringify(r.corpo));
    }
    const a = novoAmbiente();
    const schema = { type: 'json_schema', schema: { type: 'object', properties: {}, additionalProperties: false } };
    await N.atender(pedido({ rota: 'planejamento', formato: schema, system: 'regras', messages: SIMPLES.messages }), a.dep);
    const p = a.chamadas[0] || {};
    conf('planejamento com formato e system: os dois chegam ao modelo', !!p.output_config && JSON.stringify(p.output_config.format) === JSON.stringify(schema) && p.system === 'regras');
    const b = novoAmbiente();
    await N.atender(pedido({ rota: 'assistente', tools: [{ name: 'listar_aulas', input_schema: { type: 'object' } }], messages: SIMPLES.messages }), b.dep);
    conf('assistente com ferramentas: chegam ao modelo', ((b.chamadas[0] || {}).tools || []).length === 1);
  }

  console.log('\n=== frequência por uid ===');
  {
    const a = novoAmbiente();
    let ultimo;
    for (let i = 0; i < N.LIMITES.porHora; i++) ultimo = await N.atender(pedido(SIMPLES), a.dep);
    conf('as ' + N.LIMITES.porHora + ' primeiras da hora passam', ultimo.status === 200);
    const barrada = await N.atender(pedido(SIMPLES), a.dep);
    conf('a seguinte na mesma hora: 429 muitos_pedidos', barrada.status === 429 && barrada.corpo.codigo === 'muitos_pedidos');
    conf('a barrada não chamou o modelo', a.chamadas.length === N.LIMITES.porHora);
    a.avancar(60 * 60 * 1000 + 1);
    const depois = await N.atender(pedido(SIMPLES), a.dep);
    conf('passada a hora, volta a passar', depois.status === 200);
  }

  console.log('\n=== erros da API viram código do app ===');
  {
    const tabela = [['limite_mensal', 503], ['ocupado', 503], ['rede', 504], ['pedido_recusado_pela_api', 502], ['indisponivel', 503]];
    for (const [codigo, status] of tabela) {
      const a = novoAmbiente({ falha: { codigoFalso: codigo, message: 'mensagem crua da API ' + MARCA } });
      const r = await N.atender(pedido(SIMPLES), a.dep);
      conf(codigo + ' responde ' + status + ' sem a mensagem crua', r.status === status && r.corpo.codigo === codigo && JSON.stringify(r.corpo).indexOf(MARCA) < 0, JSON.stringify(r));
    }
    const rec = novoAmbiente({ resposta: { stop_reason: 'refusal', stop_details: { category: 'general_harms' }, content: [] } });
    const rr = await N.atender(pedido(SIMPLES), rec.dep);
    conf('recusa (stop_reason refusal): 200, ok false, código recusa e a categoria', rr.status === 200 && rr.corpo.ok === false && rr.corpo.codigo === 'recusa' && rr.corpo.categoria === 'general_harms');
  }

  console.log('\n=== classificarErroDaApi com classes do formato do SDK ===');
  {
    class APIError extends Error { constructor(status, corpo) { super('x'); this.status = status; this.error = corpo; } }
    class APIConnectionError extends APIError {}
    class RateLimitError extends APIError {}
    class BadRequestError extends APIError {}
    class AuthenticationError extends APIError {}
    class PermissionDeniedError extends APIError {}
    const A = { APIError, APIConnectionError, RateLimitError, BadRequestError, AuthenticationError, PermissionDeniedError };
    const c = (e) => N.classificarErroDaApi(e, A);
    conf('429 com enforced_spend_limit_reached: limite_mensal',
      c(new RateLimitError(429, { type: 'error', error: { type: 'rate_limit_error', message: 'You have reached your API usage limits', details: { error_code: 'enforced_spend_limit_reached' } } })) === 'limite_mensal');
    conf('429 comum (taxa): ocupado, não limite_mensal',
      c(new RateLimitError(429, { type: 'error', error: { type: 'rate_limit_error', message: 'Number of requests has exceeded' } })) === 'ocupado');
    conf('400 do limite que o dono definiu: limite_mensal',
      c(new BadRequestError(400, { type: 'error', error: { type: 'invalid_request_error', message: 'You have reached your specified API usage limits. You will regain access on 2026-12-01 at 00:00 UTC.' } })) === 'limite_mensal');
    conf('400 do limite do workspace: limite_mensal',
      c(new BadRequestError(400, { type: 'error', error: { type: 'invalid_request_error', message: 'You have reached your specified workspace API usage limits' } })) === 'limite_mensal');
    conf('400 de outro motivo: pedido_recusado_pela_api',
      c(new BadRequestError(400, { type: 'error', error: { type: 'invalid_request_error', message: 'messages: field required' } })) === 'pedido_recusado_pela_api');
    conf('chave inválida (401): indisponivel', c(new AuthenticationError(401, {})) === 'indisponivel');
    conf('sem conexão: rede', c(new APIConnectionError(0, undefined)) === 'rede');
    conf('529 sobrecarga (APIError genérico): ocupado', c(new APIError(529, {})) === 'ocupado');
    conf('erro que não é do SDK: indisponivel', c(new TypeError('x')) === 'indisponivel');
  }

  console.log('\n=== o registro nunca guarda conteúdo ===');
  {
    const a = novoAmbiente({ resposta: { content: [{ type: 'text', text: 'resposta com ' + MARCA }] } });
    const img = { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: MARCA + 'BASE64' } };
    const corpo = { rota: 'planejamento', system: 'sistema ' + MARCA, messages: [{ role: 'user', content: [img, { type: 'text', text: 'texto ' + MARCA }] }] };
    const r = await N.atender(pedido(corpo), a.dep);
    conf('controle: a marca está no pedido e na resposta (o instrumento vê)',
      JSON.stringify(a.chamadas[0]).indexOf(MARCA) >= 0 && JSON.stringify(r.corpo).indexOf(MARCA) >= 0);
    conf('foi registrada uma linha', a.log.length === 1, a.log.length);
    conf('a linha do registro não tem a marca (nem texto, nem imagem, nem sistema)', a.log[0].indexOf(MARCA) < 0, a.log[0]);
    const reg = JSON.parse(a.log[0]);
    conf('a linha tem rota, status, uso e tempo', reg.rota === 'planejamento' && reg.status === 200 && reg.uso && reg.uso.input_tokens === 12 && typeof reg.ms === 'number');
    conf('a linha guarda só o começo do uid', reg.uid === UID_OK.slice(0, 6));
    const b = novoAmbiente();
    await N.atender(pedido(SIMPLES, TOKEN_OUTRO), b.dep);
    conf('pedido barrado também é registrado, com o código', b.log.length === 1 && JSON.parse(b.log[0]).codigo === 'sem_permissao');
    const c = novoAmbiente();
    c.dep.registrar = () => { throw new Error('log quebrado'); };
    const rc = await N.atender(pedido(SIMPLES), c.dep);
    conf('registro que falha não derruba a resposta', rc.status === 200);
  }

  console.log('\n' + passes + ' verificacoes passaram, ' + falhas + ' falharam');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.log('  FALHA a prova quebrou: ' + (e && e.stack || e)); process.exit(1); });
