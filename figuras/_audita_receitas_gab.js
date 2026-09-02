/* Mede a camada de resposta da incognita: onde o valor achado cai em relacao ao
 * arco que ele responde. Regra da casa: nunca usar travessao. */
const PDFGen = require('../pdf.js');
const FigBase = require('./base.js');
function n2(v){return (Math.round(v*100)/100).toFixed(2);}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
const casos = process.argv.slice(2).length ? process.argv.slice(2) : [
  '@fig triangulo id=t3 angulo=52 angulo=61 incognita=C',
  '@fig triangulo id=t4 angulo=38 angulo=104 incognita=C giro=22',
  '@fig triangulo id=t8 angulo=50 externo=C;125 incognita=B',
  '@fig triangulo id=t9 angulo=40 incognita=B incognita=C congruentes=b;c'
];
casos.forEach(function(txt){
  const doc = new PDFGen.Doc(); doc.novaPagina();
  const d = FigBase.lerDiretiva(txt);
  doc.figura(d, {});
  const dg = FigBase.lerDiretiva(txt); dg.fase = 'gabarito';
  const r = doc.figura(dg, {});
  const med = r.medido || {};
  console.log('\n=== ' + txt + '   [gabarito]  marcasAtivas=' + r.marcasAtivas);
  (med.arcos||[]).forEach(function(a,i){
    console.log('  arco '+i+': centro ('+n2(a.cx)+', '+n2(a.cy)+') abertura='+n2(a.abertura)+' raio='+n2(a.raio));
  });
  (med.textos||[]).forEach(function(t){
    const c = {x: t.cx!=null?t.cx:t.x, y: t.cy!=null?t.cy:t.y};
    let perto = Infinity, melhor = null;
    (med.arcos||[]).forEach(function(a){
      let dd = Infinity; (a.pontos||[]).forEach(function(p){ dd = Math.min(dd, dist(p,c)); });
      if (dd < perto) { perto = dd; melhor = a; }
    });
    const alcance = 12 + (t.largura||0)/2;
    console.log('  texto "'+t.txt+'" larg='+n2(t.largura)+' centro ('+n2(c.x)+', '+n2(c.y)+
      ')  arco a '+n2(perto)+' pt (alcance '+n2(alcance)+')'+
      (melhor?' varrendo '+n2(melhor.abertura):'') + (perto>alcance?'   >>> SOLTO':''));
  });
  (r.conferencia||[]).forEach(function(f){ console.log('  FALHA: '+f); });
});
