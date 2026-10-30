/* testa_dominio_navegador.js
 *
 * C1: domínio por assunto, na tela de verdade. Dados fictícios ("Aluno Alfa
 * Teste"), uma trilha até "Operações com frações" montada pelo motor com o
 * índice de verdade, uma aula de hoje com dois assuntos que são passos da
 * trilha e uma aula da semana passada com uma marca anterior.
 *
 * O que se prova:
 *   1. em Registrar como foi, cada assunto da aula tem "Ainda não", "Em
 *      andamento" e "Domina", com o selo "Só você vê";
 *   2. um toque marca e grava; tocar de novo no marcado desmarca e o campo
 *      sai do banco;
 *   3. a trilha: "Em andamento" NÃO fecha o passo, "Domina" fecha com a data
 *      da aula, e tirar o "Domina" solta o passo de novo;
 *   4. tudo sobrevive a recarregar (banco e tela);
 *   5. a ficha mostra o quadro "Domínio por assunto" com o último estado, a
 *      data e a marca anterior; a janela da trilha diz "dominado em";
 *   6. a cópia de segurança, pelos botões de Ajustes, leva o domínio: o banco
 *      perde as marcas, a cópia é restaurada pelo seletor de arquivo, e elas
 *      voltam;
 *   7. o documento da família, texto e PDF pelos botões de verdade, e a
 *      prévia, não citam domínio; controle positivo: o título do assunto TEM
 *      de estar lá, senão a ausência não provaria nada;
 *   8. nenhum erro de página.
 *
 * SALVAR_PRINTS=<pasta> guarda três prints: Registrar como foi com os três
 * estados, o quadro na ficha e a trilha com o passo fechado por domínio.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador');
/* --envenenado-aula-dada serve um core.js com a regra de antes do C1 (o passo
 * fecha por aula dada) e a prova TEM de reprovar: é o controle de que a tela
 * enxerga a regra, e não só o botão. Fica fora do portão, que roda a limpa. */
const VENENO = process.argv.indexOf('--envenenado-aula-dada') >= 0;
function coreEnvenenado() {
  const fonte = fs.readFileSync(path.join(__dirname, '..', 'core.js'), 'utf8').replace(/\r\n/g, '\n');
  const ini = 'function dominioFechaPasso(aula, temaId) {';
  const i = fonte.indexOf(ini);
  const fim = i < 0 ? -1 : fonte.indexOf('\n  }\n', i);
  if (i < 0 || fim < 0) throw new Error('veneno não aplicado: a regra não foi achada no core.js');
  return fonte.slice(0, i) + ini + '\n    if (!aula || !temaId || !aulaAconteceu(aula)) return false;\n' +
    '    return temasDaAula(aula).some(function (t) { return t && t.id === temaId; });' + fonte.slice(fim);
}
/* --envenenado-encerrada serve um app.js em que o toque no domínio volta a
 * passar pela revisão inteira (que mexe nas encerradas): a seção 7b TEM de
 * reprovar. Também fora do portão. */
const VENENO_ENCERRADA = process.argv.indexOf('--envenenado-encerrada') >= 0;
function appEnvenenado() {
  const fonte = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const de = 'mexeu = Core.revisarDominioNaAula(db, aluno, aula, item.id);';
  if (fonte.split(de).length !== 2) throw new Error('veneno não aplicado: o toque no domínio não foi achado no app.js');
  return fonte.replace(de, 'mexeu = revisarTrilhasDoAluno(aula.alunoId);');
}
/* --envenenado-salvar serve um app.js cuja varredura do Salvar volta a passar
 * por todas as trilhas, encerradas inclusive (o PR #90): o caso do Salvar na
 * seção 7b TEM de reprovar. Também fora do portão. */
const VENENO_SALVAR = process.argv.indexOf('--envenenado-salvar') >= 0;
function appVarreEncerrada() {
  const fonte = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8').replace(/\r\n/g, '\n');
  const de = '// só as ativas, nos quatro passos: a encerrada não entra em nenhum\n    var ativas = Core.trilhasAtivas(aluno);';
  if (fonte.split(de).length !== 2) throw new Error('veneno não aplicado: a varredura não foi achada no app.js');
  return fonte.replace(de, 'var ativas = Core.trilhasDe(aluno);');
}
const trocas = {};
if (VENENO) trocas['/core.js'] = coreEnvenenado();
if (VENENO_ENCERRADA) trocas['/app.js'] = appEnvenenado();
if (VENENO_SALVAR) trocas['/app.js'] = appVarreEncerrada();
const amb = H.criarAmbiente(8860, 'nath_c1_dominio', trocas);
const { secao, esperar, pausa } = H;
/* O conf do ajudante compara por String(), e objeto vira "[object Object]"
 * dos dois lados: passaria calado. Aqui compara por JSON, no mesmo placar. */
function conf(rotulo, obtido, esperado) {
  const a = JSON.stringify(obtido), b = JSON.stringify(esperado);
  const ok = a === b;
  if (ok) H.placar.passes++; else H.placar.falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo + (ok ? '' : '  [obtido: ' + String(a).slice(0, 300) + ' | esperado: ' + b + ']'));
  return ok;
}
const SALVAR = process.env.SALVAR_PRINTS || '';

const ALUNO = 'aluno_c1_alfa';
const AULA = 'aula_c1_hoje';
const AULA_ANTES = 'aula_c1_antes';
const T1 = 'MAT06-01';
const T2 = 'MAT06-02';
function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
const HOJE = iso(new Date());
const SEMANA_PASSADA = (() => { const d = new Date(); d.setDate(d.getDate() - 7); return iso(d); })();
const ddmm = s => s.slice(8, 10) + '/' + s.slice(5, 7);
const ddmmaaaa = s => ddmm(s) + '/' + s.slice(0, 4);
// o que a família não pode ler, em qualquer caixa
const PROIBIDAS = /domin|andamento|ainda n/i;

function textoDoPdf(base64) {
  const bruto = Buffer.from(base64, 'base64').toString('latin1');
  const rx = /\(((?:\\.|[^\\()])*)\)\s*Tj/g;
  const partes = [];
  let m;
  while ((m = rx.exec(bruto))) partes.push(m[1].replace(/\\([\\()])/g, '$1'));
  return partes.join(' ');
}

async function semear(pag) {
  return pag.evaluate(async (d0) => {
    const j = await fetch('banco/topicos/matematica.json').then(x => x.json());
    const temas = j.temas || j;
    const der = Core.trilhaDerivada(temas, 'MAT06-06');
    const d = await Store.carregar();
    d.alunos = (d.alunos || []).filter(a => a.id !== d0.ALUNO);
    const aluno = { id: d0.ALUNO, nome: 'Aluno Alfa Teste', ano: '06', anoEscolar: '6º ano do Ensino Fundamental',
      responsavel: 'Responsavel Alfa', ativo: true, cor: '#2E7D6B',
      precos: [{ id: 'p_c1', inicio: '2026-01-01', fim: null, valorHora: 100 }] };
    aluno.trilhas = [Core.criarTrilha({ alunoId: d0.ALUNO, titulo: 'Operações com frações', alvoId: 'MAT06-06',
      materia: 'matematica', criadaEm: d0.SEMANA_PASSADA, passos: der.passos })];
    d.alunos.push(aluno);
    const titulo = id => temas.find(t => t.id === id).pt.titulo;
    const item = (id, dom) => { const x = { id: id, titulo: titulo(id), fonte: 'banco', disciplina: 'matematica' }; if (dom) x.dominio = dom; return x; };
    const aula = (id, data, temasDaAula) => ({ id: id, alunoId: d0.ALUNO, serieId: null, destacada: false, data: data,
      hora: '10:00', duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '', temNota: false,
      anexos: [], areas: [], temas: temasDaAula });
    d.aulas = (d.aulas || []).filter(a => a.alunoId !== d0.ALUNO);
    d.aulas.push(aula(d0.AULA_ANTES, d0.SEMANA_PASSADA, [item(d0.T1, 'andamento')]));
    d.aulas.push(aula(d0.AULA, d0.HOJE, [item(d0.T1), item(d0.T2)]));
    d.ajustes = d.ajustes || {};
    d.ajustes.exibirTemasEAreas = true;   // o documento da família lista os assuntos: é o controle positivo
    d.ajustes.ultimaCopia = d0.HOJE;
    await Store.salvar(d);
    return { passos: der.passos.map(p => p.temaId), t1: titulo(d0.T1), t2: titulo(d0.T2) };
  }, { ALUNO, AULA, AULA_ANTES, T1, T2, HOJE, SEMANA_PASSADA });
}

// o que está GRAVADO, lido do IndexedDB
const doBanco = pag => pag.evaluate(async (a) => {
  const d = await Store.carregar();
  const aula = (d.aulas || []).find(x => x.id === a.AULA);
  const aluno = (d.alunos || []).find(x => x.id === a.ALUNO);
  const tr = aluno && (aluno.trilhas || [])[0];
  const passo = id => { const p = tr && tr.passos.find(x => x.temaId === id); return p ? { feitoEm: p.feitoEm || null, porDominio: !!p.porDominio } : null; };
  const dom = {};
  (aula ? aula.temas || [] : []).forEach(t => { dom[t.id] = t.dominio === undefined ? '(sem campo)' : t.dominio; });
  return { dom, p1: passo(a.T1), p2: passo(a.T2), encerrada: !!(tr && tr.encerradaEm) };
}, { AULA, ALUNO, T1, T2 });

// o que a TELA mostra marcado, por assunto
const naTela = pag => pag.evaluate(() => {
  const r = {};
  document.querySelectorAll('#bloco-dominio .item-dominio').forEach(l => {
    const ativo = l.querySelector('.opcao-dominio.ativa');
    r[l.dataset.chave] = ativo ? ativo.dataset.estado : '';
  });
  return r;
});

const tocar = (pag, chave, estado) => pag.evaluate((c, e) => {
  const b = document.querySelector('#bloco-dominio .item-dominio[data-chave="' + c + '"] .opcao-dominio[data-estado="' + e + '"]');
  if (!b) return false;
  b.click();
  return true;
}, chave, estado);

async function abrirAulaDeHoje(pag) {
  await H.irParaAba(pag, 'agenda');
  for (let i = 0; i < 24; i++) {
    if (await pag.evaluate(h => !!document.querySelector('[data-dia="' + h + '"]'), HOJE)) break;
    await pag.click(i < 12 ? '#mes-seguinte' : '#mes-anterior');
    await pausa(120);
  }
  const ok = await pag.evaluate(h => {
    const alvo = Array.from(document.querySelectorAll('[data-dia="' + h + '"] .pilula')).find(p => p.textContent.indexOf('10:00') === 0);
    if (!alvo) return false; alvo.click(); return true;
  }, HOJE);
  const r = await esperar('aula de hoje aberta', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto') && !!document.querySelector('#bloco-dominio')), v => v === true, 8000);
  return ok && r.ok;
}

async function fecharModais(pag) {
  await pag.evaluate(() => {
    document.querySelectorAll('.fundo-modal.aberto').forEach(m => {
      const f = m.querySelector('.fechar') || m.querySelector('[data-fechar]');
      if (f) f.click();
    });
  });
  await pausa(300);
}

async function abrirFicha(pag, aba) {
  await fecharModais(pag);
  await H.irParaAba(pag, 'alunos');
  const abriu = await pag.evaluate(id => {
    const l = document.querySelector('#lista-alunos .item-lista[data-aluno="' + id + '"]');
    if (!l) return false; l.click(); return true;
  }, ALUNO);
  await esperar('ficha aberta', () => pag.evaluate(() => document.querySelector('#modal-aluno').classList.contains('aberto')), v => v === true, 5000);
  await pag.evaluate(t => {
    const b = Array.from(document.querySelectorAll('#modal-aluno .aba-perfil')).find(x => x.textContent.trim() === t);
    if (b) b.click();
  }, aba);
  await pausa(300);
  return abriu;
}

async function printDe(pag, seletor, nome, folga) {
  if (!SALVAR) return;
  fs.mkdirSync(SALVAR, { recursive: true });
  await pag.evaluate(s => { const e = document.querySelector(s); if (e) e.scrollIntoView({ block: 'center' }); }, seletor);
  await pausa(400);
  const caixa = await pag.evaluate(s => {
    const r = document.querySelector(s).getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  }, seletor);
  const f = folga || 12;
  await pag.screenshot({ path: path.join(SALVAR, nome), clip: {
    x: Math.max(0, caixa.x - f), y: Math.max(0, caixa.y - f), width: caixa.w + 2 * f, height: caixa.h + 2 * f } });
  console.log('       print: ' + path.join(SALVAR, nome));
}

(async () => {
  await amb.subir();
  const pag = await amb.pagina();
  await pag.setViewport({ width: 1280, height: 900, hasTouch: true });
  /* O Chrome sem cabeça não compartilha nem deixa baixar em sequência: o
   * arquivo é capturado no momento em que o aplicativo o entrega, e é o mesmo
   * conteúdo (o caminho do e2e.js). */
  await pag.evaluateOnNewDocument(() => {
    window.__gerados = [];
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    const criar = URL.createObjectURL.bind(URL);
    URL.createObjectURL = function (b) { window.__ultimoBlob = b; return criar(b); };
    const clicar = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.hasAttribute('download')) {
        const blob = window.__ultimoBlob;
        const nome = this.getAttribute('download');
        const leitor = new FileReader();
        leitor.onload = () => window.__gerados.push({ nome: nome, base64: leitor.result.split(',')[1] });
        leitor.readAsDataURL(blob);
        return;
      }
      return clicar.call(this);
    };
  });
  await H.abrirApp(pag, amb.ORIGEM);

  // ================================================================
  secao('1. Em Registrar como foi, os três estados embaixo de cada assunto');
  const semente = await semear(pag);
  conf('a trilha foi montada com os dois passos da aula', semente.passos.slice(0, 2).join(','), T1 + ',' + T2);
  await H.abrirApp(pag, amb.ORIGEM);
  conf('a aula de hoje abriu', await abrirAulaDeHoje(pag), true);
  const bloco = await pag.evaluate(() => {
    const b = document.querySelector('#bloco-dominio');
    return {
      dentroDoRegistro: !!b.closest('#grupo-registro'),
      linhas: Array.from(b.querySelectorAll('.item-dominio')).map(l => ({
        chave: l.dataset.chave, nome: l.querySelector('.nome').textContent,
        botoes: Array.from(l.querySelectorAll('.opcao-dominio')).map(x => x.textContent.trim())
      })),
      selo: (b.querySelector('.destino-privado') || {}).textContent
    };
  });
  conf('o bloco mora em Registrar como foi', bloco.dentroDoRegistro, true);
  conf('uma linha por assunto da aula', bloco.linhas.map(l => l.chave), [T1, T2]);
  conf('com o título do assunto', bloco.linhas[0].nome, semente.t1);
  conf('três botões, na ordem', bloco.linhas[0].botoes, ['Ainda não', 'Em andamento', 'Domina']);
  conf('com o selo "Só você vê"', bloco.selo, 'Só você vê');
  conf('nada marcado de começo', await naTela(pag), { [T1]: '', [T2]: '' });

  // ================================================================
  secao('2. Marcar e desmarcar');
  await tocar(pag, T1, 'andamento');
  let g = await esperar('Em andamento gravado', () => doBanco(pag), v => v.dom[T1] === 'andamento', 5000);
  conf('um toque grava "Em andamento"', g.valor.dom[T1], 'andamento');
  conf('e a tela mostra marcado', (await naTela(pag))[T1], 'andamento');
  conf('o botão marcado diz aria-pressed', await pag.evaluate(c =>
    document.querySelector('#bloco-dominio .item-dominio[data-chave="' + c + '"] .opcao-dominio.ativa').getAttribute('aria-pressed'), T1), 'true');
  await tocar(pag, T1, 'andamento');
  g = await esperar('desmarcado no banco', () => doBanco(pag), v => v.dom[T1] === '(sem campo)', 5000);
  conf('tocar de novo no marcado desmarca, e o campo sai do banco', g.valor.dom[T1], '(sem campo)');
  conf('e a tela mostra nada marcado', (await naTela(pag))[T1], '');

  // ================================================================
  secao('3. A trilha fecha com Domina, e não com Em andamento');
  await tocar(pag, T2, 'andamento');
  g = await esperar('T2 em andamento gravado', () => doBanco(pag), v => v.dom[T2] === 'andamento', 5000);
  await pausa(300);
  g = await doBanco(pag);
  conf('"Em andamento" gravado no segundo assunto', g.dom[T2], 'andamento');
  conf('e o passo dele NÃO fechou', g.p2.feitoEm, null);
  /* Salvar a aula passa pela varredura que remarca as trilhas
   * (revisarTrilhasDoAluno): é lá que a regra antiga fecharia os dois passos,
   * só por os assuntos estarem registrados numa aula realizada. */
  await pag.click('#salvar-aula');
  await esperar('aula salva e fechada', () => pag.evaluate(() => !document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);
  await pausa(300);
  g = await doBanco(pag);
  conf('depois de salvar a aula, nenhum passo fechou só por aula dada', [g.p1.feitoEm, g.p2.feitoEm], [null, null]);
  conf('a aula reabre para continuar', await abrirAulaDeHoje(pag), true);
  await tocar(pag, T1, 'domina');
  g = await esperar('passo 1 fechado', () => doBanco(pag), v => v.dom[T1] === 'domina' && !!v.p1.feitoEm, 5000);
  conf('"Domina" fecha o passo do assunto', g.valor.p1.feitoEm, HOJE);
  conf('marcado como fechado por domínio', g.valor.p1.porDominio, true);
  const aviso = await pag.evaluate(() => document.querySelector('#aviso-texto').textContent);
  conf('o aviso diz que a trilha andou', /a trilha andou: 1 de \d+ passos/.test(aviso), true);
  await tocar(pag, T1, 'domina');
  g = await esperar('passo 1 solto', () => doBanco(pag), v => v.dom[T1] === '(sem campo)' && !v.p1.feitoEm, 5000);
  conf('tirar o "Domina" solta o passo que esta aula fechou', g.valor.p1.feitoEm, null);
  await tocar(pag, T1, 'domina');
  g = await esperar('passo 1 fechado de novo', () => doBanco(pag), v => !!v.p1.feitoEm, 5000);
  conf('e marcar de novo fecha de novo', g.valor.p1.feitoEm, HOJE);
  await printDe(pag, '#bloco-dominio', '01_registrar_como_foi_dominio.png', 16);

  // ================================================================
  secao('4. Tudo sobrevive a recarregar');
  await fecharModais(pag);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  g = await doBanco(pag);
  conf('no banco, depois de recarregar: Domina e Em andamento', [g.dom[T1], g.dom[T2]], ['domina', 'andamento']);
  conf('e o passo continua fechado', g.p1.feitoEm, HOJE);
  conf('a aula reabre', await abrirAulaDeHoje(pag), true);
  conf('e a tela mostra as duas marcas', await naTela(pag), { [T1]: 'domina', [T2]: 'andamento' });

  // ================================================================
  secao('5. A ficha: o quadro "Domínio por assunto" e a trilha');
  await abrirFicha(pag, 'Histórico');
  const quadro = await pag.evaluate(() => {
    const q = document.querySelector('#quadro-dominio');
    if (!q) return null;
    return Array.from(q.querySelectorAll('.linha-dominio')).map(l => ({
      chave: l.dataset.chave, nome: l.querySelector('.nome').textContent,
      estado: l.querySelector('.estado-dominio').textContent, detalhe: l.querySelector('.detalhe').textContent
    }));
  });
  conf('o quadro aparece na ficha', !!quadro, true);
  const q1 = (quadro || []).find(l => l.chave === T1) || {};
  const q2 = (quadro || []).find(l => l.chave === T2) || {};
  conf('o primeiro assunto: último estado Domina', q1.estado, 'Domina');
  conf('com a data da última aula em que foi marcado', (q1.detalhe || '').indexOf('Marcado em ' + ddmmaaaa(HOJE)) === 0, true);
  conf('e a marca anterior, da semana passada', (q1.detalhe || '').indexOf('antes: Em andamento em ' + ddmm(SEMANA_PASSADA)) >= 0, true);
  conf('o segundo: Em andamento, hoje', [q2.estado, (q2.detalhe || '').indexOf('Marcado em ' + ddmmaaaa(HOJE)) === 0], ['Em andamento', true]);
  await printDe(pag, '#quadro-dominio', '02_ficha_dominio_por_assunto.png', 14);

  await abrirFicha(pag, 'Mapeamento');
  await esperar('o painel de trilhas', () => pag.evaluate(() => !!document.querySelector('#painel-trilhas .item-trilha-ativa .abrir-trilha')), v => v === true, 8000);
  await pag.evaluate(() => document.querySelector('#painel-trilhas .item-trilha-ativa .abrir-trilha').click());
  const passos = await esperar('a janela da trilha', () => pag.evaluate(() => {
    const m = document.querySelector('#modal-trilha.aberto');
    if (!m) return null;
    const r = {};
    m.querySelectorAll('.item-passo-trilha').forEach(l => { r[l.dataset.passo] = l.textContent; });
    return r;
  }), v => !!v && Object.keys(v).length > 1, 8000);
  const lp = passos.valor || {};
  conf('o passo fechado diz "dominado em" com a data da aula', (lp[T1] || '').indexOf('dominado em ' + ddmm(HOJE)) >= 0, true);
  conf('o passo em andamento continua aberto', /dominado em|dado em/.test(lp[T2] || ''), false);
  await printDe(pag, '#modal-trilha.aberto .modal', '03_trilha_passo_fechado_por_dominio.png', 0);

  // ================================================================
  secao('6. A cópia de segurança leva o domínio');
  await fecharModais(pag);
  await H.irParaAba(pag, 'ajustes');
  await pag.evaluate(() => { window.__gerados = []; document.querySelector('#baixar-copia').click(); });
  await esperar('cópia pronta', () => pag.evaluate(() => document.querySelector('#aviso-texto').textContent), v => /Cópia pronta/.test(v || ''), 15000);
  await pag.evaluate(() => document.querySelector('#aviso-acao').click());
  const copia = await esperar('a cópia entregue', () => pag.evaluate(() => (window.__gerados || []).find(x => /\.json$/.test(x.nome)) || null), v => !!v, 10000);
  conf('a cópia saiu pelo botão', !!copia.valor, true);
  const pacote = JSON.parse(Buffer.from(copia.valor.base64, 'base64').toString('utf8'));
  const naCopia = ((pacote.dados.aulas || []).find(a => a.id === AULA) || { temas: [] }).temas.map(t => t.dominio || '');
  conf('o arquivo da cópia tem as marcas no item do assunto', naCopia, ['domina', 'andamento']);
  const arquivo = path.join(os.tmpdir(), 'c1_copia_' + process.pid + '.json');
  fs.writeFileSync(arquivo, Buffer.from(copia.valor.base64, 'base64'));

  // o tablet perde as marcas (como num aparelho novo), e a cópia volta
  await pag.evaluate(async (id) => {
    const d = await Store.carregar();
    d.aulas.filter(a => a.alunoId === id).forEach(a => (a.temas || []).forEach(t => { delete t.dominio; }));
    d.alunos.find(a => a.id === id).trilhas[0].passos.forEach(p => { p.feitoEm = null; p.aulaId = null; delete p.porDominio; });
    await Store.salvar(d);
  }, ALUNO);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  g = await doBanco(pag);
  conf('controle: o banco ficou sem as marcas', [g.dom[T1], g.dom[T2], g.p1.feitoEm], ['(sem campo)', '(sem campo)', null]);
  await H.irParaAba(pag, 'ajustes');
  const entrada = await pag.$('#arquivo-copia');
  await entrada.uploadFile(arquivo);
  await esperar('cópia restaurada', () => pag.evaluate(() => document.querySelector('#aviso-texto').textContent), v => /Cópia restaurada/.test(v || ''), 15000);
  g = await doBanco(pag);
  conf('restaurada, as marcas voltam ao banco', [g.dom[T1], g.dom[T2]], ['domina', 'andamento']);
  conf('e o passo fechado por domínio também', [g.p1.feitoEm, g.p1.porDominio], [HOJE, true]);
  await abrirFicha(pag, 'Histórico');
  conf('e o quadro da ficha mostra de novo', await pag.evaluate(c => {
    const l = document.querySelector('#quadro-dominio .linha-dominio[data-chave="' + c + '"] .estado-dominio');
    return l ? l.textContent : '';
  }, T1), 'Domina');
  try { fs.unlinkSync(arquivo); } catch (e) { /* já saiu */ }

  // ================================================================
  secao('7. O documento da família não cita domínio (texto, PDF e prévia)');
  await fecharModais(pag);
  await pag.click('button[data-tela="fechamento"]');
  await pausa(400);
  await pag.evaluate(m => {
    const sel = document.querySelector('#mes-fechamento');
    if (sel && sel.value !== m) { sel.value = m; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  }, HOJE.slice(0, 7));
  await pausa(400);
  const abriuDoc = await pag.evaluate(() => {
    const c = Array.from(document.querySelectorAll('#lista-fechamento .cartao')).find(x => x.textContent.includes('Aluno Alfa Teste'));
    const b = c && c.querySelector('.btn-preparar-doc');
    if (!b) return false; b.click(); return true;
  });
  conf('a janela do documento da família abriu', abriuDoc, true);
  await esperar('a prévia', () => pag.evaluate(() => !!document.querySelector('#conteudo-previa-doc-familia')), v => v === true, 5000);
  const previa = await pag.evaluate(() => document.querySelector('#conteudo-previa-doc-familia').textContent);
  await pag.evaluate(() => { window.__gerados = []; document.querySelector('#btn-doc-familia-md').click(); });
  const md = await esperar('o texto', () => pag.evaluate(() => (window.__gerados || []).find(x => /\.md$/.test(x.nome)) || null), v => !!v, 8000);
  await pag.evaluate(() => { document.querySelector('#btn-doc-familia-pdf-fechamento').click(); });
  const pdf = await esperar('o PDF', () => pag.evaluate(() => (window.__gerados || []).find(x => /\.pdf$/.test(x.nome)) || null), v => !!v, 15000);
  const saidas = {
    'prévia': previa,
    'texto': md.valor ? Buffer.from(md.valor.base64, 'base64').toString('utf8') : '',
    'PDF': pdf.valor ? textoDoPdf(pdf.valor.base64) : ''
  };
  // o título no PDF pode vir com o acento escapado: o começo dele, sem acento, basta
  const PREFIXO = semente.t1.slice(0, 17);
  Object.keys(saidas).forEach(nome => {
    conf(nome + ': o assunto da aula está lá (controle positivo: o instrumento vê)', saidas[nome].indexOf(PREFIXO) >= 0, true);
    const achou = saidas[nome].match(PROIBIDAS);
    conf(nome + ': nenhuma palavra do domínio', achou ? achou[0] : null, null);
  });
  conf('controle: a varredura acusa quando a palavra está lá', !!(PREFIXO + ' Domina').match(PROIBIDAS), true);

  // ================================================================
  secao('7b. O toque no domínio não mexe em trilha encerrada');
  /* Domina fechou o passo; a trilha é encerrada pelo botão de verdade; depois,
   * "Em andamento" na mesma aula. Antes do conserto, o passo da trilha
   * encerrada soltava com "voltou para a fila", sem Desfazer. */
  await abrirFicha(pag, 'Mapeamento');
  await esperar('o painel de trilhas', () => pag.evaluate(() => !!document.querySelector('#painel-trilhas .item-trilha-ativa .abrir-trilha')), v => v === true, 8000);
  await pag.evaluate(() => document.querySelector('#painel-trilhas .item-trilha-ativa .abrir-trilha').click());
  await esperar('a janela da trilha', () => pag.evaluate(() => !!document.querySelector('#modal-trilha.aberto #encerrar-trilha')), v => v === true, 8000);
  await pag.evaluate(() => document.querySelector('#encerrar-trilha').click());
  await esperar('a tela de encerrar', () => pag.evaluate(() => !!document.querySelector('#confirmar-encerramento')), v => v === true, 5000);
  await pag.evaluate(() => document.querySelector('#confirmar-encerramento').click());
  g = await esperar('trilha encerrada no banco', () => doBanco(pag), v => v.encerrada === true, 8000);
  conf('a trilha foi encerrada pelo botão, com o passo fechado por domínio', [g.valor.encerrada, g.valor.p1.feitoEm], [true, HOJE]);
  await fecharModais(pag);
  conf('a aula de hoje abre', await abrirAulaDeHoje(pag), true);
  await pag.evaluate(() => { document.querySelector('#aviso-texto').textContent = ''; });
  await tocar(pag, T1, 'andamento');
  g = await esperar('Em andamento gravado', () => doBanco(pag), v => v.dom[T1] === 'andamento', 5000);
  await pausa(300);
  g = await doBanco(pag);
  conf('"Em andamento" na aula NÃO solta o passo da trilha encerrada', [g.dom[T1], g.p1.feitoEm, g.p1.porDominio], ['andamento', HOJE, true]);
  conf('e o aviso não diz que o passo voltou para a fila',
    /voltou para a fila/.test(await pag.evaluate(() => document.querySelector('#aviso-texto').textContent)), false);
  await tocar(pag, T1, 'domina');
  g = await esperar('Domina gravado', () => doBanco(pag), v => v.dom[T1] === 'domina', 5000);
  conf('Domina de novo: a trilha encerrada segue como estava', [g.valor.p1.feitoEm, g.valor.encerrada], [HOJE, true]);
  /* E pelo Salvar (revisão do PR #90): o Salvar da aula roda a varredura
   * inteira, que soltava o passo da encerrada quando a aula perdia o Domina,
   * e a data de fechamento se perdia. */
  await tocar(pag, T1, 'domina');
  g = await esperar('Domina tirado', () => doBanco(pag), v => v.dom[T1] === '(sem campo)', 5000);
  conf('tirado o Domina da aula', g.valor.dom[T1], '(sem campo)');
  await pag.click('#salvar-aula');
  await esperar('aula salva e fechada', () => pag.evaluate(() => !document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);
  await pausa(400);
  g = await doBanco(pag);
  conf('Salvar: o passo da trilha encerrada continua fechado, com a data', [g.p1.feitoEm, g.p1.porDominio, g.encerrada], [HOJE, true, true]);
  const avisoSalvar = await pag.evaluate(() => document.querySelector('#aviso-texto').textContent);
  conf('e o aviso do Salvar não diz que passo voltou para a fila', /voltou para a fila|voltaram para a fila/.test(avisoSalvar), false);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  g = await doBanco(pag);
  conf('e depois de recarregar também', g.p1.feitoEm, HOJE);
  await fecharModais(pag);

  // ================================================================
  secao('8. Nenhum erro');
  conf('nenhum erro de página', pag.errosDePagina, []);
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
