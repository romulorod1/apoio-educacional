/* B7: 300 traços existentes não são redesenhados a cada movimento. */
'use strict';
const H = require('./_bib_navegador');
const { execFileSync } = require('child_process');
const amb = H.criarAmbiente(8863, 'b7_incremental');

(async () => {
  await amb.subir();
    const pagina = await amb.pagina();
    await pagina.setViewport({ width: 1280, height: 1000 });
    await H.abrirApp(pagina, amb.ORIGEM);
    const cdp = await pagina.target().createCDPSession();
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const anterior = execFileSync('git', ['show', 'c523743:draw.js'], { encoding: 'utf8' });
    const medidas = await pagina.evaluate(codigoAnterior => {
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'position:fixed;left:0;top:0;width:800px;height:800px';
      document.body.appendChild(canvas);
      const nota = Draw.notaVazia();
      for (let i = 0; i < 300; i++) {
        const pontos = [];
        for (let j = 0; j < 30; j++) pontos.push([30 + j * 4, 30 + i * 3, 2 + (j % 3)]);
        nota.paginas[0].itens.push({ t: 'traco', cor: '#1A1C1F', pontos });
      }
      const editor = new Draw.Editor(canvas, { nota });
      editor.desenhar();
      const antesDoTraco = canvas.toDataURL();
      editor.marcarPonto();
      const ativo = { t: 'traco', cor: '#1F3A5F', marcatexto: true, pontos: [[50, 90, 3], [60, 100, 3]] };
      editor.tracoAtual = ativo; nota.paginas[0].itens.push(ativo);
      editor.desenhar();
      const original = editor._desenharItem;
      let antigos = 0;
      editor._desenharItem = function (ctx, item) { if (item !== ativo) antigos++; return original.call(this, ctx, item); };
      const tempos = [];
      for (let i = 0; i < 20; i++) {
        ativo.pontos.push([61 + i, 101 + i, 3]);
        const inicio = performance.now(); editor.desenhar(); tempos.push(performance.now() - inicio);
      }
      const otimizado = canvas.toDataURL();
      const contagem = antigos;
      const atual = self.Draw;
      (0, eval)(codigoAnterior);
      const DrawAnterior = self.Draw;
      self.Draw = atual;
      const canvasAnterior = document.createElement('canvas');
      canvasAnterior.style.cssText = canvas.style.cssText;
      document.body.appendChild(canvasAnterior);
      const referencia = new DrawAnterior.Editor(canvasAnterior, { nota: JSON.parse(JSON.stringify(nota)) });
      referencia.tracoAtual = referencia.nota.paginas[0].itens[300];
      referencia.desenhar();
      const igualAnterior = otimizado === canvasAnterior.toDataURL();
      referencia.destruir(); canvasAnterior.remove();
      editor.cacheValido = false; editor.desenhar();
      const completo = canvas.toDataURL();
      editor._fecharTraco(); editor.desenhar();
      const fechado = canvas.toDataURL();
      editor.desfazer(); editor.desenhar();
      const desfeito = canvas.toDataURL();
      editor.destruir(); canvas.remove();
      tempos.sort((a, b) => a - b);
      return { antigos: contagem, p95: tempos[18], igual: otimizado === completo,
        fechamentoIgual: otimizado === fechado, desfazerIgual: antesDoTraco === desfeito, igualAnterior };
    }, anterior);
    console.log('   traços antigos redesenhados:', medidas.antigos, '; p95 com CPU 4x:', medidas.p95.toFixed(2), 'ms');
    H.conf('movimento não redesenha traços anteriores', medidas.antigos, 0);
    H.conf('cache e redesenho completo produzem a mesma imagem', medidas.igual, true);
    H.conf('desenho otimizado coincide com a versão anterior', medidas.igualAnterior, true);
    H.conf('fechar marca-texto mantém aparência e opacidade', medidas.fechamentoIgual, true);
    H.conf('desfazer devolve exatamente a imagem anterior', medidas.desfazerIgual, true);
    H.conf('p95 de 20 quadros abaixo de 16,7 ms com CPU 4x', medidas.p95 < 16.7, true);
})().then(H.fim(amb), H.fim(amb));
