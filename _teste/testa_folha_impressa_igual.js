/* testa_folha_impressa_igual.js
 *
 * A FOLHA IMPRESSA NÃO MUDOU, e isto é medido, não afirmado.
 *
 * A B10 unificou a ordem das camadas da folha: o canvas passou a desenhar na
 * mesma ordem em que o PDF sempre desenhou (imagem, tapar, texto, traço). A
 * unificação foi pelo lado da TELA, de propósito, porque o papel é o artefato
 * que a Nathália entrega ao aluno e não pode mudar debaixo dela.
 *
 * Mas "não pode mudar" é promessa, e promessa não confere nada. Esta prova
 * gera a MESMA folha com o pdf.js de hoje e com o pdf.js do `d80bb90` (o
 * aplicativo publicado, antes da B10) e compara. Compara duas vezes, porque
 * as duas comparações respondem coisas diferentes:
 *
 *   1. BYTE A BYTE, fora o que muda por construção em todo PDF (a data de
 *      criação). Byte igual é a resposta mais forte que existe: se os bytes
 *      são os mesmos, não há pixel que possa diferir.
 *   2. PIXEL A PIXEL, rasterizando as duas páginas. É a resposta que a
 *      pergunta pede ao pé da letra, e ela pega o caso em que os bytes diferem
 *      por reordenação inócua e o desenho continua igual.
 *
 * A FOLHA EXERCITA A SOBREPOSIÇÃO, que é o único lugar onde a ordem das
 * camadas pode aparecer: imagem embaixo, texto por cima dela, traço cruzando
 * os dois, e um texto ANTES da imagem no vetor, que é o caso em que a ordem do
 * vetor e a ordem das camadas discordam. Sem esse último item a folha não
 * mediria nada: com todo mundo na mesma ordem nos dois esquemas, qualquer um
 * dos dois daria o mesmo desenho.
 *
 *   node _teste/testa_folha_impressa_igual.js [--prints <pasta>]
 *
 * Com --prints, grava as duas páginas rasterizadas na pasta, com nomes
 * neutros, para o marco visual.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const ANTES = 'd80bb90';          // o aplicativo publicado, antes da B10
const I_PRINTS = process.argv.indexOf('--prints');
const PRINTS = I_PRINTS !== -1 ? process.argv[I_PRINTS + 1] : null;

let passes = 0, falhas = 0;
function conf(nome, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (ok) { passes++; console.log('  OK    ' + nome); }
  else { falhas++; console.log('  FALHA ' + nome + '  [obtido: ' + JSON.stringify(obtido) + ' | esperado: ' + JSON.stringify(esperado) + ']'); }
  return ok;
}

/* A FOLHA. Um só objeto, usado pelos dois lados, para a comparação ser sobre o
 * código e não sobre a peça. */
function folha() {
  const pontos = [];
  for (let i = 0; i <= 40; i++) {
    const x = 80 + i * 21;
    pontos.push([x, 620 + Math.round(70 * Math.sin(i / 3)), 2 + (i % 5)]);
  }
  return [{
    data: '2026-09-24',
    paginas: [{
      fundo: 'pautado',
      itens: [
        // ANTES da imagem no vetor: é este que faz a ordem do vetor discordar
        // da ordem das camadas, e sem ele a folha não mede nada
        { t: 'texto', x: 70, y: 150, tam: 30, cor: '#B4453C', txt: 'texto escrito antes da imagem entrar' },
        { t: 'imagem', ref: 'recorte-1', x: 60, y: 120, w: 600, h: 300 },
        { t: 'texto', x: 90, y: 250, tam: 34, cor: '#1F3A5F', txt: 'texto por cima do recorte' },
        { t: 'traco', cor: '#2E7D6B', pontos: pontos },
        { t: 'traco', cor: '#C9A961', marcatexto: true, pontos: [[70, 260, 6], [640, 268, 6]] },
        { t: 'traco', cor: '#1A1C1F', pontos: [[500, 900, 9]] }
      ]
    }]
  }];
}

/* Um JPEG mínimo de verdade, para a imagem da folha ter bytes reais. É o mesmo
 * nos dois lados, e sai daqui e não de um arquivo, para a prova não depender
 * de nada fora do repositório. */
const JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a' +
  'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAAQABABAREA/8QAHwAAAQUBAQEB' +
  'AQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1Fh' +
  'ByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZ' +
  'WmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXG' +
  'x8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oACAEBAAA/APn+iiiiiiiiiiiiiv/Z',
  'base64');

function geraCom(arquivoPdfJs) {
  const raiz = {};
  const codigo = fs.readFileSync(arquivoPdfJs, 'utf8');
  // o pdf.js é um IIFE que pendura PDFGen na raiz que recebe
  new Function('self', codigo + '\nreturn self;')(raiz);
  const Core = require(path.join(RAIZ, 'core.js'));
  const db = {
    alunos: [{ id: 'a1', nome: 'Aluno de Prova', valorHora: 100, cor: '#1F3A5F' }],
    aulas: [{ id: 'x1', alunoId: 'a1', data: '2026-09-10', hora: '08:00', duracaoMin: 60,
      status: 'realizada', cobravel: true }],
    resumos: []
  };
  const f = Core.calcularFechamento(db, 'a1', '2026-09');
  return raiz.PDFGen.gerarFechamento(f, {
    incluirNotas: true, notas: folha(),
    imagens: { 'recorte-1': { bytes: JPEG, w: 16, h: 16 } },
    sempreResumo: true
  });
}

/* Todo PDF carrega a data de criação, que muda a cada corrida por construção.
 * Zerar só ela é o que separa "o desenho mudou" de "o relógio andou". */
function semData(bytes) {
  const b = Buffer.from(bytes);
  const s = b.toString('latin1').replace(/\(D:\d{14}[^)]*\)/g, '(D:00000000000000)');
  return Buffer.from(s, 'latin1');
}

(async () => {
  console.log('A folha impressa não mudou: ' + ANTES + ' contra o HEAD de hoje\n');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'folha_igual_'));
  process.on('exit', () => { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* ok */ } });

  const pdfAntes = path.join(tmp, 'pdf_antes.js');
  fs.writeFileSync(pdfAntes, execFileSync('git', ['show', ANTES + ':pdf.js'],
    { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
  const pdfHoje = path.join(RAIZ, 'pdf.js');

  // o controle: os dois pdf.js TÊM de ser diferentes, senão a prova compara
  // um arquivo com ele mesmo e passa sem medir nada
  const fonteAntes = fs.readFileSync(pdfAntes, 'utf8');
  const fonteHoje = fs.readFileSync(pdfHoje, 'utf8');
  conf('o pdf.js de hoje é DIFERENTE do de ' + ANTES, fonteAntes === fonteHoje ? 'igual' : 'diferente', 'diferente');
  conf('e a diferença é a camada do tapar', /tapar/.test(fonteHoje) && !/tapar/.test(fonteAntes), true);

  const bAntes = geraCom(pdfAntes);
  const bHoje = geraCom(pdfHoje);
  fs.writeFileSync(path.join(tmp, 'antes.pdf'), Buffer.from(bAntes));
  fs.writeFileSync(path.join(tmp, 'hoje.pdf'), Buffer.from(bHoje));
  console.log('   bytes: ' + ANTES + ' ' + bAntes.length + ', hoje ' + bHoje.length);

  // 1. byte a byte
  const sa = semData(bAntes), sh = semData(bHoje);
  conf('a folha impressa sai com o MESMO tamanho', bHoje.length, bAntes.length);
  const iguais = Buffer.compare(sa, sh) === 0;
  if (!iguais) {
    let i = 0;
    while (i < Math.min(sa.length, sh.length) && sa[i] === sh[i]) i++;
    console.log('   primeiro byte diferente em ' + i + ': ' +
      JSON.stringify(sa.slice(Math.max(0, i - 40), i + 40).toString('latin1')) + ' contra ' +
      JSON.stringify(sh.slice(Math.max(0, i - 40), i + 40).toString('latin1')));
  }
  conf('e BYTE A BYTE igual, fora a data de criação', iguais, true);

  // 2. pixel a pixel, rasterizando as duas com o PyMuPDF
  const pgFolha = (() => {
    /* A folha é a ÚLTIMA página do fechamento, e achar o número contando as
     * páginas do documento é mais seguro do que cravar um índice: se o
     * fechamento ganhar uma página um dia, um índice cravado passaria a
     * comparar a página errada e continuaria dizendo "igual". */
    const s = Buffer.from(bHoje).toString('latin1');
    const n = (s.match(/\/Type\s*\/Page[^s]/g) || []).length;
    return n - 1;
  })();
  console.log('   a folha é a página ' + (pgFolha + 1) + ' do documento');
  let medida = null;
  try {
    const saidaPng = PRINTS && fs.existsSync(PRINTS) ? path.join(PRINTS, 'b10_09.png') : path.join(tmp, 'folha.png');
    const r = execFileSync('python', [path.join(__dirname, '_rasteriza_compara.py'),
      path.join(tmp, 'antes.pdf'), path.join(tmp, 'hoje.pdf'), String(pgFolha), '--png', saidaPng],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    medida = JSON.parse(r.trim().split('\n').pop());
  } catch (e) {
    medida = { erro: String((e && e.message) || e).slice(0, 200) };
  }
  console.log('   raster: ' + JSON.stringify(medida));
  if (medida && medida.erro) {
    /* Sem rasterizador não se inventa um resultado: a comparação de pixel fica
     * DECLARADA como não feita, e isso é uma FALHA e não um silêncio, porque a
     * afirmação pedida era sobre pixel. */
    conf('a comparação de PIXEL rodou', medida.erro, '(sem erro)');
  } else {
    conf('a folha rasterizou nas duas versões, no mesmo tamanho', !!(medida && medida.largura > 0), true);
    conf('e PIXEL A PIXEL não há uma única diferença a 200 dpi', medida.diferentes, 0);
    /* O CONTROLE DO MEDIDOR: ele tem de saber acusar. Comparada com a página
     * ANTERIOR do mesmo documento, a mesma medida tem de achar diferença aos
     * milhares; sem este par, "zero diferentes" não se distingue de um medidor
     * que devolve zero para tudo. */
    let controle = null;
    try {
      const r2 = execFileSync('python', [path.join(__dirname, '_rasteriza_compara.py'),
        path.join(tmp, 'antes.pdf'), path.join(tmp, 'hoje.pdf'), String(Math.max(0, pgFolha - 1))],
      { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
      const outraPagina = JSON.parse(r2.trim().split('\n').pop());
      // a página anterior é a MESMA nos dois documentos, então aqui o controle
      // tem de ser o contrário: comparar a folha com a OUTRA página
      const r3 = execFileSync('python', [path.join(__dirname, '_rasteriza_compara_controle.py'),
        path.join(tmp, 'hoje.pdf'), String(pgFolha), String(Math.max(0, pgFolha - 1))],
      { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
      controle = JSON.parse(r3.trim().split('\n').pop());
      console.log('   controle (a folha contra outra página do mesmo PDF): ' + JSON.stringify(controle));
      void outraPagina;
    } catch (e) {
      controle = { erro: String((e && e.message) || e).slice(0, 200) };
    }
    conf('e o medidor sabe acusar: duas páginas diferentes dão diferença aos milhares',
      !!(controle && controle.diferentes > 1000), true);
  }

  if (PRINTS) {
    if (!fs.existsSync(PRINTS) || !fs.statSync(PRINTS).isDirectory()) {
      console.log('   a pasta de prints não existe, e este roteiro não cria pasta: ' + PRINTS);
      falhas++;
    } else {
      fs.copyFileSync(path.join(tmp, 'hoje.pdf'), path.join(PRINTS, 'b10_folha.pdf'));
      console.log('   b10_folha.pdf e b10_09.png');
    }
  }

  console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e && e.stack || e); process.exit(1); });
