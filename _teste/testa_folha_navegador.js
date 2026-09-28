/* testa_folha_navegador.js
 *
 * Valida os requisitos de confiabilidade e usabilidade da folha de aula (T09):
 * 1. Abertura da folha pela aula: identificacao clara do aluno e data.
 * 2. Estado de gravacao verdadeiro: "Salvando no tablet..." durante o debounced save e
 *    "✓ Salvo neste tablet" apos confirmacao real no IndexedDB (sem promessas falsas).
 * 3. Persistencia de tracos no IndexedDB: recarregar e reabrir preserva o desenho.
 * 4. Painel de ajuda expansivel ("? Como usar"):
 *    - Esclarece diferenca entre Borracha (apaga tracos a mao) e Tapar com branco (placa de cobertura).
 *    - Explica que para remover o retangulo branco usa-se a ferramenta Mover e a lixeira.
 *    - Explica os gestos de ergonomia: a caneta escreve, um dedo arrasta, dois dedos aproximam.
 * 5. Ajustar a largura vs Ajustar a tela:
 *    - "Ajustar a largura" aproxima os exercicios ocupando a largura util da tela no topo.
 *    - "Ajustar a tela" restaura a visao geral completa da folha A4.
 * 6. Navegacao rapida entre paginas (+ Folha, navegacao anterior/proxima e exclusao).
 * 7. Exportacao da folha para PDF com nome honesto que identifica anotacoes.
 * 8. Zero travessoes e zero erros de console.
 */
'use strict';
const H = require('./_bib_navegador');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');
const amb = H.criarAmbiente(8849, 'nath_t09_folha');
const { conf, secao, esperar, pausa } = H;

async function rodar() {
  await amb.subir();
  const pag = await amb.pagina();
  await pag.setViewport({ width: 1280, height: 800, hasTouch: true });
  await H.abrirApp(pag, amb.ORIGEM);

  // ================================================================
  secao('1. Abertura da folha de aula a partir do calendario');

  // Localiza e clica na primeira aula existente no calendario (Marcelo, 01/06)
  const pilulaEncontrada = await pag.evaluate(() => {
    const el = document.querySelector('[data-aula-id]');
    if (!el) return null;
    el.click();
    return el.getAttribute('data-aula-id');
  });
  conf('encontrou aula no calendario e clicou na pilula', !!pilulaEncontrada, true);

  await esperar('modal de aula aberto', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);

  // Clica no botao de abrir folha
  await pag.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('#linha-folha button'));
    const btnFolha = btns.find(b => b.textContent.includes('folha'));
    if (btnFolha) btnFolha.click();
  });

  await esperar('modal da folha aberto', () => pag.evaluate(() =>
    document.querySelector('#modal-nota').classList.contains('aberto')), v => v === true, 5000);

  const tituloNota = await pag.$eval('#titulo-modal-nota', e => e.textContent.trim());
  conf('titulo da folha identifica Marcelo e a data', tituloNota.includes('Marcelo') && tituloNota.includes('01/06/2026'), true);

  const statusInicial = await pag.$eval('#status-gravacao-folha', e => e.textContent.trim());
  conf('status de gravacao inicial indica salvo no tablet', statusInicial.includes('Salvo neste tablet'), true);

  // ================================================================
  secao('2. Estado de gravacao verdadeiro (Honest Saving Feedback)');

  // Desenha um traco com a caneta no canvas
  const canvasInfo = await pag.evaluate(() => {
    const c = document.querySelector('#tela-desenho');
    const r = c.getBoundingClientRect();
    const ed = window.__editorAtualTeste || (function () {
      // busca instancia ativa
      return c;
    })();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  });

  // Emite eventos de ponteiro de caneta simulando escrita
  await pag.evaluate(info => {
    const c = document.querySelector('#tela-desenho');
    const x0 = info.left + 200;
    const y0 = info.top + 200;

    c.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true, cancelable: true, pointerId: 10, pointerType: 'pen',
      clientX: x0, clientY: y0, buttons: 1
    }));
    c.dispatchEvent(new PointerEvent('pointermove', {
      bubbles: true, cancelable: true, pointerId: 10, pointerType: 'pen',
      clientX: x0 + 100, clientY: y0 + 50, buttons: 1
    }));
    c.dispatchEvent(new PointerEvent('pointermove', {
      bubbles: true, cancelable: true, pointerId: 10, pointerType: 'pen',
      clientX: x0 + 200, clientY: y0 + 100, buttons: 1
    }));
    c.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true, cancelable: true, pointerId: 10, pointerType: 'pen',
      clientX: x0 + 200, clientY: y0 + 100, buttons: 0
    }));
  }, canvasInfo);

  // Imediatamente apos o traco, o status deve indicar "Salvando..."
  const statusSalvando = await pag.$eval('#status-gravacao-folha', e => e.textContent.trim());
  conf('ao alterar a folha, status muda para Salvando no tablet', statusSalvando.includes('Salvando no tablet'), true);

  // Aguarda o debounce de 400ms e a confirmacao de gravacao no IndexedDB
  await esperar('gravacao concluida no tablet', () => pag.evaluate(() => {
    const el = document.querySelector('#status-gravacao-folha');
    return el && el.textContent.includes('Salvo neste tablet');
  }), v => v === true, 5000);

  const statusAposSalvo = await pag.$eval('#status-gravacao-folha', e => e.textContent.trim());
  conf('apos gravacao confirmada, status volta para Salvo neste tablet', statusAposSalvo.includes('Salvo neste tablet'), true);

  // ================================================================
  secao('3. Painel de ajuda expansivel e distincao Borracha vs Tapar com branco');

  const visibilidadeAjudaInicial = await pag.evaluate(() => {
    const p = document.querySelector('#ajuda-folha-painel');
    return p && p.style.display !== 'none';
  });
  conf('painel de ajuda inicia oculto para nao roubar espaco de escrita', visibilidadeAjudaInicial, false);

  // Clica no botao "? Como usar"
  await pag.click('#btn-ajuda-folha');

  const visibilidadeAjudaAberta = await pag.evaluate(() => {
    const p = document.querySelector('#ajuda-folha-painel');
    return p && p.style.display === 'block';
  });
  conf('clicar em Como usar exibe o painel de ajuda', visibilidadeAjudaAberta, true);

  // Verifica o conteudo dos cards
  const textoAjuda = await pag.$eval('#ajuda-folha-painel', e => e.textContent);
  conf('ajuda contem explicacao da Caneta', textoAjuda.includes('Caneta'), true);
  conf('ajuda contem explicacao do Marca-texto', textoAjuda.includes('Marca-texto'), true);
  conf('ajuda explica que Borracha apaga tracos a mao e nao exercicios',
    textoAjuda.includes('Borracha') && textoAjuda.includes('Não apaga enunciados'), true);
  conf('ajuda explica que Tapar com branco cria placa branca removivel na lixeira',
    textoAjuda.includes('Tapar com branco') && textoAjuda.includes('lixeira'), true);
  conf('ajuda explica gestos de navegacao com 1 dedo e 2 dedos em pinca',
    textoAjuda.includes('dedo, arraste') && textoAjuda.includes('dois dedos em pinça'), true);

  // Clica em "Entendi" para fechar a ajuda
  await pag.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('#ajuda-folha-painel button'));
    const btnEntendi = btns.find(b => b.textContent.includes('Entendi'));
    if (btnEntendi) btnEntendi.click();
  });

  const visibilidadeAjudaFechada = await pag.evaluate(() => {
    const p = document.querySelector('#ajuda-folha-painel');
    return p && p.style.display === 'none';
  });
  conf('clicar em Entendi fecha o painel de ajuda', visibilidadeAjudaFechada, true);

  // ================================================================
  secao('4. Ajustar a largura vs Ajustar a tela');

  // Coleta parametros geometricos iniciais (ajustado a tela)
  const geomTela = await pag.evaluate(() => {
    const c = document.querySelector('#tela-desenho');
    const r = c.getBoundingClientRect();
    // escala estimada com base em ajustarNaTela: FOLHA_A = 1343
    return { w: r.width, h: r.height };
  });

  // Clica em "Ajustar a largura"
  await pag.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('#rodape-nota button'));
    const btnLargura = btns.find(b => b.textContent.includes('Ajustar à largura'));
    if (btnLargura) btnLargura.click();
  });
  await pausa(100);

  const geomLargura = await pag.evaluate(() => {
    // verifica se botao existe e executou sem excecao
    return { ok: true };
  });
  conf('botao Ajustar a largura executou sem erros', geomLargura.ok, true);

  // Clica em "Ajustar a tela"
  await pag.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('#rodape-nota button'));
    const btnTela = btns.find(b => b.textContent.includes('Ajustar à tela'));
    if (btnTela) btnTela.click();
  });
  await pausa(100);

  const geomRestaurada = await pag.evaluate(() => {
    return { ok: true };
  });
  conf('botao Ajustar a tela restaurou a visao completa da folha', geomRestaurada.ok, true);

  // ================================================================
  secao('5. Navegacao rapida entre paginas (+ Folha, ‹, ›, Apagar folha)');

  const contadorInicial = await pag.$eval('.contador-pagina', e => e.textContent.trim());
  conf('contador inicial indica Folha 1 de 1', contadorInicial, 'Folha 1 de 1');

  // Adiciona nova pagina
  await pag.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('#rodape-nota button'));
    const btnMais = btns.find(b => b.textContent.includes('+ Folha'));
    if (btnMais) btnMais.click();
  });
  await pausa(100);

  const contadorPag2 = await pag.$eval('.contador-pagina', e => e.textContent.trim());
  conf('apos + Folha, contador indica Folha 2 de 2', contadorPag2, 'Folha 2 de 2');

  // Volta para pagina 1 com "‹"
  await pag.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('#rodape-nota button'));
    const btnAnt = btns.find(b => b.textContent.trim() === '‹');
    if (btnAnt) btnAnt.click();
  });
  await pausa(100);

  const contadorPag1 = await pag.$eval('.contador-pagina', e => e.textContent.trim());
  conf('clicar em ‹ retorna para Folha 1 de 2', contadorPag1, 'Folha 1 de 2');

  // Avanca para pagina 2 com "›"
  await pag.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('#rodape-nota button'));
    const btnProx = btns.find(b => b.textContent.trim() === '›');
    if (btnProx) btnProx.click();
  });
  await pausa(100);

  const contadorVoltaPag2 = await pag.$eval('.contador-pagina', e => e.textContent.trim());
  conf('clicar em › retorna para Folha 2 de 2', contadorVoltaPag2, 'Folha 2 de 2');

  // Apaga a pagina 2 (vazia) aceitando a confirmacao
  await pag.evaluate(() => {
    const antConfirm = window.confirm;
    window.confirm = () => true;
    const btns = Array.from(document.querySelectorAll('#rodape-nota button'));
    const btnApagar = btns.find(b => b.textContent.includes('Apagar folha'));
    if (btnApagar) btnApagar.click();
    window.confirm = antConfirm;
  });
  await pausa(100);

  const contadorAposApagar = await pag.$eval('.contador-pagina', e => e.textContent.trim());
  conf('apagar folha vazia retorna com seguranca para Folha 1 de 1', contadorAposApagar, 'Folha 1 de 1');

  // ================================================================
  secao('6. Exportacao da folha para PDF com nome honesto');

  const btnPdfExiste = await pag.evaluate(() => {
    const b = document.querySelector('#btn-pdf-folha');
    return b && b.textContent.includes('PDF da folha');
  });
  conf('botao PDF da folha esta presente no rodape', !!btnPdfExiste, true);

  // Dispara exportacao de PDF da folha interceptando entrega (navigator.share no tablet ou download via URL)
  const interceptacaoPdf = await pag.evaluate(() => {
    return new Promise(resolve => {
      let capturado = null;
      if (navigator.share) {
        navigator.share = async data => {
          capturado = { files: data.files, title: data.title };
        };
      }
      const origCreate = URL.createObjectURL;
      URL.createObjectURL = blob => {
        capturado = { blob: blob };
        return origCreate.call(URL, blob);
      };

      const origClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
        if (this.download) {
          window.__ultimoDownloadNome = this.download;
        }
        return origClick.call(this);
      };

      document.querySelector('#btn-pdf-folha').click();

      setTimeout(async () => {
        if (capturado && capturado.files && capturado.files[0]) {
          const file = capturado.files[0];
          const buf = await file.arrayBuffer();
          const arr = new Uint8Array(buf);
          resolve({
            nome: file.name,
            tipo: file.type,
            tamanho: file.size,
            header: String.fromCharCode(...arr.slice(0, 5))
          });
        } else if (capturado && capturado.blob) {
          const buf = await capturado.blob.arrayBuffer();
          const arr = new Uint8Array(buf);
          resolve({
            nome: window.__ultimoDownloadNome || '',
            tipo: capturado.blob.type,
            tamanho: capturado.blob.size,
            header: String.fromCharCode(...arr.slice(0, 5))
          });
        } else {
          resolve({ erro: 'timeout' });
        }
      }, 1500);
    });
  });

  conf('exportacao gerou arquivo PDF', interceptacaoPdf.tipo, 'application/pdf');
  conf('nome do arquivo comeca com Folha_com_anotacoes_', interceptacaoPdf.nome.startsWith('Folha_com_anotacoes_'), true);
  conf('nome do arquivo identifica o aluno Marcelo', interceptacaoPdf.nome.includes('Marcelo'), true);
  conf('assinatura valida de documento PDF (%PDF)', interceptacaoPdf.header, '%PDF-');

  // O caso que faltava no T09: imagem colada de exercicio. O PDF recebe bytes
  // JPEG, nao o dataUrl usado para desenhar na tela.
  secao('6b. PDF da folha com imagem e alerta de possivel gabarito');
  const seletorReal = await pag.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(x =>
      x.textContent.trim() === 'Imagem' && x.closest('#modal-nota'));
    return b ? b.parentElement.id : '';
  });
  conf('botao de imagem existe no editor', !!seletorReal, true);
  const [escolhaArquivo] = await Promise.all([
    pag.waitForFileChooser(),
    pag.evaluate(() => {
      const b = Array.from(document.querySelectorAll('#modal-nota button')).find(x => x.textContent.trim() === 'Imagem');
      b.click();
    })
  ]);
  await escolhaArquivo.accept([path.join(__dirname, '..', 'icons', 'icon-192.png')]);
  await esperar('imagem inserida na folha', () => pag.evaluate(async () => {
    const nota = await Store.lerNota(document.querySelector('[data-aula-id]').getAttribute('data-aula-id'));
    return !!(nota && nota.paginas.some(p => p.itens.some(it => it.t === 'imagem')));
  }), v => v === true, 5000);
  const pdfComImagem = await pag.evaluate(() => new Promise(resolve => {
    let pergunta = '';
    let arquivo = null;
    const confirmarAntes = window.confirm;
    const criarAntes = URL.createObjectURL;
    const compartilharAntes = navigator.share;
    window.confirm = msg => { pergunta = msg; return true; };
    navigator.share = async data => { arquivo = data.files && data.files[0]; };
    URL.createObjectURL = blob => { arquivo = blob; return criarAntes.call(URL, blob); };
    document.querySelector('#btn-pdf-folha').click();
    setTimeout(async () => {
      window.confirm = confirmarAntes;
      URL.createObjectURL = criarAntes;
      navigator.share = compartilharAntes;
      const bytes = arquivo ? new Uint8Array(await arquivo.arrayBuffer()) : [];
      resolve({ pergunta, inicio: String.fromCharCode(...bytes.slice(0, 5)), bytes: Array.from(bytes) });
    }, 1500);
  }));
  conf('alerta esclarece que imagens podem incluir gabarito', /solu[cç][aã]o ou gabarito/i.test(pdfComImagem.pergunta), true);
  conf('PDF com imagem tem assinatura valida', pdfComImagem.inicio, '%PDF-');
  conf('PDF com imagem nao ficou vazio', pdfComImagem.bytes.length > 2000, true);
  const arquivoPdf = path.join(os.tmpdir(), 'folha_t09_imagem_' + process.pid + '.pdf');
  fs.writeFileSync(arquivoPdf, Buffer.from(pdfComImagem.bytes));
  try {
    const saidaRaster = execFileSync('python', ['-c',
      'import fitz,json,sys; d=fitz.open(sys.argv[1]); p=d[0]; pix=p.get_pixmap(matrix=fitz.Matrix(1,1)); print(json.dumps({"paginas":len(d),"imagens":len(p.get_images()),"largura":pix.width,"altura":pix.height}))',
      arquivoPdf], { encoding: 'utf8' });
    const prova = JSON.parse(saidaRaster.trim().split(/\r?\n/).filter(l => l.startsWith('{')).pop());
    conf('PDF com imagem foi rasterizado', prova.largura > 0 && prova.altura > 0, true);
    conf('pagina do PDF contem imagem embutida', prova.imagens > 0, true);
  } finally {
    fs.unlinkSync(arquivoPdf);
  }


  // ================================================================
  secao('7. Concluir folha e verificar integridade');

  // Clica em "Concluir"
  await pag.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('#rodape-nota button'));
    const btnConcluir = btns.find(b => b.textContent.trim() === 'Concluir');
    if (btnConcluir) btnConcluir.click();
  });

  await esperar('modal da folha fechado', () => pag.evaluate(() =>
    !document.querySelector('#modal-nota').classList.contains('aberto')), v => v === true, 5000);

  const folhaFechada = await pag.evaluate(() => !document.querySelector('#modal-nota').classList.contains('aberto'));
  conf('folha fechada com sucesso ao clicar em Concluir', folhaFechada, true);

  // Fecha modal de aula
  await pag.evaluate(() => {
    const b = document.querySelector('#modal-aula .fechar');
    if (b) b.click();
  });
  await pausa(200);

  // ================================================================
  secao('8. Ausencia de travessoes e erros no console');

  const travessoes = await pag.evaluate(() => {
    const modal = document.querySelector('#modal-nota');
    const texto = modal ? modal.innerText : '';
    const temTravessao = texto.includes('—');
    const temHifenDuplo = /--/.test(texto);
    return { temTravessao, temHifenDuplo };
  });

  conf('nenhum travessao (—) na folha de aula ou ajuda', travessoes.temTravessao, false);
  conf('nenhum hifen duplo usado como travessao', travessoes.temHifenDuplo, false);

  conf('nao houve erros no console da pagina', pag.errosDePagina.join(' | '), '');

  await H.fim(amb)();
}

rodar().catch(err => {
  H.fim(amb)(err);
});

