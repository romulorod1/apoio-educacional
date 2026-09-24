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
 *   node _teste/testa_folha_impressa_igual.js [--guarda-a-prova <pasta>]
 *   node _teste/testa_folha_impressa_igual.js --envenenado-ordem
 *
 * Com --guarda-a-prova, grava a folha do FIXTURE na pasta, com nome que diz o
 * que ela é. Ela NÃO vai para o marco visual: ver a nota da opção, embaixo.
 *
 * O ALCANCE DESTA PROVA, ESCRITO ANTES QUE ALGUÉM SE ANIME COM O VERDE:
 *
 * CONTRA O DIFF QUE ELA ESTREIA, ESTA PROVA É INERTE. O pdf.js só ganhou um
 * ramo para um tipo de item (`tapar`) que folha nenhuma de antes tem; sem item
 * desse tipo a variável `tapar` fica vazia e o `if (tapar)` não chega a emitir
 * operador. Byte igual era o ÚNICO resultado possível. Dizer "provei que não
 * mudou" sem dizer "e nesta versão não tinha como mudar" é o começo da régua
 * que ninguém mais questiona.
 *
 * O que ela vale, então, é o DEPOIS: ela é o guarda que fica de pé para o
 * próximo diff, quando alguém mexer na ordem de desenho por um motivo
 * qualquer. E para isso ela precisa MORDER, o que é outra coisa de ter
 * controle de medidor. Por isso existe o `--envenenado-ordem`: ele troca a
 * ordem DENTRO do pdf.js de hoje, pondo o texto antes da imagem, e a prova tem
 * de gritar com a contagem de pixels na mão. A folha foi construída para
 * discordar exatamente nesse ponto; se ela não gritar, o fixture não é tão
 * assimétrico quanto quem o escreveu pensa.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const ANTES = 'd80bb90';          // o aplicativo publicado, antes da B10
/* ONDE GUARDAR OS ARTEFATOS DA PROVA, e por que a opção mudou de nome.
 *
 * Ela se chamava `--prints` e escrevia dentro da pasta do MARCO VISUAL, com o
 * nome do print seguinte da série. O resultado foi que a folha desta prova (um
 * fixture com retângulo preto opaco, um ponto de caneta solto e duas frases que
 * descrevem o cenário testado) foi parar no meio das telas mandadas ao olho de
 * fora cego, e ele gastou três parágrafos analisando artefato nosso com
 * seriedade. Estava certo, e a culpa não era dele: toda atenção gasta num
 * artefato de teste é atenção que não foi gasta no produto, e o olho de fora
 * não tem como saber a diferença, porque é por não saber que ele vale.
 *
 * Fixture de prova serve à prova e fica na prova. A opção continua existindo,
 * porque olhar o que a prova mediu é legítimo, mas o nome do arquivo agora diz
 * o que ele é e a pasta é escolhida por quem chama. */
const I_PROVA = process.argv.indexOf('--guarda-a-prova');
const PROVA = I_PROVA !== -1 ? process.argv[I_PROVA + 1] : null;
const VENENO_ORDEM = process.argv.indexOf('--envenenado-ordem') !== -1;

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
  let pdfHoje = path.join(RAIZ, 'pdf.js');

  /* O VENENO DA ORDEM: no pdf.js de hoje, as imagens deixam de ser desenhadas
   * primeiro e passam a ser desenhadas por último, depois dos textos. É
   * exatamente a inversão que a unificação das camadas existe para impedir, e
   * é a que a folha desta prova foi construída para denunciar: o primeiro
   * texto dela está DENTRO do retângulo da imagem, então invertida a ordem ele
   * some debaixo do recorte. */
  if (VENENO_ORDEM) {
    const fonte = fs.readFileSync(pdfHoje, 'utf8');
    const NL = fonte.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
    const desenha = [
      '      doc.registraImagem(it.ref, info.bytes, info.w, info.h);',
      '      doc.desenhaImagem(it.ref, x0 + it.x * escala, y0 + altura - (it.y + it.h) * escala,',
      '        it.w * escala, it.h * escala);'].join(NL);
    const guarda = '      _adiadas.push(it);';
    const marcaTracos = '    desenhaTracos(doc, itens, x0, y0, largura, altura, escala);';
    const solta = [
      '    _adiadas.forEach(function (it) {',
      '      var info = imagens && imagens[it.ref];',
      '      doc.registraImagem(it.ref, info.bytes, info.w, info.h);',
      '      doc.desenhaImagem(it.ref, x0 + it.x * escala, y0 + altura - (it.y + it.h) * escala,',
      '        it.w * escala, it.h * escala);',
      '    });',
      marcaTracos].join(NL);
    /* AS TRÊS ÂNCORAS SÃO CONTADAS, e não só duas. A terceira passava trocada
     * sem contagem, e uma âncora que deixa de casar e não reclama é um veneno
     * que deixou de envenenar em silêncio, que é o pior defeito que uma prova
     * pode ter. Achado pela segunda lente cega do PR #57. */
    const ancoraItens = '    var itens = pagina.itens || [];';
    conf('a âncora do desenho da imagem casa exatamente uma vez', fonte.split(desenha).length - 1, 1);
    conf('a âncora dos traços casa exatamente uma vez', fonte.split(marcaTracos).length - 1, 1);
    conf('a âncora da lista de itens casa exatamente uma vez', fonte.split(ancoraItens).length - 1, 1);
    const envenenado = fonte
      .split(desenha).join(guarda)
      .split(ancoraItens).join(ancoraItens + NL + '    var _adiadas = [];')
      .split(marcaTracos).join(solta);
    conf('o veneno mudou mesmo o pdf.js', envenenado !== fonte ? 'diferente' : 'IGUAL', 'diferente');
    const alvo = path.join(tmp, 'pdf_envenenado.js');
    fs.writeFileSync(alvo, envenenado);
    pdfHoje = alvo;
  }

  // o controle: os dois pdf.js TÊM de ser diferentes, senão a prova compara
  // um arquivo com ele mesmo e passa sem medir nada
  const fonteAntes = fs.readFileSync(pdfAntes, 'utf8');
  const fonteHoje = fs.readFileSync(pdfHoje, 'utf8');
  conf('o pdf.js de hoje é DIFERENTE do de ' + ANTES, fonteAntes === fonteHoje ? 'igual' : 'diferente', 'diferente');
  conf('e a diferença é a camada do tapar', /tapar/.test(fonteHoje) && !/tapar/.test(fonteAntes), true);
  /* O ALCANCE, MEDIDO E NÃO SUPOSTO: contra este diff a prova é inerte, porque
   * a folha de antes não tem item do tipo `tapar` e o ramo novo não chega a
   * emitir operador nenhum. A contagem abaixo é o que transforma essa frase de
   * opinião em número, e é ela que impede alguém de ler o verde como mais do
   * que ele é. */
  const comTapar = folha()[0].paginas[0].itens.filter(i => i.t === 'tapar').length;
  conf('a folha de antes não tem nenhum item do tipo tapar', comTapar, 0);

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
  if (VENENO_ORDEM) conf('VENENO: a folha impressa MUDOU byte a byte', iguais, false);
  else conf('e BYTE A BYTE igual, fora a data de criação', iguais, true);

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
    const saidaPng = PROVA && fs.existsSync(PROVA)
      ? path.join(PROVA, 'fixture_da_prova_folha.png') : path.join(tmp, 'folha.png');
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
    if (VENENO_ORDEM) {
      /* A LINHA DA REPROVAÇÃO. Invertida a ordem, o texto que está dentro do
       * retângulo da imagem some debaixo dela, e a asserção do caso normal
       * ("zero diferentes") cai com o número na mão. */
      console.log('   A ASSERÇÃO DO CASO NORMAL REPROVARIA ASSIM:');
      console.log('   FALHA e PIXEL A PIXEL não há uma única diferença a 200 dpi  ' +
        '[obtido: ' + medida.diferentes + ' | esperado: 0]');
      conf('VENENO: a asserção MORDE, e a diferença é aos milhares',
        medida.diferentes > 1000, true);
      conf('VENENO: e o pior canal mostra que o desenho mudou de verdade, não por arredondamento',
        medida.pior_canal > 100, true);
    } else {
      conf('e PIXEL A PIXEL não há uma única diferença a 200 dpi', medida.diferentes, 0);
    }
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

  if (PROVA) {
    if (!fs.existsSync(PROVA) || !fs.statSync(PROVA).isDirectory()) {
      console.log('   a pasta da prova não existe, e este roteiro não cria pasta: ' + PROVA);
      falhas++;
    } else {
      fs.copyFileSync(path.join(tmp, 'hoje.pdf'), path.join(PROVA, 'fixture_da_prova_folha.pdf'));
      console.log('   fixture_da_prova_folha.pdf e fixture_da_prova_folha.png');
    }
  }

  console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e && e.stack || e); process.exit(1); });
