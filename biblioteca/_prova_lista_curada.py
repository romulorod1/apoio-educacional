"""Prova do tipo de fonte lista-curada (biblioteca/lista_curada.py), sem navegador, com venenos.

    python biblioteca/_prova_lista_curada.py [--sem-navegador]
        sobre uma fonte INVENTADA que a propria prova desenha na hora: nove
        PDFs sinteticos e o json de itens curados que aponta para eles.

    python biblioteca/_prova_lista_curada.py --contra-main [--ref origin/main]
        byte a byte: as amostras sinteticas das outras fontes (Portal, Mirim,
        ENEM e Cadernos SME-SP, este com e sem --gabarito-externo e
        --so-com-resposta) geradas pelo principal() desta arvore e pelo da
        ref (git archive numa pasta temporaria) saem com o mesmo zip. Para o PR
        que mexe no codigo comum; fora do portao, porque um PR que muda de
        proposito outra fonte reprovaria aqui.

O --sem-navegador e aceito e nao muda nada: esta prova nao abre Chrome (a
conferencia do desenho e pelo MuPDF, abaixo).

Travas:
  caminho feliz   o pacote da fonte inventada: um item por entrada do json, na
                  ordem do json dentro de cada modulo, numero 1, 2, 3...;
                  campos (fonte, serie, assunto, modulo, titulo, subitens,
                  licenca, atribuicao pelo modelo, link, sem solucao); o recorte
                  de varias paginas empilhado com os pedacos na origem; o texto
                  do recorte na busca e nada do vizinho de fora da caixa; o SVG
                  desenhado pelo MuPDF igual a pagina na caixa; o assunto de
                  outro ano listado no relatorio; a pagina com o CropBox maior
                  que o MediaBox (ha PDF publicado assim) acertada na copia
                  aberta, com nota, e o desenho igual (veneno: sem acertar, o
                  gerador quebra); determinismo; e as genericas
                  do gerador (svg, xml, manifesto com zip, tracos)
  privado         o manifest diz privado como o json diz, true ou false
  sem fonte real  nada no pacote que o json nao disse: o nome de outra fonte
                  nao aparece, e trocar o nome da inventada troca tudo
  validacao       um veneno por regra: campo desconhecido (no topo, na fonte,
                  no item, no modulo, no recorte, no pedaco), PDF que nao
                  existe, pagina fora do PDF (0 e depois da ultima), rect fora
                  da pagina, rect invertido, id repetido, tema_app fora do
                  catalogo, subitens que nao sao lista de textos, licenca e
                  atribuicao faltando, atribuicao com campo que nao existe,
                  privado que nao e booleano, modulo com dois titulos, chave
                  repetida em qualquer nivel (e no gabarito de fora), subitem
                  com espaco sobrando, privado com licenca aberta; e na
                  linha de comando, --itens-curados com outra fonte e --pdfs
                  ou --serie com esta. Cada veneno so conta se o gerador parar
                  PELO motivo esperado
  paginas         a pagina girada (/Rotate 90, 180 e 270) e recusada; o MediaBox
                  fora da origem recorta certo e sem nota; o CropBox fora de
                  um MediaBox fora da origem e acertado, com nota, e desenhado
                  certo; a caixa em branco e a caixa minuscula sao recusadas;
                  o confere pega a pagina trocada por uma
  empilhado       o SVG de varios pedacos, desenhado pelo MuPDF, tem cada
                  pedaco no seu lugar (veneno: a pilha na ordem trocada)
  tracos          travessao no nome da fonte nao chega ao pacote (veneno: sem
                  o sem_tracos); travessao em subitem e recusado
  privado no repo privado true com a saida dentro do repositorio e recusado
                  antes de gravar nada; a saida dentro de outro checkout git
                  (git init numa pasta fora deste, e uma com .git em arquivo,
                  como no worktree) tambem, e com privado false vale (veneno:
                  a trava que so olha este repositorio deixa passar)
  tinta clara     o recorte so com figura cinza clara (0.85) ou amarelo palido,
                  sem texto, vale; a caixa sobre um preenchimento branco puro e
                  a area vazia de uma pagina creme sao recusadas como em branco,
                  e o branco vazio numa pagina tomada por um painel claro
                  tambem (venenos: a tolerancia larga, como o cinza 200 de
                  antes, recusa as figuras claras; medir contra o branco aceita
                  o creme; medir so contra o papel aceita o branco do painel)
  confere         o cabecalho corrido (a mesma linha no alto de cada pagina)
                  que a caixa pega acima do texto esperado nao reprova o item
                  (veneno: so a ordem natural do PDF reprova); no PDF de uma
                  pagina so nao ha folga: o titulo da pagina unica acima do
                  texto e o item vizinho de uma linha numa caixa alta sao
                  recusados (veneno: a regra do 17dfb6a, que aceitava o
                  primeiro bloco da pagina unica, deixa os dois passarem);
                  sao recusados tambem a ultima linha
                  do item de antes ("Resposta: ____"), o item de antes de uma
                  linha, a pagina trocada com um titulo de uma linha, o titulo
                  que nao se repete, a caixa alta demais com o item de antes
                  inteiro, a pagina que so tem o texto num bloco mais abaixo e
                  a pagina trocada por uma, mesmo com o cabecalho corrido
                  (venenos: a regra de pular uma linha nos 18 pt do alto da
                  caixa aceita os tres primeiros, e o comeco de qualquer bloco
                  aceita os dois da caixa alta e da pagina errada)
  gabarito        --gabarito-externo com --so-com-resposta pela linha de
                  comando: so fica item com gabarito, o numero e o de sem a
                  opcao, as contagens e o relatorio batem, a busca esquece o
                  item tirado e os seus SVG saem do manifest
Saida no dialeto do portao: "N verificacoes passaram, M falharam".
"""
import argparse
import copy
import hashlib
import io
import json
import os
import shutil
import subprocess
import sys
import tempfile
import zipfile

import pymupdf

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
sys.path.insert(0, AQUI)
import gerar_pacote as gp  # noqa: E402
import lista_curada  # noqa: E402
import _prova_gerador as pg  # noqa: E402

FIXO = {'creationDate': 'D:20261113000000', 'modDate': 'D:20261113000000', 'producer': 'amostra', 'creator': 'amostra'}
W, H = 595.0, 842.0
GERADO_EM = '2026-11-13T00:00:00-03:00'
NOME = 'Coletânea Inventada de Problemas'
ID_FONTE = 'coletanea-inventada'
VIZINHO = 'Texto vizinho que fica fora da caixa'


def recusa_do_gerador(fn):
    try:
        fn()
    except SystemExit as e:
        return str(e)
    return ''


def salvar(doc, caminho):
    doc.set_metadata(FIXO)
    doc.save(caminho, garbage=3, deflate=True, no_new_id=True)
    doc.close()


def linhas(pg_, x, y, textos, corpo=11, fonte='helv'):
    for k, t in enumerate(textos):
        pg_.insert_text((x, y + 14 * k), t, fontname=fonte, fontsize=corpo)


def fazer_pdfs(pasta):
    """Dois PDFs inventados. caderno-a.pdf: tres paginas; a atividade 1.1 no
    alto da p. 1 com um retangulo desenhado, o vizinho logo abaixo da caixa;
    a 1.2 comecando no pe da p. 2 e terminando no alto da p. 3. caderno-b.pdf:
    uma pagina com duas atividades."""
    os.makedirs(pasta, exist_ok=True)
    doc = pymupdf.open()
    p1 = doc.new_page(width=W, height=H)
    linhas(p1, 60, 80, ['Atividade 1.1', 'Quantas bolinhas ha em cada caixa?', 'A) Caixa azul', 'B) Caixa verde'])
    p1.draw_rect(pymupdf.Rect(60, 150, 200, 210), color=(0, 0, 1), width=1.2)
    linhas(p1, 60, 320, [VIZINHO, 'Outra coisa da pagina'])
    p2 = doc.new_page(width=W, height=H)
    linhas(p2, 60, 80, ['Pagina sem item do json'])
    linhas(p2, 60, 700, ['Atividade 1.2', 'Complete a sequencia de numeros:'])
    p3 = doc.new_page(width=W, height=H)
    linhas(p3, 60, 80, ['10, 20, 30, ___, ___', 'Qual e a regra da sequencia?'])
    linhas(p3, 60, 400, [VIZINHO])
    salvar(doc, os.path.join(pasta, 'caderno-a.pdf'))
    doc = pymupdf.open()
    p = doc.new_page(width=W, height=H)
    linhas(p, 60, 80, ['Atividade 2.1', 'Calcule 25 + 17.'])
    linhas(p, 60, 300, ['Atividade 2.2', 'Quanto e a metade de 48?'])
    salvar(doc, os.path.join(pasta, 'caderno-b.pdf'))
    # caderno-c.pdf: o CropBox maior que o MediaBox, como ha PDF publicado
    doc = pymupdf.open()
    p = doc.new_page(width=W, height=H)
    linhas(p, 60, 80, ['Atividade 3.1', 'Quanto e 3 vezes 4?'])
    doc.xref_set_key(p.xref, 'CropBox', '[-30 -30 625 872]')
    salvar(doc, os.path.join(pasta, 'caderno-c.pdf'))
    # caderno-d.pdf: tres paginas giradas (90, 180, 270)
    doc = pymupdf.open()
    for giro in (90, 180, 270):
        p = doc.new_page(width=W, height=H)
        linhas(p, 60, 80, ['Atividade girada %d' % giro, 'Quanto e 2 mais 2?'])
        p.set_rotation(giro)
    salvar(doc, os.path.join(pasta, 'caderno-d.pdf'))
    # caderno-e.pdf: p. 1 com o MediaBox fora da origem; p. 2 com ele fora da
    # origem e o CropBox passando dele dos quatro lados
    doc = pymupdf.open()
    for k in range(2):
        p = doc.new_page(width=W, height=H)
        doc.xref_set_key(p.xref, 'MediaBox', '[100 100 695 942]')
        if k == 1:
            doc.xref_set_key(p.xref, 'CropBox', '[70 70 725 972]')
        p = doc.reload_page(p)
        linhas(p, 60, 80, ['Atividade 5.%d' % (k + 1), 'Quanto e 9 menos 4?'])
    salvar(doc, os.path.join(pasta, 'caderno-e.pdf'))
    return pasta


def json_da_amostra(privado=False, nome=NOME, id_fonte=ID_FONTE):
    js = _json_da_amostra(privado, nome)
    js['fonte']['id'] = id_fonte
    for it in js['itens']:
        it['id'] = id_fonte + it['id'][len(ID_FONTE):]
    return js


def _json_da_amostra(privado, nome):
    return {
        'fonte': {'id': ID_FONTE, 'nome': nome, 'url': 'https://exemplo.invalid/coletanea',
                  'licenca': 'licença inventada para a prova',
                  'atribuicao': '{fonte}, {serie}, {paginas}, "{titulo}" ({arquivo}).', 'privado': privado},
        'itens': [
            {'id': 'coletanea-inventada:3ano:1.1', 'serie': '3ano', 'tema_app': 'MAT03-01',
             'modulo': {'slug': 'numeros', 'titulo': 'Números'}, 'titulo': 'Atividade 1.1',
             'subitens': ['A', 'B'], 'confere': 'Atividade 1.1 Quantas bolinhas',
             'recorte': {'pdf': 'caderno-a.pdf', 'pagina': 1, 'rect': [50, 62, 300, 220]}},
            {'id': 'coletanea-inventada:3ano:1.2', 'serie': '3ano', 'tema_app': 'MAT03-01',
             'modulo': {'slug': 'numeros', 'titulo': 'Números'}, 'titulo': 'Atividade 1.2',
             'subitens': ['único'], 'confere': 'ATIVIDADE 1.2: complete a sequência',
             'recorte': {'pdf': 'caderno-a.pdf', 'pedacos': [{'pagina': 2, 'rect': [50, 685, 300, 730]},
                                                            {'pagina': 3, 'rect': [50, 65, 300, 110]}]}},
            # o assunto de outro ano (o 4o), o mais proximo: vale e o relatorio diz
            {'id': 'coletanea-inventada:4ano:2.1', 'serie': '4ano', 'tema_app': 'MAT05-01',
             'modulo': {'slug': 'contas', 'titulo': 'Contas'}, 'titulo': 'Atividade 2.1', 'subitens': [],
             'recorte': {'pdf': 'caderno-b.pdf', 'pagina': 1, 'rect': [50, 62, 300, 110]}},
            {'id': 'coletanea-inventada:4ano:2.2', 'serie': '4ano', 'tema_app': 'MAT04-01',
             'modulo': {'slug': 'contas', 'titulo': 'Contas'}, 'titulo': 'Atividade 2.2', 'subitens': [],
             'recorte': {'pdf': 'caderno-b.pdf', 'pagina': 1, 'rect': [50, 282, 300, 330]}},
            # a pagina com o CropBox fora do MediaBox, recortada de beira a beira (como o
            # PDF real em que isto apareceu): sem acertar, o CropBox do recorte sai do MediaBox
            {'id': 'coletanea-inventada:5ano:3.1', 'serie': '5ano', 'tema_app': 'MAT05-02',
             'modulo': {'slug': 'contas', 'titulo': 'Contas'}, 'titulo': 'Atividade 3.1', 'subitens': [],
             'recorte': {'pdf': 'caderno-c.pdf', 'pagina': 1, 'rect': [0, 62, 595, 110]}},
        ]}


GABARITO = [
    {'id_item': 'coletanea-inventada:3ano:1.1', 'subitem': 'A', 'resposta': '3', 'origem': 'agente-conferido'},
    {'id_item': 'coletanea-inventada:3ano:1.1', 'subitem': 'B', 'resposta': '5', 'origem': 'agente-conferido'},
    {'id_item': 'coletanea-inventada:4ano:2.2', 'subitem': None, 'resposta': '24', 'origem': 'agente-conferido'},
    {'id_item': 'coletanea-inventada:5ano:3.1', 'subitem': None, 'resposta': '12', 'origem': 'agente-conferido'},
]


def gravar_json(caminho, obj):
    with io.open(caminho, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
    return caminho


def gerar(json_c, trabalho, **kw):
    kw.setdefault('gerado_em', GERADO_EM)
    kw.setdefault('commit', 'amostra')
    return lista_curada.gerar(json_c, 1, trabalho + '_zip', trabalho=trabalho, **kw)


def pelo_principal(args):
    antes = gp.confere_versao_do_pymupdf
    gp.confere_versao_do_pymupdf = lambda versao=None: None
    try:
        gp.principal(args)
    finally:
        gp.confere_versao_do_pymupdf = antes


# ------------------------------------------------------------------ travas

def trava_campos(p, js):
    erros = []
    ids_json = [i['id'] for i in js['itens']]
    if sorted(i['id'] for i in p.itens) != sorted(ids_json):
        erros.append('itens %r, e o json tem %r' % (sorted(i['id'] for i in p.itens), sorted(ids_json)))
    f = js['fonte']
    por_id = {i['id']: i for i in js['itens']}
    numeros = {}
    for it in p.itens:
        c = por_id.get(it['id'])
        if not c:
            continue
        for campo in ('serie', 'tema_app', 'titulo', 'subitens', 'modulo'):
            if it[campo] != c[campo]:
                erros.append('%s: %s %r, e o json diz %r' % (it['id'], campo, it[campo], c[campo]))
        if it['fonte'] != f['id'] or it['licenca'] != f['licenca'] or it['link'] != f['url']:
            erros.append('%s: fonte, licenca ou link nao sao os do json' % it['id'])
        if it['sem_solucao'] is not True or it['assets']['solucao'] is not None or it['resposta'] is not None:
            erros.append('%s: item com solucao ou resposta que a fonte nao deu' % it['id'])
        pags = sorted(set(z['pagina'] for z in pg.pedacos(it, 'enunciado')))
        pag_txt = 'p. %d' % pags[0] if len(pags) == 1 else 'p. %d a %d' % (pags[0], pags[-1])
        esperado = f['atribuicao'].format(fonte=f['nome'], serie='%sº ano' % it['serie'][0], paginas=pag_txt,
                                          titulo=c['titulo'], id=it['id'], arquivo=c['recorte']['pdf'])
        if it['atribuicao'] != esperado or it['origem_citada'] != esperado:
            erros.append('%s: atribuicao %r, e o modelo da %r' % (it['id'], it['atribuicao'], esperado))
        r = c['recorte']
        brutos = r.get('pedacos') or [{'pagina': r['pagina'], 'rect': r['rect']}]
        ps = pg.pedacos(it, 'enunciado')
        if [(z['pagina'], [float(v) for v in z['bbox']]) for z in ps] != \
                [(b['pagina'], [float(v) for v in b['rect']]) for b in brutos]:
            erros.append('%s: pedacos %r, e o json diz %r' % (it['id'], ps, brutos))
        if it['origem']['arquivo'] != r['pdf']:
            erros.append('%s: origem.arquivo %r' % (it['id'], it['origem']['arquivo']))
        numeros.setdefault((it['serie'], it['modulo']['slug']), []).append((ids_json.index(it['id']), it['numero']))
    for k, v in numeros.items():
        if [n for _, n in sorted(v)] != list(range(1, len(v) + 1)):
            erros.append('%s: numeros %r fora da ordem do json' % (k, sorted(v)))
    return erros


def trava_texto(p):
    erros = []
    for it in p.itens:
        if VIZINHO.lower() in it['texto']:
            erros.append('%s: o texto tem o vizinho de fora da caixa' % it['id'])
    t = {i['id']: i['texto'] for i in p.itens}
    for iid, pedaco in (('coletanea-inventada:3ano:1.1', 'quantas bolinhas'), ('coletanea-inventada:3ano:1.2', 'complete a sequencia'),
                        ('coletanea-inventada:3ano:1.2', 'qual e a regra'), ('coletanea-inventada:4ano:2.1', 'calcule 25')):
        if iid in t and pedaco not in t[iid]:
            erros.append('%s: o texto nao tem %r' % (iid, pedaco))
    ids_busca = {r['i'] for r in p.busca['temas']}
    for it in p.itens:
        if it['id'] not in ids_busca:
            erros.append('%s: fora da busca' % it['id'])
    return erros


def trava_desenho(p, pdfs, limite=0.002):
    """O SVG de cada item, desenhado pelo MuPDF, igual a pagina em cada caixa; no
    empilhado, cada pedaco no seu lugar da pilha (a altura dos de cima mais a folga)."""
    erros = []
    for it in p.itens:
        ps = pg.pedacos(it, 'enunciado')
        svg = p.bytes_de(it['assets']['enunciado'])
        s = pymupdf.open(stream=svg, filetype='svg')
        doc = pymupdf.open(os.path.join(pdfs, it['origem']['arquivo']))
        for _ in range(doc.page_count):
            lista_curada.acertar_cropbox(doc, _, [])
        y = 0.0
        for k, z in enumerate(ps):
            r = pymupdf.Rect(z['bbox'])
            a = s[0].get_pixmap(dpi=72, colorspace=pymupdf.csGRAY, clip=pymupdf.Rect(0, y, r.width, y + r.height))
            b = doc[z['pagina'] - 1].get_pixmap(dpi=72, colorspace=pymupdf.csGRAY, clip=r)
            y += r.height + gp.FOLGA_PILHA
            if (a.width, a.height) != (b.width, b.height):
                erros.append('%s pedaco %d: SVG %dx%d, caixa %dx%d' % (it['id'], k + 1, a.width, a.height, b.width,
                                                                        b.height))
                continue
            dif = sum(1 for x, w in zip(a.samples, b.samples) if abs(x - w) > 64) / float(max(1, len(a.samples)))
            if dif > limite:
                erros.append('%s pedaco %d: o SVG difere da pagina em %.2f%% dos pixels' % (it['id'], k + 1, 100 * dif))
        doc.close()
        s.close()
    return erros


def trava_relatorio(p):
    t = p.relatorio.get('tema_de_outro_ano')
    if t != [{'id': 'coletanea-inventada:4ano:2.1', 'serie': '4ano', 'tema': 'MAT05-01', 'serie_do_tema': '05'}]:
        return ['tema_de_outro_ano %r' % t]
    return []


def trava_privado(p, esperado):
    return [] if p.manifest.get('privado') is esperado else ['manifest privado %r, o json diz %r'
                                                           % (p.manifest.get('privado'), esperado)]


def todo_texto(pasta):
    out = []
    for raiz, _, nomes in os.walk(pasta):
        for n in nomes:
            if n.endswith('.json'):
                out.append(io.open(os.path.join(raiz, n), encoding='utf-8').read())
    return '\n'.join(out)


def trava_sem_fonte_real(p, q, nome_q):
    """Nada no pacote que o json nao disse: nome de outra fonte nao aparece, e
    o pacote com outro nome no json so tem o nome novo."""
    erros = []
    t = todo_texto(p.pasta)
    for outra in ('OBMEP', 'SME-SP', 'ENEM', 'Portal da', 'Cadernos de Apoio'):
        if outra.lower() in t.lower():
            erros.append('o pacote cita %r, que o json nao disse' % outra)
    tq = todo_texto(q.pasta)
    if NOME in tq or ID_FONTE in tq:
        erros.append('o pacote com outro nome no json ainda cita o nome antigo')
    if nome_q not in tq:
        erros.append('o pacote com outro nome no json nao cita o nome novo')
    return erros


# ------------------------------------------------------------------ venenos de validacao

def venenos_de_validacao(temp, pdfs, placar):
    boa = json_da_amostra()

    def caso(nome, mexe, motivo):
        js = copy.deepcopy(boa)
        mexe(js)
        c = gravar_json(os.path.join(pdfs, 'v_%s.json' % nome), js)
        r = recusa_do_gerador(lambda: gerar(c, os.path.join(temp, 'v_' + nome), gravar_zip=False))
        placar.conferir('validacao: ' + nome, [r] if r else [], True, motivo)

    caso('campo desconhecido no topo', lambda j: j.update(extra=1), 'campos desconhecidos: extra')
    caso('campo desconhecido na fonte', lambda j: j['fonte'].update(autor='x'), 'campos desconhecidos: autor')
    caso('campo desconhecido no item', lambda j: j['itens'][1].update(resposta='7'), 'campos desconhecidos: resposta')
    caso('campo desconhecido no modulo', lambda j: j['itens'][0]['modulo'].update(cor='azul'),
         'campos desconhecidos: cor')
    caso('campo desconhecido no recorte', lambda j: j['itens'][0]['recorte'].update(dpi=200),
         'campos desconhecidos: dpi')
    caso('campo desconhecido no pedaco', lambda j: j['itens'][1]['recorte']['pedacos'][0].update(coluna=1),
         'campos desconhecidos: coluna')
    caso('pagina e pedacos juntos', lambda j: j['itens'][1]['recorte'].update(pagina=2),
         'campos desconhecidos: pagina')
    caso('PDF que nao existe', lambda j: j['itens'][2]['recorte'].update(pdf='sumiu.pdf'), 'não existe')
    caso('pagina 0', lambda j: j['itens'][0]['recorte'].update(pagina=0), 'fora do PDF')
    caso('pagina depois da ultima', lambda j: j['itens'][1]['recorte']['pedacos'][1].update(pagina=4),
         'fora do PDF')
    caso('pagina que nao e inteiro', lambda j: j['itens'][0]['recorte'].update(pagina='1'), 'inteiro')
    caso('rect fora da pagina (direita)', lambda j: j['itens'][0]['recorte'].update(rect=[50, 62, 600, 220]),
         'sai da página')
    caso('rect fora da pagina (acima)', lambda j: j['itens'][3]['recorte'].update(rect=[50, -5, 300, 330]),
         'sai da página')
    caso('rect invertido', lambda j: j['itens'][0]['recorte'].update(rect=[300, 62, 50, 220]), 'invertido')
    caso('rect com tres numeros', lambda j: j['itens'][0]['recorte'].update(rect=[50, 62, 300]), '[x0, y0, x1, y1]')
    caso('id repetido', lambda j: j['itens'][3].update(id='coletanea-inventada:3ano:1.1'), 'repetido')
    caso('tema_app fora do catalogo', lambda j: j['itens'][0].update(tema_app='MAT03-99'),
         'não está no banco/topicos/matematica.json')
    caso('subitens que nao e lista', lambda j: j['itens'][0].update(subitens='A, B'), 'lista de textos')
    caso('subitens com numero', lambda j: j['itens'][0].update(subitens=['A', 2]), 'lista de textos')
    caso('subitens repetidos', lambda j: j['itens'][0].update(subitens=['A', 'A']), 'repetidos')
    caso('licenca faltando', lambda j: j['fonte'].pop('licenca'), 'faltam os campos licenca')
    caso('licenca vazia', lambda j: j['fonte'].update(licenca='  '), 'licenca tem de ser um texto')
    caso('atribuicao faltando', lambda j: j['fonte'].pop('atribuicao'), 'faltam os campos atribuicao')
    caso('atribuicao com campo que nao existe', lambda j: j['fonte'].update(atribuicao='{fonte}, {editora}'),
         'atribuicao com {editora}')
    caso('privado que nao e booleano', lambda j: j['fonte'].update(privado='sim'), 'true ou false')
    caso('serie fora do formato', lambda j: j['itens'][0].update(serie='3'), 'não é 1ano a 9ano')
    caso('modulo com dois titulos', lambda j: j['itens'][1]['modulo'].update(titulo='Outro'), 'já veio com o título')
    caso('fonte.id que nao e slug', lambda j: j['fonte'].update(id='Coletanea Inventada'), 'não é slug')
    caso('item sem recorte', lambda j: j['itens'][0].pop('recorte'), 'faltam recorte')
    for k, giro in enumerate((90, 180, 270), 1):
        caso('pagina girada %d' % giro, lambda j, k=k: j['itens'][2]['recorte'].update(pdf='caderno-d.pdf', pagina=k),
             '/Rotate %d' % giro)
    caso('caixa em branco', lambda j: j['itens'][0]['recorte'].update(rect=[50, 400, 300, 600]), 'caixa em branco')
    caso('caixa minuscula', lambda j: j['itens'][0]['recorte'].update(rect=[60, 70, 62, 72]), 'menos de 5 pt')
    caso('confere com a pagina trocada por uma', lambda j: j['itens'][0]['recorte'].update(pagina=2),
         'não começa por confere')
    caso('confere vazio', lambda j: j['itens'][0].update(confere=' '), 'confere tem de ser um texto')
    caso('atribuicao com formato', lambda j: j['fonte'].update(atribuicao='{fonte:>30}'), 'formato ou conversão')
    caso('atribuicao com conversao', lambda j: j['fonte'].update(atribuicao='{titulo!r}'), 'formato ou conversão')
    caso('atribuicao com formato aninhado', lambda j: j['fonte'].update(atribuicao='{fonte:{x}}'),
         'formato ou conversão')
    caso('id com espaco', lambda j: j['itens'][0].update(id='coletanea-inventada:3ano 1.1'), 'caractere que não vale')
    caso('id com quebra de linha', lambda j: j['itens'][0].update(id='coletanea-inventada:3ano\n1.1'),
         'caractere que não vale')
    caso('id sem o prefixo da fonte', lambda j: j['itens'][0].update(id='outra:3ano:1.1'), 'não começa por')

    def id_de_modulo(j):
        j['fonte']['id'] = '3ano'
        for it in j['itens']:
            it['id'] = '3ano:' + it['id'].split(':', 1)[1]
        j['itens'][0]['id'] = '3ano:numeros'
    caso('id igual ao do documento de modulo', id_de_modulo, 'documento de módulo')
    caso('subitem com travessao', lambda j: j['itens'][0].update(subitens=['A', 'B \u2013 C']), 'travessão')
    caso('subitem com espaco sobrando', lambda j: j['itens'][0].update(subitens=['A ', 'B']), 'espaço no começo')
    for lic in ('CC BY-NC-SA 4.0', 'Creative Commons Atribuição', 'domínio público'):
        caso('privado com licenca aberta (%s)' % lic, lambda j, lic=lic: j['fonte'].update(privado=True, licenca=lic),
             'licença aberta')
    # a mesma licenca aberta com privado false vale (controle)
    js = copy.deepcopy(boa)
    js['fonte']['licenca'] = 'CC BY-NC-SA 4.0'
    c = gravar_json(os.path.join(pdfs, 'licenca_aberta_publica.json'), js)
    r = recusa_do_gerador(lambda: gerar(c, os.path.join(temp, 'licenca_aberta_publica'), gravar_zip=False))
    placar.conferir('validacao: licenca aberta com privado false vale', [r] if r else [])
    # chave repetida: o json.load ficaria com a ultima, calado
    texto_boa = json.dumps(boa, ensure_ascii=False, indent=1)
    repetidas = (
        ('privado repetido', texto_boa.replace('"privado": false', '"privado": true, "privado": false', 1),
         "'privado' repetida"),
        ('licenca repetida', texto_boa.replace('"licenca": ', '"licenca": "outra", "licenca": ', 1),
         "'licenca' repetida"),
        ('chave repetida dentro do item', texto_boa.replace('"serie": "3ano"', '"serie": "3ano", "serie": "4ano"', 1),
         "'serie' repetida"),
        ('chave repetida dentro do recorte', texto_boa.replace('"pagina": 1,', '"pagina": 1, "pagina": 2,', 1),
         "'pagina' repetida"),
    )
    for nome, txt, motivo in repetidas:
        assert txt != texto_boa, nome
        c = os.path.join(pdfs, 'v_%s.json' % nome)
        io.open(c, 'w', encoding='utf-8').write(txt)
        r = recusa_do_gerador(lambda: gerar(c, os.path.join(temp, 'v_' + nome), gravar_zip=False))
        placar.conferir('validacao: ' + nome, [r] if r else [], True, motivo)

    # a linha de comando: --itens-curados so com esta fonte, e esta fonte sem --pdfs nem --serie
    c = gravar_json(os.path.join(pdfs, 'boa.json'), boa)
    r = recusa_do_gerador(lambda: pelo_principal(['--fonte', 'cadernos-sme-sp', '--pdfs', pdfs, '--vinculos', 'x.csv',
                                                  '--curadoria', temp, '--versao', '1', '--saida', temp,
                                                  '--itens-curados', c]))
    placar.conferir('linha de comando: --itens-curados com outra fonte', [r] if r else [], True,
                    '--itens-curados so vale com --fonte lista-curada')
    for extra in (['--pdfs', pdfs], ['--serie', '3ano']):
        r = recusa_do_gerador(lambda: pelo_principal(['--fonte', 'lista-curada', '--itens-curados', c, '--versao', '1',
                                                      '--saida', temp] + extra))
        placar.conferir('linha de comando: %s com --fonte lista-curada' % extra[0], [r] if r else [], True,
                        'nao vale com --fonte lista-curada')
    # argparse sai com codigo 2 (SystemExit(2)), sem frase: basta parar
    try:
        pelo_principal(['--fonte', 'lista-curada', '--versao', '1', '--saida', temp])
        parou = False
    except SystemExit:
        parou = True
    placar.conferir('linha de comando: --fonte lista-curada sem --itens-curados para', [] if parou else ['seguiu'])


# ------------------------------------------------------------------ gabarito e so com resposta

def trava_gabarito_so_com_resposta(q, p):
    erros = []
    ficam = {'coletanea-inventada:3ano:1.1', 'coletanea-inventada:4ano:2.2', 'coletanea-inventada:5ano:3.1'}
    if {i['id'] for i in q.itens} != ficam:
        erros.append('ficaram %r, e com gabarito so %r' % (sorted(i['id'] for i in q.itens), sorted(ficam)))
    num_sem = {i['id']: i['numero'] for i in p.itens}
    for it in q.itens:
        if it['numero'] != num_sem.get(it['id']):
            erros.append('%s: numero %r, e sem a opcao era %r' % (it['id'], it['numero'], num_sem.get(it['id'])))
        g = it.get('gabarito') or {}
        if g.get('origem') != 'agente-conferido' or not g.get('respostas'):
            erros.append('%s: sem o gabarito de fora' % it['id'])
    subs = [r['subitem'] for r in (next((i for i in q.itens if i['id'] == 'coletanea-inventada:3ano:1.1'), {}).get('gabarito') or {})
            .get('respostas', [])]
    if subs != ['A', 'B']:
        erros.append('coletanea-inventada:3ano:1.1: subitens do gabarito %r fora da ordem do item' % subs)
    c = q.manifest['contagens']
    if (c.get('itens'), c.get('itens_com_gabarito_agente'), c.get('itens_com_gabarito_agente_parcial'),
            c.get('itens_sem_resposta_excluidos')) != (3, 3, 0, 2):
        erros.append('contagens %r' % c)
    tirados = sorted(e['id'] for e in q.relatorio.get('sem_resposta') or [])
    if tirados != ['coletanea-inventada:3ano:1.2', 'coletanea-inventada:4ano:2.1']:
        erros.append('sem_resposta do relatorio %r' % tirados)
    if q.relatorio.get('tema_de_outro_ano'):
        erros.append('tema_de_outro_ano ainda cita o item tirado: %r' % q.relatorio['tema_de_outro_ano'])
    ids_busca = {r['i'] for r in q.busca['temas']}
    for iid in tirados:
        if iid in ids_busca:
            erros.append('%s: tirado e ainda na busca' % iid)
    usados = {i['assets']['enunciado'] for i in q.itens}
    sobra = [k for k in q.manifest['arquivos'] if k.startswith('assets/') and k not in usados]
    if sobra:
        erros.append('SVG sem item no manifest: %r' % sobra)
    return erros


def gabarito_so_com_resposta(temp, pdfs, placar, p):
    js = gravar_json(os.path.join(pdfs, 'boa_gab.json'), json_da_amostra())
    gab = gravar_json(os.path.join(temp, 'gabarito.json'), GABARITO)
    t = os.path.join(temp, 'cli_gab')
    pelo_principal(['--fonte', 'lista-curada', '--itens-curados', js, '--versao', '1', '--saida', t + '_zip',
                    '--trabalho', t, '--gerado-em', GERADO_EM, '--commit', 'amostra',
                    '--gabarito-externo', gab, '--so-com-resposta'])
    q = pg.Pacote(t, pdfs)
    placar.conferir('gabarito: --gabarito-externo com --so-com-resposta pela linha de comando',
                    trava_gabarito_so_com_resposta(q, p))
    placar.conferir('gabarito: manifesto e zip', pg.trava_manifesto(q, os.path.join(t + '_zip',
                                                                                    'matematica-%s-v1.zip' % ID_FONTE)))
    # veneno: a mesma trava sobre o pacote sem a opcao reprova
    placar.conferir('gabarito: o pacote sem a opcao', trava_gabarito_so_com_resposta(p, p), True, 'ficaram')
    # so o gabarito, sem tirar: os quatro ficam, dois com gabarito
    t2 = os.path.join(temp, 'cli_gab_so')
    pelo_principal(['--fonte', 'lista-curada', '--itens-curados', js, '--versao', '1', '--saida', t2 + '_zip',
                    '--trabalho', t2, '--gerado-em', GERADO_EM, '--commit', 'amostra', '--sem-zip',
                    '--gabarito-externo', gab])
    q2 = pg.Pacote(t2, pdfs)
    c = q2.manifest['contagens']
    placar.conferir('gabarito: sem --so-com-resposta os cinco ficam, tres com gabarito',
                    [] if (c['itens'], c.get('itens_com_gabarito_agente')) == (5, 3) else ['contagens %r' % c])
    # gabarito para item que nao existe na lista: recusado como nas outras fontes
    ruim = gravar_json(os.path.join(temp, 'gabarito_ruim.json'),
                       GABARITO + [{'id_item': 'coletanea-inventada:9ano:9.9', 'subitem': None, 'resposta': '1',
                                    'origem': 'agente-conferido'}])
    r = recusa_do_gerador(lambda: pelo_principal(['--fonte', 'lista-curada', '--itens-curados', js, '--versao', '1',
                                                  '--saida', t2 + '_zip', '--trabalho', t2 + 'r', '--sem-zip',
                                                  '--gabarito-externo', ruim]))
    placar.conferir('gabarito: entrada de item que nao esta na lista', [r] if r else [], True, 'nao e item deste pacote')
    # chave repetida no gabarito de fora: o json.load ficaria com a ultima resposta, calado
    rep = os.path.join(temp, 'gabarito_repetido.json')
    io.open(rep, 'w', encoding='utf-8').write(json.dumps(GABARITO, ensure_ascii=False).replace(
        '"resposta": "3"', '"resposta": "9", "resposta": "3"', 1))
    r = recusa_do_gerador(lambda: gp.ler_gabarito_externo(rep))
    placar.conferir('gabarito: chave repetida no gabarito de fora', [r] if r else [], True, "'resposta' repetida")


# ------------------------------------------------------------------ amostra

def amostra(temp, placar):
    pdfs = fazer_pdfs(os.path.join(temp, 'pdfs'))
    js = json_da_amostra()
    c = gravar_json(os.path.join(pdfs, 'itens.json'), js)
    a = os.path.join(temp, 'a')
    gerar(c, a)
    p = pg.Pacote(a, pdfs)
    print('amostra: %d itens, %d excluidos' % (len(p.itens), len(p.relatorio['excluidos'])))
    gerar(c, os.path.join(temp, 'b'), commit='outro', gerado_em='2031-01-01T00:00:00-03:00')
    placar.conferir('lista curada: determinismo', pg.trava_determinismo(p, pg.Pacote(os.path.join(temp, 'b'), pdfs)))
    placar.conferir('lista curada: campos e ordem do json', trava_campos(p, js))
    placar.conferir('lista curada: texto do recorte, sem o vizinho, e busca', trava_texto(p))
    placar.conferir('lista curada: SVG desenhado igual a pagina', trava_desenho(p, pdfs))
    placar.conferir('lista curada: assunto de outro ano no relatorio', trava_relatorio(p))
    placar.conferir('lista curada: svg', pg.trava_svg(p))
    placar.conferir('lista curada: xml', pg.trava_xml(p))
    placar.conferir('lista curada: manifesto e zip',
                    pg.trava_manifesto(p, os.path.join(a + '_zip', 'matematica-%s-v1.zip' % ID_FONTE)))
    placar.conferir('lista curada: tracos', pg.trava_tracos(p))
    placar.conferir('lista curada: nada excluido', ['excluidos %r' % p.relatorio['excluidos']]
                    if p.relatorio['excluidos'] else [])
    # venenos das travas do caminho feliz: cada uma ve o defeito
    js_v = copy.deepcopy(js)
    js_v['itens'][0]['subitens'] = ['A']
    placar.conferir('lista curada: subitem que o json nao diz', trava_campos(p, js_v), True, 'subitens')
    js_v = copy.deepcopy(js)
    js_v['itens'][0]['recorte']['rect'] = [50, 62, 300, 340]
    gerar(gravar_json(os.path.join(pdfs, 'vizinho.json'), js_v), os.path.join(temp, 'v_vizinho'), gravar_zip=False)
    placar.conferir('lista curada: caixa que pega o vizinho', trava_texto(pg.Pacote(os.path.join(temp, 'v_vizinho'), pdfs)),
                    True, 'vizinho')
    q = pg.copia(p, temp, 'v_svg_trocado')
    it = next(i for i in q.itens if i['id'] == 'coletanea-inventada:4ano:2.2')
    outro = next(i for i in q.itens if i['id'] == 'coletanea-inventada:4ano:2.1')
    pg.regravar_asset(q, it['assets']['enunciado'], q.bytes_de(outro['assets']['enunciado']))
    placar.conferir('lista curada: SVG de outro recorte do mesmo tamanho', trava_desenho(q, pdfs), True, 'difere')
    # privado: o manifest diz o que o json diz
    placar.conferir('privado: false no json, false no manifest', trava_privado(p, False))
    cp = gravar_json(os.path.join(pdfs, 'privado.json'), json_da_amostra(privado=True))
    gerar(cp, os.path.join(temp, 'privado'), gravar_zip=False)
    pp = pg.Pacote(os.path.join(temp, 'privado'), pdfs)
    placar.conferir('privado: true no json, true no manifest', trava_privado(pp, True))
    placar.conferir('privado: so o manifest muda', [] if {k: v for k, v in pp.manifest['arquivos'].items()} ==
                    p.manifest['arquivos'] else ['os arquivos do pacote mudaram com privado'])
    placar.conferir('privado: true lido como false', trava_privado(pp, False), True, 'manifest privado')
    # sem fonte real: outro nome no json, tudo com o nome novo
    cn = gravar_json(os.path.join(pdfs, 'outro_nome.json'),
                     json_da_amostra(nome='Antologia Imaginaria', id_fonte='antologia-imaginaria'))
    gerar(cn, os.path.join(temp, 'outro_nome'), gravar_zip=False)
    qn = pg.Pacote(os.path.join(temp, 'outro_nome'), pdfs)
    placar.conferir('sem fonte real: so o que o json disse', trava_sem_fonte_real(p, qn, 'Antologia Imaginaria'))
    placar.conferir('sem fonte real: pacote do nome antigo como se fosse o novo', trava_sem_fonte_real(p, p, 'Antologia'),
                    True, 'nome')
    # o CropBox fora do MediaBox: acertado na copia aberta, com nota, e o desenho igual (trava_desenho acima)
    notas = [n for n in p.relatorio['notas'] if 'CropBox' in n]
    placar.conferir('lista curada: CropBox fora do MediaBox acertado, com nota',
                    [] if len(notas) == 1 and notas[0].startswith('caderno-c.pdf p1') else ['notas %r' % p.relatorio['notas']])
    antes = lista_curada.acertar_cropbox
    lista_curada.acertar_cropbox = lambda doc, pno, notas: None
    try:
        # sem acertar, ou o gerador quebra (o CropBox do recorte fora do MediaBox)
        # ou o SVG sai deslocado (o recorte somado a posicao do CropBox)
        gerar(c, os.path.join(temp, 'v_cropbox'), gravar_zip=False)
        r = trava_desenho(pg.Pacote(os.path.join(temp, 'v_cropbox'), pdfs))
    except Exception as e:  # noqa: BLE001
        r = ['coletanea-inventada:5ano:3.1: sem acertar o CropBox o gerador quebra: %s' % e]
    finally:
        lista_curada.acertar_cropbox = antes
    placar.conferir('lista curada: CropBox fora do MediaBox sem acertar', r, True, 'coletanea-inventada:5ano:3.1')
    casos_de_pagina(temp, pdfs, placar)
    tracos_e_repositorio(temp, pdfs, placar)
    outro_checkout(temp, pdfs, placar)
    tinta_clara_e_cabecalho(temp, pdfs, placar)
    confere_cabecalho(temp, pdfs, placar)
    pilha_trocada(temp, pdfs, c, placar)
    paginas_no_texto(placar)
    venenos_de_validacao(temp, pdfs, placar)
    gabarito_so_com_resposta(temp, pdfs, placar, p)


def um_item(pdfs, nome, item):
    js = json_da_amostra()
    js['itens'] = [dict(item, id=ID_FONTE + ':' + item['id'])]
    return gravar_json(os.path.join(pdfs, nome + '.json'), js)


def casos_de_pagina(temp, pdfs, placar):
    # MediaBox fora da origem: recorta certo, sem acerto nem nota
    for k, nome, notas_esperadas in ((1, 'mediabox_deslocado', 0), (2, 'cropbox_fora_do_deslocado', 1)):
        c = um_item(pdfs, nome, {'id': '5ano:5.%d' % k, 'serie': '5ano', 'tema_app': 'MAT05-02',
                                 'modulo': {'slug': 'contas', 'titulo': 'Contas'}, 'titulo': 'Atividade 5.%d' % k,
                                 'subitens': [], 'confere': 'Atividade 5.%d' % k,
                                 'recorte': {'pdf': 'caderno-e.pdf', 'pagina': k, 'rect': [0, 20, 595, 110]}})
        t = os.path.join(temp, nome)
        r = recusa_do_gerador(lambda: gerar(c, t, gravar_zip=False))
        if r:
            placar.conferir('pagina: %s' % nome, ['recusado: %s' % r])
            continue
        q = pg.Pacote(t, pdfs)
        notas = [n for n in q.relatorio['notas'] if 'CropBox' in n]
        placar.conferir('pagina: %s, desenho certo e %d nota de CropBox' % (nome, notas_esperadas),
                        trava_desenho(q, pdfs) + ([] if len(notas) == notas_esperadas else ['notas %r' % notas]))


def tracos_e_repositorio(temp, pdfs, placar):
    # travessao no nome da fonte nao chega ao pacote
    js = json_da_amostra(nome='Coletânea \u2014 Inventada')
    c = gravar_json(os.path.join(pdfs, 'travessao.json'), js)
    gerar(c, os.path.join(temp, 'travessao'), gravar_zip=False)
    placar.conferir('tracos: travessao no nome da fonte vira hifen', pg.trava_tracos(pg.Pacote(os.path.join(temp, 'travessao'), pdfs)))
    antes = lista_curada.sem_tracos
    lista_curada.sem_tracos = lambda t: t
    try:
        gerar(c, os.path.join(temp, 'v_travessao'), gravar_zip=False)
    finally:
        lista_curada.sem_tracos = antes
    placar.conferir('tracos: sem o sem_tracos', pg.trava_tracos(pg.Pacote(os.path.join(temp, 'v_travessao'), pdfs)),
                    True, 'travessao')
    # privado true com a saida dentro do repositorio: recusado antes de gravar
    cp = gravar_json(os.path.join(pdfs, 'privado_repo.json'), json_da_amostra(privado=True))
    dentro = os.path.join(RAIZ, '_saida_privada_da_prova')
    r = recusa_do_gerador(lambda: lista_curada.gerar(cp, 1, dentro, trabalho=os.path.join(temp, 'fora'),
                                                     gerado_em=GERADO_EM, commit='amostra', gravar_zip=True))
    criou = os.path.exists(dentro)
    if criou:
        shutil.rmtree(dentro, ignore_errors=True)
    placar.conferir('privado no repo: --saida dentro do repositorio', ([r] if r else []) +
                    (['dentro do repositório: criou a pasta'] if criou else []), True, 'dentro do repositório')
    r = recusa_do_gerador(lambda: lista_curada.gerar(cp, 1, os.path.join(temp, 'fora_zip'),
                                                     trabalho=os.path.join(dentro, 'trabalho'), gerado_em=GERADO_EM,
                                                     commit='amostra', gravar_zip=False))
    criou = os.path.exists(dentro)
    if criou:
        shutil.rmtree(dentro, ignore_errors=True)
    placar.conferir('privado no repo: pasta de trabalho dentro do repositorio', ([r] if r else []) +
                    (['dentro do repositório: criou a pasta'] if criou else []), True, 'dentro do repositório')
    # privado false dentro do repositorio nao e assunto desta regra: so o controle de que a regra e do privado
    placar.conferir('privado no repo: a regra so vale para privado',
                    [] if not lista_curada.dentro_do_repositorio(temp) and lista_curada.dentro_do_repositorio(dentro)
                    else ['dentro_do_repositorio errou'])


def outro_checkout(temp, pdfs, placar):
    """privado true com a saida dentro de um checkout git que nao e este: recusado."""
    clone = os.path.join(temp, 'outro_clone')
    os.makedirs(clone)
    r = subprocess.run(['git', 'init', '-q', clone], capture_output=True, text=True)
    if r.returncode != 0 or not os.path.isdir(os.path.join(clone, '.git')):
        placar.conferir('privado no repo: git init fora deste', ['git init falhou: %s' % r.stderr.strip()[:200]])
        return
    worktree = os.path.join(temp, 'outro_worktree')
    os.makedirs(worktree)
    io.open(os.path.join(worktree, '.git'), 'w', encoding='utf-8').write('gitdir: %s\n' % os.path.join(clone, '.git'))
    if lista_curada.dentro_do_repositorio(temp):
        placar.conferir('privado no repo: a pasta temporaria da prova', ['ja esta dentro de um checkout git'])
        return
    cp = gravar_json(os.path.join(pdfs, 'privado_clone.json'), json_da_amostra(privado=True))
    cl = gravar_json(os.path.join(pdfs, 'publico_clone.json'), json_da_amostra(privado=False))

    def tenta(js, saida, trabalho):
        return recusa_do_gerador(lambda: lista_curada.gerar(js, 1, saida, trabalho=trabalho, gerado_em=GERADO_EM,
                                                            commit='amostra', gravar_zip=True))
    for nome, raiz in (('git init fora deste', clone), ('.git em arquivo, como no worktree', worktree)):
        saida = os.path.join(raiz, 'pacotes', 'saida')
        r = tenta(cp, saida, os.path.join(temp, 'fora_clone_t'))
        placar.conferir('privado no repo: --saida dentro de outro checkout (%s)' % nome,
                        ([r] if r else []) + (['criou a saida'] if os.path.exists(saida) else []), True,
                        'dentro do repositório git')
    r = tenta(cp, os.path.join(clone, 's'), os.path.join(clone, 't'))
    placar.conferir('privado no repo: as duas dentro de outro checkout, ficam', [r] if r else [], True,
                    'a pasta de trabalho ficam dentro')
    saida = os.path.join(clone, 'pacotes', 'publico')
    r = tenta(cl, saida, os.path.join(clone, 'trabalho_publico'))
    placar.conferir('privado no repo: privado false dentro de outro checkout vale',
                    ([r] if r else []) + ([] if os.path.exists(saida) else ['nao gravou a saida']))
    # veneno: a trava de antes, que so olhava este repositorio, deixa passar
    antes = lista_curada.dentro_do_repositorio

    def so_este(caminho):
        a, b = os.path.normcase(os.path.realpath(caminho)), os.path.normcase(os.path.realpath(RAIZ))
        try:
            return RAIZ if os.path.commonpath([a, b]) == b else None
        except ValueError:
            return None
    lista_curada.dentro_do_repositorio = so_este
    try:
        saida = os.path.join(clone, 'pacotes', 'veneno')
        r = tenta(cp, saida, os.path.join(temp, 'fora_clone_v'))
    finally:
        lista_curada.dentro_do_repositorio = antes
    placar.conferir('privado no repo: a trava que so olha este repositorio', [] if r else ['gravou %s' % saida],
                    True, 'gravou')


def tinta_clara_e_cabecalho(temp, pdfs, placar):
    """caderno-f.pdf: p. 1 so uma figura cinza clara, p. 2 so uma amarelo
    palido, p. 3 um preenchimento branco puro, p. 4 um cabecalho que o PDF le
    antes do item, acima dele."""
    doc = pymupdf.open()
    for cor in ((0.85, 0.85, 0.85), (1, 1, 0.8), (1, 1, 1)):
        p = doc.new_page(width=W, height=H)
        p.draw_rect(pymupdf.Rect(80, 100, 400, 300), color=None, fill=cor)
    p = doc.new_page(width=W, height=H)
    linhas(p, 60, 60, ['Caderno de exercicios, unidade 7'])
    linhas(p, 60, 100, ['Atividade 7.1', 'Quanto e 6 vezes 7?'])
    # p. 5: a caixa alta demais pega o item de antes inteiro e depois o certo
    p = doc.new_page(width=W, height=H)
    linhas(p, 60, 60, ['Atividade 7.0', 'Quanto e 2 + 2?'])
    linhas(p, 60, 110, ['Atividade 7.1', 'Quanto e 6 vezes 7?'])
    # p. 6: a pagina errada, com um paragrafo no alto e o texto so mais abaixo
    p = doc.new_page(width=W, height=H)
    linhas(p, 60, 60, ['Leia com atencao antes de comecar.', 'Use lapis e borracha.'])
    linhas(p, 60, 110, ['Atividade 7.1', 'Quanto e 6 vezes 7?'])
    # p. 7: pagina creme inteira, com uma figura longe da caixa
    p = doc.new_page(width=W, height=H)
    p.draw_rect(p.rect, color=None, fill=(0.97, 0.96, 0.92))
    p.draw_rect(pymupdf.Rect(80, 600, 400, 700), color=None, fill=(0.2, 0.2, 0.2))
    # p. 8: um painel cinza claro toma a pagina, com um retangulo branco vazio
    p = doc.new_page(width=W, height=H)
    p.draw_rect(p.rect, color=None, fill=(0.88, 0.88, 0.88))
    p.draw_rect(pymupdf.Rect(80, 100, 400, 300), color=None, fill=(1, 1, 1))
    salvar(doc, os.path.join(pdfs, 'caderno-f.pdf'))

    def item(k, rect, **extra):
        return um_item(pdfs, 'tinta_%d' % k, dict({'id': '5ano:7.%d' % k, 'serie': '5ano', 'tema_app': 'MAT05-02',
                                                   'modulo': {'slug': 'contas', 'titulo': 'Contas'},
                                                   'titulo': 'Atividade 7.%d' % k, 'subitens': [],
                                                   'recorte': {'pdf': 'caderno-f.pdf', 'pagina': k, 'rect': rect}},
                                                  **extra))
    clara = (('cinza claro 0.85', item(1, [100, 120, 380, 280])), ('amarelo palido', item(2, [100, 120, 380, 280])))
    for nome, c in clara:
        r = recusa_do_gerador(lambda: gerar(c, os.path.join(temp, 'tinta_' + nome.split()[0]), gravar_zip=False))
        placar.conferir('tinta clara: so figura %s, sem texto, vale' % nome, [r] if r else [])
    c = item(3, [100, 120, 380, 280])
    r = recusa_do_gerador(lambda: gerar(c, os.path.join(temp, 'tinta_branca'), gravar_zip=False))
    placar.conferir('tinta clara: caixa sobre branco puro', [r] if r else [], True, 'caixa em branco')
    c = item(7, [100, 120, 380, 280])
    r = recusa_do_gerador(lambda: gerar(c, os.path.join(temp, 'tinta_creme'), gravar_zip=False))
    placar.conferir('tinta clara: area vazia de pagina creme', [r] if r else [], True, 'caixa em branco')
    antes = lista_curada.cor_do_papel
    lista_curada.cor_do_papel = lambda doc, pno: (255, 255, 255)
    try:
        r = recusa_do_gerador(lambda: gerar(c, os.path.join(temp, 'tinta_v_creme'), gravar_zip=False))
    finally:
        lista_curada.cor_do_papel = antes
    placar.conferir('tinta clara: medir contra o branco, na pagina creme', [] if r else ['a area creme passou'],
                    True, 'passou')
    c = item(8, [100, 120, 380, 280])
    r = recusa_do_gerador(lambda: gerar(c, os.path.join(temp, 'tinta_painel'), gravar_zip=False))
    placar.conferir('tinta clara: branco vazio numa pagina tomada por painel claro', [r] if r else [], True,
                    'caixa em branco')
    lista_curada.TINTA_LONGE_DO_BRANCO = False
    try:
        r = recusa_do_gerador(lambda: gerar(c, os.path.join(temp, 'tinta_v_painel'), gravar_zip=False))
    finally:
        lista_curada.TINTA_LONGE_DO_BRANCO = True
    placar.conferir('tinta clara: medir so contra o papel, no branco do painel', [] if r else ['o branco passou'],
                    True, 'passou')
    antes = lista_curada.TINTA_TOL
    lista_curada.TINTA_TOL = 55
    try:
        for nome, c in clara:
            r = recusa_do_gerador(lambda: gerar(c, os.path.join(temp, 'tinta_v_' + nome.split()[0]), gravar_zip=False))
            placar.conferir('tinta clara: a tolerancia larga (55, como o cinza 200) com figura %s' % nome,
                            [r] if r else [], True, 'caixa em branco')
    finally:
        lista_curada.TINTA_TOL = antes
    c = item(4, [50, 48, 400, 140], confere='Atividade 7.1 Quanto e 6')
    r = recusa_do_gerador(lambda: gerar(c, os.path.join(temp, 'titulo_que_nao_se_repete'), gravar_zip=False))
    placar.conferir('confere: titulo de uma linha que nao se repete', [r] if r else [], True,
                    'não começa por confere')
    antes = lista_curada.comecos_do_recorte
    for k, nome in ((5, 'caixa alta demais com o item de antes e o confere do item'),
                    (6, 'pagina errada com o texto so num bloco mais abaixo')):
        c = item(k, [50, 48, 400, 140], confere='Atividade 7.1 Quanto e 6')
        r = recusa_do_gerador(lambda: gerar(c, os.path.join(temp, 'confere_%d' % k), gravar_zip=False))
        placar.conferir('confere: %s' % nome, [r] if r else [], True, 'não começa por confere')
        # e as duas caixas sao de verdade o defeito: o comeco de qualquer bloco as aceitaria

        def qualquer_bloco(docs, ps):
            c0, pno0, r0 = ps[0]
            bl = sorted((b for b in docs[c0][pno0].get_text('blocks', clip=pymupdf.Rect(r0)) if b[6] == 0),
                        key=lambda b: (b[1], b[0]))
            return antes(docs, ps) + [''.join(b[4] for b in bl[k:]) for k in range(len(bl))]
        lista_curada.comecos_do_recorte = qualquer_bloco
        try:
            r = recusa_do_gerador(lambda: gerar(c, os.path.join(temp, 'confere_v%d' % k), gravar_zip=False))
        finally:
            lista_curada.comecos_do_recorte = antes
        placar.conferir('confere: o comeco de qualquer bloco, na %s' % nome, [] if r else ['a caixa passou'], True,
                        'passou')


def regra_dos_18_pt_da_caixa(docs, ps):
    """A regra recusada na revisao (8c870f4): pula o primeiro bloco se e uma
    linha so nos 18 pt do alto da CAIXA. So para o veneno."""
    resto = ''.join(gp.texto_do_retangulo(docs[c], pno, r) for c, pno, r in ps[1:])
    c0, pno0, r0 = ps[0]
    out = [gp.texto_do_retangulo(docs[c0], pno0, r0) + resto]
    bl = lista_curada.blocos_de_texto(docs[c0][pno0], pymupdf.Rect(r0))
    if len(bl) >= 2 and len(bl[0][1]) == 1 and bl[0][0][3] <= r0[1] + 18:
        out.append('\n'.join(t for _, lns in bl[1:] for t in lns) + '\n' + resto)
    return out


def cabecalho_de_17dfb6a(doc, pno, bbox, linha):
    """A regra do 17dfb6a, que no PDF de uma pagina so aceitava o primeiro
    bloco de uma linha na faixa do alto. So para o veneno."""
    faixa = lista_curada.faixa_de_cabecalho(doc[pno])
    alvo = lista_curada.so_letras(linha)
    if not alvo or bbox[1] < faixa.y0 - 0.01 or bbox[3] > faixa.y1 + 0.01:
        return False
    if doc.page_count == 1:
        todos = lista_curada.blocos_de_texto(doc[pno])
        return bool(todos) and len(todos[0][1]) == 1 and lista_curada.so_letras(todos[0][1][0]) == alvo
    return False


def confere_cabecalho(temp, pdfs, placar):
    """caderno-g.pdf: p. 1 a 3 com o cabecalho corrido no alto, o item 7.1 na
    p. 2; p. 4 a pagina trocada (um gabarito) com titulo de uma linha no alto e
    o texto esperado logo abaixo; p. 5 a ultima linha do item de antes
    ("Resposta: ____") no alto; p. 6 um item de antes de uma linha no alto.
    caderno-i.pdf: uma pagina so, com titulo e o item. caderno-j.pdf: uma
    pagina so, com um item vizinho de uma linha no alto e o item abaixo."""
    cab = 'Caderno de exercicios, unidade 7'
    doc = pymupdf.open()
    for primeira, resto_ in (([cab], ['Atividade 6.9', 'Quanto e 5 vezes 5?']),
                             ([cab], ['Atividade 7.1', 'Quanto e 6 vezes 7?']),
                             ([cab], ['Atividade 7.2', 'Quanto e 8 menos 3?']),
                             (['Gabarito da unidade 7'], ['Atividade 7.1', 'Quanto e 6 vezes 7? Resposta: 42'])):
        p = doc.new_page(width=W, height=H)
        linhas(p, 60, 45, primeira)
        linhas(p, 60, 85, resto_)
    for primeira in ('Resposta: ________', '7.0) Quanto e 2 + 2? ____'):
        p = doc.new_page(width=W, height=H)
        linhas(p, 60, 45, [primeira])
        linhas(p, 60, 85, ['Atividade 7.1', 'Quanto e 6 vezes 7?'])
    salvar(doc, os.path.join(pdfs, 'caderno-g.pdf'))
    doc = pymupdf.open()
    p = doc.new_page(width=W, height=H)
    linhas(p, 60, 45, ['Lista avulsa de exercicios'])
    linhas(p, 60, 85, ['Atividade 7.1', 'Quanto e 6 vezes 7?'])
    salvar(doc, os.path.join(pdfs, 'caderno-i.pdf'))
    doc = pymupdf.open()
    p = doc.new_page(width=W, height=H)
    linhas(p, 60, 45, ['7.0) Quanto e 2 + 2? ____'])
    linhas(p, 60, 85, ['Atividade 7.1', 'Quanto e 6 vezes 7?'])
    salvar(doc, os.path.join(pdfs, 'caderno-j.pdf'))

    def item(pdf, pag, nome):
        return um_item(pdfs, 'confere_' + nome, {'id': '5ano:7.1', 'serie': '5ano', 'tema_app': 'MAT05-02',
                                                  'modulo': {'slug': 'contas', 'titulo': 'Contas'},
                                                  'titulo': 'Atividade 7.1', 'subitens': [],
                                                  'confere': 'Atividade 7.1 Quanto e 6',
                                                  'recorte': {'pdf': pdf, 'pagina': pag, 'rect': [50, 32, 400, 130]}})
    corrido = item('caderno-g.pdf', 2, 'corrido')
    r = recusa_do_gerador(lambda: gerar(corrido, os.path.join(temp, 'cab_corrido'), gravar_zip=False))
    placar.conferir('confere: cabecalho corrido acima do texto esperado vale', [r] if r else [])
    # PDF de uma pagina so: nenhuma folga, nem para o titulo da pagina
    unicas = (('titulo da pagina unica acima do texto esperado', item('caderno-i.pdf', 1, 'pagina_unica')),
              ('pagina unica com item vizinho de uma linha numa caixa alta', item('caderno-j.pdf', 1, 'vizinho_unica')))
    antes_cab = lista_curada.e_cabecalho_da_pagina
    for k, (nome, c) in enumerate(unicas):
        r = recusa_do_gerador(lambda: gerar(c, os.path.join(temp, 'unica_%d' % k), gravar_zip=False))
        placar.conferir('confere: ' + nome, [r] if r else [], True, 'não começa por confere')
        lista_curada.e_cabecalho_da_pagina = cabecalho_de_17dfb6a
        try:
            r = recusa_do_gerador(lambda: gerar(c, os.path.join(temp, 'unica_v%d' % k), gravar_zip=False))
        finally:
            lista_curada.e_cabecalho_da_pagina = antes_cab
        placar.conferir('confere: a regra do 17dfb6a, na %s' % nome, [] if r else ['a caixa passou'], True, 'passou')
    antes = lista_curada.comecos_do_recorte
    lista_curada.comecos_do_recorte = lambda docs, ps: antes(docs, ps)[:1]
    try:
        r = recusa_do_gerador(lambda: gerar(corrido, os.path.join(temp, 'cab_v_natural'), gravar_zip=False))
    finally:
        lista_curada.comecos_do_recorte = antes
    placar.conferir('confere: so a ordem natural do PDF, com o cabecalho corrido', [r] if r else [], True,
                    'não começa por confere')
    ruins = (('pagina trocada por uma, com o cabecalho corrido', item('caderno-g.pdf', 3, 'trocada_por_uma')),
             ('pagina trocada (gabarito) com titulo de uma linha', item('caderno-g.pdf', 4, 'gabarito')),
             ('ultima linha do item de antes (Resposta: ____)', item('caderno-g.pdf', 5, 'resposta')),
             ('item de antes de uma linha', item('caderno-g.pdf', 6, 'item_de_uma_linha')))
    for k, (nome, c) in enumerate(ruins):
        r = recusa_do_gerador(lambda: gerar(c, os.path.join(temp, 'cab_ruim_%d' % k), gravar_zip=False))
        placar.conferir('confere: ' + nome, [r] if r else [], True, 'não começa por confere')
        if k == 0:
            continue
        # e a caixa e de verdade o defeito: a regra dos 18 pt da caixa a aceitaria
        lista_curada.comecos_do_recorte = regra_dos_18_pt_da_caixa
        try:
            r = recusa_do_gerador(lambda: gerar(c, os.path.join(temp, 'cab_v18_%d' % k), gravar_zip=False))
        finally:
            lista_curada.comecos_do_recorte = antes
        placar.conferir('confere: a regra dos 18 pt da caixa, na %s' % nome, [] if r else ['a caixa passou'], True,
                        'passou')


def pilha_trocada(temp, pdfs, c, placar):
    antes = gp.empilhar
    gp.empilhar = lambda svgs, meds: antes(list(reversed(svgs)), list(reversed(meds)))
    try:
        gerar(c, os.path.join(temp, 'v_pilha'), gravar_zip=False)
    finally:
        gp.empilhar = antes
    q = pg.Pacote(os.path.join(temp, 'v_pilha'), pdfs)
    placar.conferir('empilhado: pilha na ordem trocada', trava_desenho(q, pdfs), True, 'pedaco 1')


def paginas_no_texto(placar):
    casos = {(12,): 'p. 12', (12, 13): 'p. 12 a 13', (12, 13, 14): 'p. 12 a 14', (12, 15): 'p. 12 e 15',
             (12, 14, 15): 'p. 12, 14 e 15'}
    erros = ['%r deu %r' % (k, lista_curada.texto_das_paginas(list(k))) for k, v in casos.items()
             if lista_curada.texto_das_paginas(list(k)) != v]
    placar.conferir('paginas: seguidas com "a", com buraco com "e"', erros)


# ------------------------------------------------------------------ byte a byte contra a main

MOTOR = r'''
import io, json, os, sys, hashlib
raiz, saida = sys.argv[1], sys.argv[2]
sys.path.insert(0, os.path.join(raiz, 'biblioteca'))
sys.path.insert(0, os.path.join(raiz, 'biblioteca', '_amostra'))
import gerar_pacote as gp
import _prova_gerador as pg
import fazer_amostra, fazer_amostra_provas, fazer_amostra_cadernos
import _prova_cadernos_sme as pc
gp.confere_versao_do_pymupdf = lambda versao=None: None
cur = pg.curadoria_da_amostra(os.path.join(saida, 'curadoria'))
fixo = ['--versao', '1', '--gerado-em', '2026-11-13T00:00:00-03:00', '--commit', 'amostra']
out = {}
def zipes(nome):
    pasta = os.path.join(saida, nome + '_zip')
    return {n: 'sha256:' + hashlib.sha256(open(os.path.join(pasta, n), 'rb').read()).hexdigest()
            for n in sorted(os.listdir(pasta))}
portal = fazer_amostra.fazer(os.path.join(saida, 'portal')) or os.path.join(saida, 'portal')
gp.principal(['--pdfs', os.path.join(saida, 'portal'), '--serie', '9ano', '--curadoria', cur, '--saida',
              os.path.join(saida, 'portal_zip'), '--trabalho', os.path.join(saida, 'portal_t')] + fixo)
out['portal'] = zipes('portal')
provas = fazer_amostra_provas.fazer(os.path.join(saida, 'provas'))
for fonte, serie, sub in (('mirim', 'm1', 'mirim'), ('enem', '3em', 'enem')):
    gp.principal(['--fonte', fonte, '--pdfs', os.path.join(provas, sub), '--serie', serie, '--curadoria', cur,
                  '--saida', os.path.join(saida, fonte + '_zip'), '--trabalho', os.path.join(saida, fonte + '_t')] + fixo)
    out[fonte] = zipes(fonte)
cad = os.path.join(saida, 'cadernos')
fazer_amostra_cadernos.fazer(cad)
vinc = fazer_amostra_cadernos.vinculos(os.path.join(saida, 'vinculos.csv'))
gab = os.path.join(saida, 'gabarito.json')
io.open(gab, 'w', encoding='utf-8').write(json.dumps(pc.GABARITO_DA_AMOSTRA, ensure_ascii=False))
for nome, extra in (('cad', []), ('cad_gab', ['--gabarito-externo', gab, '--so-com-resposta'])):
    gp.principal(['--fonte', 'cadernos-sme-sp', '--pdfs', cad, '--vinculos', vinc, '--curadoria', cur, '--saida',
                  os.path.join(saida, nome + '_zip'), '--trabalho', os.path.join(saida, nome + '_t')] + fixo + extra)
    out[nome] = zipes(nome)
io.open(os.path.join(saida, 'zips.json'), 'w', encoding='utf-8').write(json.dumps(out, indent=1))
'''


def contra_main(temp, ref, placar):
    arvore = os.path.join(temp, 'ref')
    os.makedirs(arvore)
    tar = os.path.join(temp, 'ref.tar')
    r = subprocess.run(['git', 'archive', '--format=tar', '-o', tar, ref, 'biblioteca', 'busca.js', 'banco'],
                       cwd=RAIZ, capture_output=True, text=True)
    if r.returncode != 0:
        placar.conferir('contra %s: git archive' % ref, ['git archive falhou: %s' % r.stderr.strip()[:200]])
        return
    import tarfile
    with tarfile.open(tar) as t:
        t.extractall(arvore)
    motor = os.path.join(temp, 'motor.py')
    io.open(motor, 'w', encoding='utf-8').write(MOTOR)
    zips = {}
    for nome, raiz in (('esta arvore', RAIZ), (ref, arvore)):
        saida = os.path.join(temp, 'saida_' + ('aqui' if raiz == RAIZ else 'ref'))
        os.makedirs(saida)
        r = subprocess.run([sys.executable, '-I', motor, raiz, saida], capture_output=True, text=True,
                           encoding='utf-8', errors='replace')
        if r.returncode != 0:
            placar.conferir('contra %s: gerar com %s' % (ref, nome), ['falhou: %s' % r.stderr.strip()[-400:]])
            return
        zips[nome] = json.load(io.open(os.path.join(saida, 'zips.json'), encoding='utf-8'))
    a, b = zips['esta arvore'], zips[ref]
    for fonte in sorted(set(a) | set(b)):
        erros = [] if a.get(fonte) == b.get(fonte) else ['%s: zip %r aqui, %r na %s' % (fonte, a.get(fonte), b.get(fonte), ref)]
        placar.conferir('contra %s: %s byte a byte (%s)' % (ref, fonte, ', '.join(
            '%s %s' % (n, h[7:19]) for n, h in sorted((a.get(fonte) or {}).items()))), erros)


def principal():
    ap = argparse.ArgumentParser()
    ap.add_argument('--sem-navegador', action='store_true', help='aceito e sem efeito: esta prova nao abre Chrome')
    ap.add_argument('--contra-main', action='store_true')
    ap.add_argument('--ref', default='origin/main')
    a = ap.parse_args()
    placar = pg.Placar()
    temp = tempfile.mkdtemp(prefix='prova_lista_curada_')
    try:
        if a.contra_main:
            contra_main(temp, a.ref, placar)
        else:
            amostra(temp, placar)
    finally:
        shutil.rmtree(temp, ignore_errors=True)
    print('%d verificacoes passaram, %d falharam' % (placar.ok, placar.falhas))
    sys.exit(1 if placar.falhas else 0)


if __name__ == '__main__':
    principal()
