"""Prova do mapa de capitulos para EPUB (item 12a, parte 0), sem navegador, com venenos.

    python biblioteca/_prova_mapa_epub.py
        gera EPUBs SINTETICOS de quatro partes (escritos aqui, sem livro real),
        um mapa de prova e o pacote, e confere o gerador.

    python biblioteca/_prova_mapa_epub.py --pacote <pasta>
        so escreve o pacote sintetico em <pasta> e diz o caminho do zip na
        ultima linha (o teste de navegador _teste/testa_livros_mapa_epub.js
        chama assim).

O EPUB de prova (espinha de quatro partes, como o FME de teoria, em que
varios capitulos dividem a mesma parte):
  parte 1  capa.xhtml, sem id;
  parte 2  texto/p2.xhtml, ids p1 a p6 (o "Primeiro" comeca em p2 e o
           "Segundo" em p5);
  parte 3  texto/p3.xhtml, ids p7 a p9 (o "Terceiro" comeca no alto, sem ancora);
  parte 4  texto/p4.xhtml, ids p10 a p12 (o "Quarto" comeca em p11).
O mapa traz os capitulos fora de ordem (o gerador ordena por parte e, dentro
da parte, pela ancora no texto) e tres entradas ruins: ancora que esta noutra
parte (p9 dita na parte 4), parte fora da espinha (9) e uma entrada de PDF
(so pag_arquivo_*). As tres saem, contadas na nota.

Livros:
  sem-sumario   o nav do calibre com uma entrada so ("Start"): o sumario sai
                do mapa, por parte e ancora;
  nav-lixo      nav com titulos lixo ("x", "1") e "sumario": "mapa": o mapa vence;
  nav-bom       nav bom, sem o campo: o sumario continua o do nav, e o mapa
                de capitulos vale;
  nav-proprio   nav bom e SEM mapa: sai igual, byte a byte, ao do gerador de
                antes (e o nav-bom guarda o sumario do nav), com o controle
                do outro lado: o sem-sumario muda;
  mapa-de-pdf   o mapa diz "formato": "pdf" (com o nome do .epub): o mapa
                inteiro fica de fora, e a nota diz.

Venenos (cada um TEM de reprovar a trava, e a prova passa dizendo que viu):
  mapa ignorado no EPUB         o gerador de antes (ler_epub sem mapa, o
                                montar_mapa so com PDF);
  ancora perdida                a entrada sai sem a ancora;
  parte trocada                 a parte contada de 0 (uma a menos);
  ancora de outra parte aceita  a conferencia da ancora desligada;
  mapa vencendo sempre         o mapa no lugar de um sumario proprio sem o
                                campo "sumario": "mapa";
  mapa de PDF aplicado ao EPUB  a guarda do formato desligada e as paginas
                                lidas como partes.
Saida no dialeto do portao: "N verificacoes passaram, M falharam".
"""
import argparse
import copy
import csv
import json
import os
import shutil
import sys
import tempfile
import zipfile

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
sys.path.insert(0, os.path.join(AQUI, '_amostra'))
import livros  # noqa: E402
import fazer_amostra_livros as amostra  # noqa: E402
from _prova_livros import Placar, conferir_manifesto, conferir_mapa, trava_tracos  # noqa: E402

# (titulo, parte, ancora, parte do fim, n no livro) do mapa, na ordem certa
VERDADE = [('Primeiro do mapa', 2, 'p2', 2, 1), ('Segundo do mapa', 2, 'p5', 2, 2),
           ('Terceiro do mapa', 3, None, 4, 3), ('Quarto do mapa', 4, 'p11', 4, 4)]
PARTES = [('capa.xhtml', []), ('texto/p2.xhtml', ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']),
          ('texto/p3.xhtml', ['p7', 'p8', 'p9']), ('texto/p4.xhtml', ['p10', 'p11', 'p12'])]


def epub_sintetico(caminho, nav):
    """nav: lista de (titulo, caminho com ancora) do sumario de navegacao."""
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    arquivos = []
    for nome, ids in PARTES:
        corpo = '<h1>Parte %s do livro de prova</h1>\n' % nome
        for k, i in enumerate(ids):
            texto = ''.join('<p>Parágrafo %d da marca %s, texto escrito para a prova, longo o bastante para rolar.</p>\n'
                            % (j + 1, i) for j in range(14))
            corpo += '<h2 id="%s">Marca %s</h2>\n%s' % (i, i, texto)
        arquivos.append(('OEBPS/' + nome, amostra.xhtml('Parte', corpo)))
    nav_x = ('<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n'
             '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">\n'
             '<head><title>Sumário</title></head><body>\n<nav epub:type="toc"><ol>\n' +
             ''.join('<li><a href="%s">%s</a></li>\n' % (h, t) for t, h in nav) +
             '</ol></nav>\n</body></html>\n').encode('utf-8')
    opf = ('<?xml version="1.0" encoding="utf-8"?>\n'
           '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id">\n'
           '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">prova-12a</dc:identifier>'
           '<dc:title>Livro de prova</dc:title><dc:language>pt-BR</dc:language></metadata>\n<manifest>\n'
           '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>\n' +
           ''.join('<item id="c%d" href="%s" media-type="application/xhtml+xml"/>\n' % (k, n) for k, (n, _) in enumerate(PARTES)) +
           '</manifest>\n<spine>' + ''.join('<itemref idref="c%d"/>' % k for k in range(len(PARTES))) +
           '</spine>\n</package>\n').encode('utf-8')
    container = ('<?xml version="1.0"?>\n<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">'
                 '<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>'
                 '</rootfiles></container>\n').encode('utf-8')
    with zipfile.ZipFile(caminho, 'w') as z:
        for nome, dados, metodo in [('mimetype', b'application/epub+zip', zipfile.ZIP_STORED),
                                    ('META-INF/container.xml', container, zipfile.ZIP_DEFLATED),
                                    ('OEBPS/content.opf', opf, zipfile.ZIP_DEFLATED),
                                    ('OEBPS/nav.xhtml', nav_x, zipfile.ZIP_DEFLATED)] + \
                                   [(n, d, zipfile.ZIP_DEFLATED) for n, d in arquivos]:
            zi = zipfile.ZipInfo(nome, date_time=(2026, 11, 13, 0, 0, 0))
            zi.compress_type = metodo
            z.writestr(zi, dados)
    return caminho


def capitulos_do_mapa(ids):
    """Os capitulos do mapa de prova: fora de ordem, e tres entradas ruins."""
    a = [{'id': ids[0], 'confianca': 'alta'}]
    b = [{'id': ids[1], 'confianca': 'media'}]
    return [
        {'n': 4, 'titulo': 'Quarto do mapa', 'capitulo': 4, 'ancora': 'p11', 'capitulo_fim': 4, 'assuntos': b},
        {'n': 2, 'titulo': 'Segundo do mapa', 'capitulo': 2, 'ancora': 'p5', 'capitulo_fim': 2, 'assuntos': b},
        {'n': 1, 'titulo': 'Primeiro do mapa', 'capitulo': 2, 'ancora': 'p2', 'capitulo_fim': 2, 'assuntos': a},
        {'n': 3, 'titulo': 'Terceiro do mapa', 'capitulo': 3, 'capitulo_fim': 4, 'assuntos': a},
        {'n': 5, 'titulo': 'Âncora de outra parte', 'capitulo': 4, 'ancora': 'p9', 'capitulo_fim': 4, 'assuntos': a},
        {'n': 6, 'titulo': 'Fora da espinha', 'capitulo': 9, 'capitulo_fim': 9, 'assuntos': a},
        {'n': 7, 'titulo': 'Entrada de PDF', 'pag_arquivo_inicio': 3, 'pag_arquivo_fim': 4, 'assuntos': a},
    ]


def montar(pasta):
    """Os cinco EPUBs, o mapa e a planilha em <pasta>/Livros. Devolve (planilha, mapas, ids)."""
    base = os.path.join(pasta, 'Livros')
    catalogo = livros.ler_catalogo()
    ids = [x['id'] for x in catalogo['matematica']['assuntos'] if x.get('serie') == 'em1'][:2]
    start = [('Start', 'capa.xhtml')]
    epub_sintetico(os.path.join(base, 'matematica', 'sem-sumario.epub'), start)
    epub_sintetico(os.path.join(base, 'matematica', 'nav-lixo.epub'),
                   [('x', 'texto/p2.xhtml#p1'), ('1', 'texto/p2.xhtml#p2'), ('2', 'texto/p3.xhtml')])
    epub_sintetico(os.path.join(base, 'matematica', 'nav-bom.epub'),
                   [('Capa', 'capa.xhtml'), ('Começo', 'texto/p2.xhtml'), ('Meio', 'texto/p3.xhtml'), ('Fim', 'texto/p4.xhtml')])
    epub_sintetico(os.path.join(base, 'matematica', 'mapa-de-pdf.epub'), start)
    # o EPUB com sumario proprio e SEM mapa: tem de sair igual ao do gerador de antes
    epub_sintetico(os.path.join(base, 'matematica', 'nav-proprio.epub'),
                   [('Capa', 'capa.xhtml'), ('Começo', 'texto/p2.xhtml'), ('Meio', 'texto/p3.xhtml#p8'), ('Fim', 'texto/p4.xhtml')])
    caps = capitulos_do_mapa(ids)
    mapa = [
        {'livro': 'ep1', 'arquivo': 'sem-sumario.epub', 'formato': 'epub', 'serie': 'em1', 'capitulos': caps},
        {'livro': 'ep2', 'arquivo': 'nav-lixo.epub', 'serie': 'em1', 'sumario': 'mapa', 'capitulos': caps},
        {'livro': 'ep3', 'arquivo': 'nav-bom.epub', 'serie': 'em1', 'capitulos': caps},
        {'livro': 'ep4', 'arquivo': 'mapa-de-pdf.epub', 'formato': 'pdf', 'serie': 'em1', 'deslocamento': 0,
         'capitulos': [{'n': 1, 'titulo': 'Do PDF', 'pag_arquivo_inicio': 2, 'pag_arquivo_fim': 3, 'assuntos': caps[0]['assuntos']}]},
    ]
    mapas = os.path.join(base, 'mapa')
    os.makedirs(mapas, exist_ok=True)
    with open(os.path.join(mapas, 'mapa_capitulos_prova_epub.json'), 'w', encoding='utf-8', newline='') as f:
        f.write(json.dumps(mapa, ensure_ascii=False, indent=1) + '\n')
    linhas = [amostra.linha('matematica', 'EPUB de prova %s' % n, 'matematica/%s.epub' % n, Segmento='Ensino médio')
              for n in ('sem-sumario', 'nav-lixo', 'nav-bom', 'mapa-de-pdf', 'nav-proprio')]
    planilha = os.path.join(base, 'livros_prova_epub.csv')
    with open(planilha, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=amostra.CABECALHO)
        w.writeheader()
        w.writerows(linhas)
    return planilha, mapas, ids


def gerar(pasta, planilha, mapas, nome):
    return livros.gerar(planilha, 'prova-epub', 1, os.path.join(pasta, nome), mapas=mapas,
                        trabalho=os.path.join(pasta, 'trab-' + nome), gerado_em='2026-11-13T10:00:00-03:00', commit='prova')


# ------------------------------------------------------------------ travas

def entradas(lista, com_fim=True):
    return [(e.get('titulo'), e.get('capitulo'), e.get('ancora'), e.get('capitulo_fim') if com_fim else None,
             e.get('capitulo_do_livro')) for e in lista]


def esperado(com_fim=True):
    return [(t, c, a, f if com_fim else None, n) for t, c, a, f, n in VERDADE]


def trava_mapa_epub(manifest, ids):
    """O mapa por parte e ancora nos tres livros com mapa de EPUB, os assuntos
    certos em cada capitulo e a nota que conta as tres entradas ruins."""
    erros = []
    por = {l['id']: l for l in manifest['livros']}
    for lid in ('sem-sumario', 'nav-lixo', 'nav-bom'):
        l = por.get(lid)
        if not l:
            erros.append('%s fora do pacote' % lid)
            continue
        if l.get('mapa_origem') != 'mapa':
            erros.append('%s: mapa_origem %r (o mapa de EPUB foi ignorado)' % (lid, l.get('mapa_origem')))
            continue
        obtido = entradas(l['mapa'])
        if obtido != esperado():
            erros.append('%s: mapa %r, esperado %r' % (lid, obtido, esperado()))
        if [e['n'] for e in l['mapa']] != [1, 2, 3, 4]:
            erros.append('%s: n do mapa %r' % (lid, [e['n'] for e in l['mapa']]))
        assuntos = [[a['id'] for a in e['assuntos']] for e in l['mapa']]
        if assuntos != [[ids[0]], [ids[1]], [ids[0]], [ids[1]]]:
            erros.append('%s: assuntos %r' % (lid, assuntos))
        if any('pagina' in e or 'pagina_fim' in e for e in l['mapa']):
            erros.append('%s: página num mapa de EPUB' % lid)
        nota = l.get('mapa_nota') or ''
        for trecho in ('1 capítulo(s) do mapa fora da espinha', '1 capítulo(s) do mapa com âncora que não está na parte',
                       '1 capítulo(s) do mapa com páginas de PDF'):
            if trecho not in nota:
                erros.append('%s: a nota não diz "%s": %r' % (lid, trecho, nota))
    return erros


def trava_sumario_epub(manifest):
    """O sumario sai do mapa sem sumario no EPUB e com "sumario": "mapa"; com o
    nav bom e sem o campo, fica o do nav; o mapa de PDF nao entra em nada."""
    erros = []
    por = {l['id']: l for l in manifest['livros']}
    for lid in ('sem-sumario', 'nav-lixo'):
        l = por.get(lid) or {}
        if l.get('sumario_origem') != 'mapa':
            erros.append('%s: sumario_origem %r' % (lid, l.get('sumario_origem')))
            continue
        obtido = entradas(l['sumario'], com_fim=False)
        if obtido != esperado(com_fim=False):
            erros.append('%s: sumário %r' % (lid, obtido))
        if any(e.get('nivel') != 1 or 'pagina' in e for e in l['sumario']):
            erros.append('%s: entrada do sumário fora da forma de EPUB' % lid)
        if 'por parte e âncora' not in (l.get('sumario_nota') or ''):
            erros.append('%s: a nota do sumário não diz de onde veio: %r' % (lid, l.get('sumario_nota')))
    bom = por.get('nav-bom') or {}
    if bom.get('sumario_origem') != 'navegacao' or [e['titulo'] for e in bom.get('sumario') or []] != ['Capa', 'Começo', 'Meio', 'Fim']:
        erros.append('nav-bom: o mapa tomou o lugar de um sumário bom sem o campo: %r' % bom.get('sumario_origem'))
    pdf = por.get('mapa-de-pdf') or {}
    if pdf.get('mapa_origem') == 'mapa' or pdf.get('sumario_origem') == 'mapa':
        erros.append('mapa-de-pdf: o mapa de PDF entrou no EPUB (%r, %r)' % (pdf.get('mapa_origem'), pdf.get('sumario_origem')))
    if 'diz formato "pdf"' not in (pdf.get('mapa_nota') or ''):
        erros.append('mapa-de-pdf: a nota não diz que o mapa ficou de fora: %r' % pdf.get('mapa_nota'))
    return erros


def trava_igual_ao_de_antes(novo, antes):
    """O nav-proprio (sumario proprio, sem mapa) sai igual ao do gerador de antes, inteiro; o nav-bom
    (sumario proprio, com mapa) guarda o sumario de antes; e o controle: o sem-sumario e o mapa do
    nav-bom MUDAM (o comparador enxerga diferenca)."""
    erros = []
    n = {l['id']: l for l in novo['livros']}
    a = {l['id']: l for l in antes['livros']}
    sem = lambda l: json.dumps(l, ensure_ascii=False, sort_keys=True)
    if sem(n.get('nav-proprio')) != sem(a.get('nav-proprio')):
        erros.append('nav-proprio mudou: %r' % sorted(k for k in set(n['nav-proprio']) | set(a['nav-proprio'])
                                                       if n['nav-proprio'].get(k) != a['nav-proprio'].get(k)))
    for k in ('sumario', 'sumario_origem', 'sumario_nota'):
        if n['nav-bom'].get(k) != a['nav-bom'].get(k):
            erros.append('nav-bom: %s mudou' % k)
    if n['nav-bom'].get('mapa') == a['nav-bom'].get('mapa'):
        erros.append('controle: o mapa do nav-bom não mudou (o comparador não vê o mapa novo)')
    if n['sem-sumario'].get('sumario') == a['sem-sumario'].get('sumario'):
        erros.append('controle: o sumário do sem-sumario não mudou')
    return erros


def trava_pacote(manifest, zip_caminho, catalogo):
    """A forma que o aplicativo confere (manifesto, mapa dentro da espinha, sem travessao)."""
    with zipfile.ZipFile(zip_caminho) as z:
        erros = conferir_manifesto(manifest, z.namelist(), z.read, z.infolist())
    erros += conferir_mapa(manifest, catalogo)
    erros += trava_tracos(manifest)
    return erros


class PlacarComMotivo(Placar):
    """O veneno diz o primeiro motivo que a trava viu: veneno que reprova por
    outro motivo nao prova a trava."""
    def conferir(self, nome, erros, deve_reprovar=False):
        erros = list(erros or [])
        r = super().conferir(nome, erros, deve_reprovar)
        if deve_reprovar and erros:
            print('           motivo: %s' % str(erros[0])[:220])
        return r


def rodar(placar):
    temp = tempfile.mkdtemp(prefix='prova_mapa_epub_')
    try:
        planilha, mapas, ids = montar(temp)
        catalogo = livros.ler_catalogo()
        m, rel, _ = gerar(temp, planilha, mapas, 'p1')
        print('pacote de prova: %d livros, %d recusados' % (m['contagens']['livros'], len(rel['recusados'])))
        placar.conferir('mapa de EPUB: os cinco livros no pacote', [] if m['contagens']['livros'] == 5 else [rel['recusados']])
        placar.conferir('mapa de EPUB: por parte e âncora, em ordem, com os assuntos e a nota das três entradas ruins',
                        trava_mapa_epub(m, ids))
        placar.conferir('mapa de EPUB: o sumário do mapa (sem sumário e com "sumario": "mapa"), o nav bom fica, o mapa de PDF não entra',
                        trava_sumario_epub(m))
        placar.conferir('mapa de EPUB: o pacote na forma que o aplicativo confere', trava_pacote(m, rel['zip']['caminho'], catalogo))
        placar.conferir('mapa de EPUB: nada de âncoras (_ancoras) no manifest',
                        [] if '_ancoras' not in json.dumps(m) else ['_ancoras no manifest'])

        # o controle das travas sobre dados mexidos a mao
        v = copy.deepcopy(m)
        next(x for x in v['livros'] if x['id'] == 'nav-lixo')['mapa'][1]['ancora'] = 'p2'
        placar.conferir('veneno no dado: a âncora do segundo trocada pela do primeiro', trava_mapa_epub(v, ids), deve_reprovar=True)

        def com(veneno, nome):
            guarda = {k: getattr(livros, k) for k in veneno}
            for k, f in veneno.items():
                setattr(livros, k, f(guarda[k]))
            try:
                return gerar(temp, planilha, mapas, nome)[0]
            finally:
                for k, f in guarda.items():
                    setattr(livros, k, f)

        # 1. o gerador de antes: o EPUB ignora o mapa calado
        mv = com({'ler_epub': lambda o: (lambda c, mapas=None: o(c)),
                  'montar_mapa': lambda o: (lambda l, i, a, c: o(l, i, None if l['formato'] == 'epub' else a, c))}, 'v-ignorado')
        placar.conferir('o mapa ignorado no EPUB (o gerador de antes)', trava_mapa_epub(mv, ids), deve_reprovar=True)
        placar.conferir('o mapa ignorado no EPUB: o sumário também', trava_sumario_epub(mv), deve_reprovar=True)

        # O EPUB com sumario proprio nao muda de comportamento: contra o gerador de antes (o mv acima), o
        # livro sem mapa sai igual byte a byte e o nav-bom guarda o sumario do nav. O controle do outro
        # lado: o comparador ve a diferenca onde ela tem de existir (o sem-sumario e o mapa do nav-bom).
        placar.conferir('o EPUB com sumário próprio, contra o gerador de antes (controle: o sem-sumário muda)',
                        trava_igual_ao_de_antes(m, mv))
        mv2 = com({'ler_epub': lambda o: (lambda c, mapas=None: o(c, {k: (v[0], dict(v[1], sumario='mapa'))
                                                                     for k, v in (mapas or {}).items()}))}, 'v-mapa-vence')
        placar.conferir('o mapa vencendo sempre o sumário do EPUB', trava_igual_ao_de_antes(mv2, mv), deve_reprovar=True)

        # 2. a ancora perdida no caminho
        def sem_ancora(o):
            def f(*a):
                es, contas = o(*a)
                for e in es:
                    e.pop('ancora', None)
                return es, contas
            return f
        mv = com({'entradas_epub_do_mapa': sem_ancora}, 'v-sem-ancora')
        placar.conferir('a âncora perdida', trava_mapa_epub(mv, ids), deve_reprovar=True)
        placar.conferir('a âncora perdida: o sumário também', trava_sumario_epub(mv), deve_reprovar=True)

        # 3. a parte contada de 0
        def parte_de_zero(o):
            def f(*a):
                es, contas = o(*a)
                for e in es:
                    e['capitulo'] -= 1
                    e['capitulo_fim'] -= 1
                return es, contas
            return f
        mv = com({'entradas_epub_do_mapa': parte_de_zero}, 'v-parte')
        placar.conferir('a parte trocada (contada de 0)', trava_mapa_epub(mv, ids), deve_reprovar=True)

        # 4. a ancora de outra parte aceita
        mv = com({'ancoras_das_partes': lambda o: (lambda z, esp: [sum(o(z, esp), [])] * len(esp))}, 'v-ancora-qualquer')
        placar.conferir('a âncora de outra parte aceita', trava_mapa_epub(mv, ids), deve_reprovar=True)

        # 5. o mapa de PDF aplicado ao EPUB: a guarda do formato desligada e as paginas lidas como partes
        def le_paginas(o):
            def f(livro_do_mapa, partes, ancoras):
                cru = copy.deepcopy(livro_do_mapa)
                for c in cru.get('capitulos') or []:
                    if 'capitulo' not in c and 'pag_arquivo_inicio' in c:
                        c['capitulo'], c['capitulo_fim'] = c.pop('pag_arquivo_inicio'), c.pop('pag_arquivo_fim')
                return o(cru, partes, ancoras)
            return f
        mv = com({'mapa_do_formato': lambda o: (lambda achado, formato: (achado, '')),
                  'entradas_epub_do_mapa': le_paginas}, 'v-pdf')
        placar.conferir('o mapa de PDF aplicado ao EPUB', trava_sumario_epub(mv), deve_reprovar=True)
        placar.conferir('o mapa de PDF aplicado ao EPUB: a entrada de PDF do mapa bom vira parte', trava_mapa_epub(mv, ids),
                        deve_reprovar=True)
    finally:
        shutil.rmtree(temp, ignore_errors=True)


def principal():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pacote')
    a = ap.parse_args()
    if a.pacote:
        os.makedirs(a.pacote, exist_ok=True)
        planilha, mapas, _ = montar(a.pacote)
        _, rel, _ = livros.gerar(planilha, 'prova-epub', 1, os.path.join(a.pacote, 'pacotes'), mapas=mapas,
                                 trabalho=os.path.join(a.pacote, 'trabalho'), gerado_em='2026-11-13T10:00:00-03:00', commit='prova')
        print(rel['zip']['caminho'])
        return
    placar = PlacarComMotivo()
    rodar(placar)
    print('%d verificacoes passaram, %d falharam' % (placar.ok, placar.falhas))
    sys.exit(1 if placar.falhas else 0)


if __name__ == '__main__':
    principal()
