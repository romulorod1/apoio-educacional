"""Tipo de fonte "lista-curada" do gerador da biblioteca: os itens vem
declarados um a um num json, e o gerador so recorta, empilha e empacota.

    python biblioteca/gerar_pacote.py --fonte lista-curada --itens-curados <itens.json> --versao 1
        --saida <pasta> [--curadoria <Biblioteca/curadoria>] [--gabarito-externo <json>] [--so-com-resposta]

Para que serve. As outras fontes (Portal, provas, Cadernos SME-SP) ACHAM o
item no PDF por regras do proprio modelo de pagina. Aqui ninguem acha nada: a
pessoa que fez a curadoria ja leu a fonte e escreveu, item por item, o
assunto, o titulo, os subitens e a caixa do recorte em pontos do PDF. Este
modulo nao sabe nada de fonte nenhuma (nem titulo, nem sigla, nem modelo de
pagina): tudo vem do json, que mora FORA do repositorio, junto dos PDFs. O
recorte em SVG (gerar_pacote.svg_redigido), o empilhamento dos pedacos, a
busca, o manifest com hash de todo arquivo, o zip deterministico, o
--gabarito-externo e o --so-com-resposta sao os mesmos das outras fontes.

O json (todo campo desconhecido e recusado, em qualquer nivel):

    {
      "fonte": {
        "id": "minha-fonte",            slug: o pacote sai matematica-<id>
        "nome": "Nome da fonte",
        "url": "https://...",
        "licenca": "o texto da licenca",
        "atribuicao": "{fonte}, {serie}, {paginas}, \\"{titulo}\\".",
        "privado": true                 true: o manifest sai com privado true
      },
      "itens": [
        {
          "id": "minha:3ano:1.2",        unico no json
          "serie": "3ano",               1ano a 9ano, ou 1em a 3em
          "tema_app": "MAT03-01",        assunto do banco/topicos/matematica.json
          "modulo": {"slug": "numeros", "titulo": "Numeros"},
          "titulo": "Atividade 1.2",
          "subitens": ["A", "B"],        lista de textos (pode ser vazia)
          "recorte": {"pdf": "caderno.pdf", "pagina": 12, "rect": [x0, y0, x1, y1]}
        }
      ]
    }

- recorte.pdf: caminho do PDF, relativo a pasta do json (ou absoluto).
- recorte.pagina: o numero da pagina no PDF, contando de 1 (como o leitor de
  PDF e como origem.enunciado.pagina no pacote). rect em pontos do PDF, nas
  coordenadas da pagina, inteiro dentro dela.
- recorte que atravessa paginas: {"pdf": ..., "pedacos": [{"pagina": 12,
  "rect": [...]}, {"pagina": 13, "rect": [...]}]} no lugar de pagina e rect;
  os pedacos saem empilhados num SVG so, na ordem do json.
- atribuicao: modelo com {fonte} (o nome), {serie} ("3º ano"), {paginas}
  ("p. 12" ou "p. 12 a 13", as do PDF), {titulo}, {id} e {arquivo} (o nome do
  PDF). Outro nome entre chaves e recusado.
- tema_app pode ser de outro ano que o do item (o mais proximo, quando o ano
  do item nao tem assunto que sirva): vale, e o relatorio lista em
  tema_de_outro_ano.

O item sai como nas outras fontes sem solucao: assets.solucao null,
sem_solucao true, resposta null, dificuldade null (ou a do dificuldade.csv
da curadoria, se houver). O numero e 1, 2, 3... em cada modulo de cada serie,
na ordem do json. Recorte que o apagar de fora muda (a caixa corta tinta de
outra coisa) sai com motivo em excluidos do relatorio, como nas outras fontes.
"""
import collections
import datetime
import io
import json
import os
import re
import string
import sys
import time

import pymupdf

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
sys.path.insert(0, AQUI)
import gerar_pacote  # noqa: E402
import portal  # noqa: E402

CAMPOS_TOPO = ('fonte', 'itens')
CAMPOS_FONTE = ('id', 'nome', 'url', 'licenca', 'atribuicao', 'privado')
CAMPOS_ITEM = ('id', 'serie', 'tema_app', 'modulo', 'titulo', 'subitens', 'recorte')
CAMPOS_MODULO = ('slug', 'titulo')
CAMPOS_PEDACO = ('pagina', 'rect')
CHAVES_DA_ATRIBUICAO = ('fonte', 'serie', 'paginas', 'titulo', 'id', 'arquivo')
SLUG = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
SERIE = re.compile(r'^(?:([1-9])ano|([1-3])em)$')
TOLERANCIA = 0.01  # pt: arredondamento de quem escreveu a caixa


def nome_da_serie(serie):
    m = SERIE.match(serie)
    return ('%sº ano' % m.group(1)) if m.group(1) else ('%sª série do ensino médio' % m.group(2))


def ordem_da_serie(serie):
    m = SERIE.match(serie)
    return int(m.group(1)) if m.group(1) else 9 + int(m.group(2))


def serie_do_catalogo(serie):
    """'3ano' -> '03', '1em' -> 'em1': como o banco/topicos/matematica.json escreve."""
    m = SERIE.match(serie)
    return ('%02d' % int(m.group(1))) if m.group(1) else 'em' + m.group(2)


def carregar_temas():
    d = json.load(io.open(os.path.join(RAIZ, 'banco', 'topicos', 'matematica.json'), encoding='utf-8'))
    return {t['id']: {'serie': t['serie'], 'titulo': t['pt']['titulo']} for t in d['temas']}


def erro(onde, frase):
    raise SystemExit('erro: --itens-curados, %s: %s' % (onde, frase))


def sobra(obj, campos, onde):
    if not isinstance(obj, dict):
        erro(onde, 'nao e um objeto')
    a_mais = sorted(set(obj) - set(campos))
    if a_mais:
        erro(onde, 'campos desconhecidos: %s' % ', '.join(a_mais))
    faltam = [c for c in campos if c not in obj]
    return faltam


def texto(v, onde, campo):
    if not isinstance(v, str) or not v.strip():
        erro(onde, '%s tem de ser um texto nao vazio (veio %r)' % (campo, v))
    return v


def numero(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def ler_fonte(f):
    faltam = sobra(f, CAMPOS_FONTE, 'fonte')
    if faltam:
        erro('fonte', 'faltam os campos %s (licenca e atribuicao sao obrigatorias)' % ', '.join(faltam))
    for c in ('id', 'nome', 'url', 'licenca', 'atribuicao'):
        texto(f[c], 'fonte', c)
    if not SLUG.match(f['id']):
        erro('fonte', 'id %r nao e slug (minusculas, algarismos e hifen)' % f['id'])
    if not isinstance(f['privado'], bool):
        erro('fonte', 'privado tem de ser true ou false (veio %r)' % (f['privado'],))
    try:
        chaves = [c for _, c, _, _ in string.Formatter().parse(f['atribuicao']) if c is not None]
    except ValueError as e:
        erro('fonte', 'atribuicao mal formada (%s)' % e)
    fora = sorted(set(c for c in chaves if c not in CHAVES_DA_ATRIBUICAO))
    if fora:
        erro('fonte', 'atribuicao com {%s}, que nao existe; vale %s'
             % ('}, {'.join(fora), ', '.join('{%s}' % c for c in CHAVES_DA_ATRIBUICAO)))
    return f


def ler_recorte(r, base, onde, docs):
    """[(caminho do pdf, pno, rect)], conferido contra o PDF."""
    if not isinstance(r, dict):
        erro(onde, 'recorte nao e um objeto')
    if 'pedacos' in r:
        faltam = sobra(r, ('pdf', 'pedacos'), onde + ', recorte')
        brutos = r['pedacos']
        if not isinstance(brutos, list) or not brutos:
            erro(onde, 'recorte.pedacos tem de ser uma lista nao vazia')
    else:
        faltam = sobra(r, ('pdf', 'pagina', 'rect'), onde + ', recorte')
        brutos = [{'pagina': r.get('pagina'), 'rect': r.get('rect')}]
    if faltam:
        erro(onde, 'recorte sem %s' % ', '.join(faltam))
    texto(r['pdf'], onde, 'recorte.pdf')
    caminho = r['pdf'] if os.path.isabs(r['pdf']) else os.path.join(base, r['pdf'])
    caminho = os.path.normpath(caminho)
    if caminho not in docs:
        if not os.path.isfile(caminho):
            erro(onde, 'o PDF %s nao existe' % caminho)
        try:
            docs[caminho] = pymupdf.open(caminho)
        except Exception as e:  # noqa: BLE001
            erro(onde, 'nao consegui abrir o PDF %s (%s)' % (caminho, e))
        if not docs[caminho].is_pdf:
            erro(onde, '%s nao e PDF' % caminho)
    doc = docs[caminho]
    out = []
    for k, p in enumerate(brutos, 1):
        o = '%s, pedaco %d' % (onde, k) if len(brutos) > 1 or 'pedacos' in r else onde
        falta = sobra(p, CAMPOS_PEDACO, o)
        if falta:
            erro(o, 'sem %s' % ', '.join(falta))
        pag, rect = p['pagina'], p['rect']
        if not isinstance(pag, int) or isinstance(pag, bool):
            erro(o, 'pagina tem de ser um inteiro, contando de 1 (veio %r)' % (pag,))
        if not 1 <= pag <= doc.page_count:
            erro(o, 'pagina %d fora do PDF (%s tem %d paginas)' % (pag, os.path.basename(caminho), doc.page_count))
        if not (isinstance(rect, list) and len(rect) == 4 and all(numero(v) for v in rect)):
            erro(o, 'rect tem de ser [x0, y0, x1, y1] em pontos (veio %r)' % (rect,))
        x0, y0, x1, y1 = [float(v) for v in rect]
        if not (x0 < x1 and y0 < y1):
            erro(o, 'rect %r vazio ou invertido' % (rect,))
        W, H = doc[pag - 1].rect.width, doc[pag - 1].rect.height
        if x0 < -TOLERANCIA or y0 < -TOLERANCIA or x1 > W + TOLERANCIA or y1 > H + TOLERANCIA:
            erro(o, 'rect %r sai da pagina %d (%.1f x %.1f pt)' % (rect, pag, W, H))
        out.append((caminho, pag - 1, (max(0.0, x0), max(0.0, y0), min(W, x1), min(H, y1))))
    return out


def ler_itens_curados(caminho):
    """(fonte, [item lido], {caminho: doc}). Para tudo no primeiro erro."""
    try:
        with io.open(caminho, encoding='utf-8') as f:
            dados = json.load(f)
    except (OSError, ValueError) as e:
        raise SystemExit('erro: --itens-curados %s: nao consegui ler o json (%s)' % (caminho, e))
    faltam = sobra(dados, CAMPOS_TOPO, 'o arquivo')
    if faltam:
        erro('o arquivo', 'faltam %s' % ', '.join(faltam))
    fonte = ler_fonte(dados['fonte'])
    if not isinstance(dados['itens'], list) or not dados['itens']:
        erro('o arquivo', 'itens tem de ser uma lista nao vazia')
    temas = carregar_temas()
    base = os.path.dirname(os.path.abspath(caminho))
    docs, ids, modulos, itens = {}, set(), {}, []
    for n, it in enumerate(dados['itens'], 1):
        onde = 'item %d' % n
        if isinstance(it, dict) and isinstance(it.get('id'), str):
            onde += ' (%s)' % it['id']
        falta = sobra(it, CAMPOS_ITEM, onde)
        if falta:
            erro(onde, 'faltam %s' % ', '.join(falta))
        iid = texto(it['id'], onde, 'id')
        if iid in ids:
            erro(onde, 'id %r repetido' % iid)
        ids.add(iid)
        serie = texto(it['serie'], onde, 'serie')
        if not SERIE.match(serie):
            erro(onde, 'serie %r nao e 1ano a 9ano nem 1em a 3em' % serie)
        tid = texto(it['tema_app'], onde, 'tema_app')
        if tid not in temas:
            erro(onde, 'tema_app %r nao esta no banco/topicos/matematica.json' % tid)
        falta = sobra(it['modulo'], CAMPOS_MODULO, onde + ', modulo')
        if falta:
            erro(onde, 'modulo sem %s' % ', '.join(falta))
        slug = texto(it['modulo']['slug'], onde, 'modulo.slug')
        tit_mod = portal.sem_tracos(texto(it['modulo']['titulo'], onde, 'modulo.titulo'))
        if not SLUG.match(slug):
            erro(onde, 'modulo.slug %r nao e slug (minusculas, algarismos e hifen)' % slug)
        if modulos.setdefault(slug, tit_mod) != tit_mod:
            erro(onde, 'o modulo %s ja veio com o titulo %r, e aqui com %r' % (slug, modulos[slug], tit_mod))
        titulo = portal.sem_tracos(texto(it['titulo'], onde, 'titulo'))
        subs = it['subitens']
        if not isinstance(subs, list) or not all(isinstance(s, str) and s.strip() for s in subs):
            erro(onde, 'subitens tem de ser uma lista de textos nao vazios (veio %r)' % (subs,))
        if len(set(subs)) != len(subs):
            erro(onde, 'subitens repetidos: %r' % (subs,))
        ps = ler_recorte(it['recorte'], base, onde, docs)
        itens.append({'id': iid, 'serie': serie, 'tema_app': tid, 'tema_serie': temas[tid]['serie'],
                      'modulo': {'slug': slug, 'titulo': tit_mod}, 'titulo': titulo, 'subitens': list(subs),
                      'pedacos': ps, 'ordem': n})
    return fonte, itens, docs


def paginas_de(ps):
    return sorted(set(p[1] + 1 for p in ps))


def texto_das_paginas(pags):
    return 'p. %d' % pags[0] if len(pags) == 1 else 'p. %d a %d' % (pags[0], pags[-1])


def gerar(itens_curados, versao, saida, curadoria=None, trabalho=None, gerado_em=None, commit=None, gravar_zip=True,
          gabarito_externo=None, so_com_resposta=False):
    t_ini = time.time()
    fonte, lidos, docs = ler_itens_curados(itens_curados)
    nome = 'matematica-%s' % fonte['id']
    trabalho = trabalho or os.path.join(os.path.dirname(os.path.abspath(saida)), 'trabalho', '%s-v%d' % (nome, versao))
    if curadoria:
        dif_cur, apelidos, excl_cur, _meta = gerar_pacote.ler_curadoria(curadoria)
    else:
        dif_cur, apelidos, excl_cur = {}, {}, {}
    conteudo, itens, docs_busca = {}, [], []
    relatorio = {'pacote': nome, 'versao': versao, 'pymupdf': portal.versao_pymupdf(), 'privado': fonte['privado'],
                 'excluidos': [], 'assuntos': {}, 'tema_de_outro_ano': [], 'notas': []}
    por_lista = collections.Counter()
    for c in lidos:
        iid, serie, ps = c['id'], c['serie'], c['pedacos']
        pags = paginas_de(ps)
        arquivo = os.path.basename(ps[0][0])
        linha = {'id': iid, 'serie': serie, 'tema': c['tema_app'], 'paginas': pags, 'titulo': c['titulo']}
        if iid in excl_cur:
            relatorio['excluidos'].append(dict(linha, motivo=portal.sem_tracos('curadoria: ' + excl_cur[iid])))
            continue
        svgs, meds, falhou = [], [], None
        for cam, pno, rect in ps:
            svg, dif, obs = gerar_pacote.svg_redigido(docs[cam], pno, rect, cmyk_para_rgb=True)
            if dif > gerar_pacote.LIMITE_REDACAO:
                falhou = 'apagar o de fora mudou %.2f%% dos pixels do recorte (p. %d do PDF): a caixa corta outra coisa' \
                    % (100 * dif, pno + 1)
            if obs:
                relatorio['notas'].append('%s p%d: %s' % (iid, pno + 1, obs))
            svgs.append(svg)
            meds.append((rect[2] - rect[0], rect[3] - rect[1]))
        if falhou:
            relatorio['excluidos'].append(dict(linha, motivo=falhou))
            continue
        if c['tema_serie'] != serie_do_catalogo(serie):
            relatorio['tema_de_outro_ano'].append({'id': iid, 'serie': serie, 'tema': c['tema_app'],
                                                   'serie_do_tema': c['tema_serie']})
        modulo = c['modulo']
        aula = {'slug': '%s-%s' % (fonte['id'], serie), 'titulo': '%s, %s' % (fonte['nome'], nome_da_serie(serie)),
                'n': ordem_da_serie(serie)}
        por_lista[(serie, modulo['slug'])] += 1
        num = por_lista[(serie, modulo['slug'])]
        base_a = 'assets/%s/%s/%s/ex-%03d' % (serie, modulo['slug'], aula['slug'], num)
        svg, (w, h) = gerar_pacote.empilhar(svgs, meds)
        conteudo[base_a + '.svg'] = svg.encode('utf-8')
        o = {'pagina': ps[0][1] + 1, 'coluna': 1, 'bbox': list(ps[0][2])}
        if len(ps) > 1:
            o['pedacos'] = [{'pagina': pno + 1, 'coluna': 1, 'bbox': list(rect)} for _, pno, rect in ps]
        txt = '\n'.join(gerar_pacote.texto_do_retangulo(docs[cam], pno, rect) for cam, pno, rect in ps)
        atrib = portal.sem_tracos(fonte['atribuicao'].format(
            fonte=fonte['nome'], serie=nome_da_serie(serie), paginas=texto_das_paginas(pags), titulo=c['titulo'],
            id=iid, arquivo=arquivo))
        item = {
            'id': iid, 'fonte': fonte['id'], 'serie': serie,
            'modulo': dict(modulo), 'aula': aula, 'numero': num, 'titulo': c['titulo'],
            'formato': 'aberta', 'alternativas': None, 'resposta': None,
            'subitens': c['subitens'],
            'texto': portal.para_busca(txt),
            'origem_citada': atrib,
            'dificuldade': None, 'dificuldade_origem': None, 'proxy': None,
            'tema_app': c['tema_app'], 'tema_origem': 'lista-curada',
            'licenca': fonte['licenca'],
            'atribuicao': atrib,
            'link': fonte['url'],
            'origem_detalhe': {'fonte': fonte['nome'], 'ano': nome_da_serie(serie), 'paginas': pags,
                               'ordem_no_json': c['ordem']},
            'assets': {'enunciado': base_a + '.svg', 'solucao': None},
            'medidas': {'enunciado': {'largura_pt': round(w, 1), 'altura_pt': round(h, 1), 'rotulo': None},
                        'solucao': None},
            'sem_solucao': True,
            'origem': {'arquivo': arquivo, 'enunciado': o},
        }
        if iid in dif_cur:
            item.update({'dificuldade': dif_cur[iid], 'dificuldade_origem': 'curadoria'})
        itens.append(item)
        relatorio['assuntos'].setdefault(c['tema_app'], []).append(iid)
        docs_busca.append({'id': iid, 'serie': serie, 'tipo': 'exercicio',
                           'titulo': '%s, %s' % (aula['titulo'], c['titulo']),
                           'resumo': '%s %s' % (modulo['titulo'], aula['titulo']),
                           'texto': portal.sem_tracos(portal.recompor(txt)), 'explicacao': ''})
    for d in docs.values():
        d.close()
    for chave in sorted(set((i['serie'], i['modulo']['slug']) for i in itens)):
        ids = [i for i in itens if (i['serie'], i['modulo']['slug']) == chave]
        docs_busca.append({'id': '%s:%s' % chave, 'serie': chave[0], 'tipo': 'modulo',
                           'titulo': ids[0]['modulo']['titulo'],
                           'resumo': ' '.join(sorted(set(i['aula']['titulo'] for i in ids))), 'texto': ''})
    itens.sort(key=lambda i: (ordem_da_serie(i['serie']), i['modulo']['slug'], i['numero']))
    docs_busca.sort(key=lambda d: d['id'])
    n_gabarito = (gerar_pacote.aplicar_gabarito_externo(itens, gabarito_externo)
                  if gabarito_externo is not None else None)
    sem_resposta = None
    if so_com_resposta:
        sem_resposta = gerar_pacote.tirar_sem_resposta(itens, conteudo, docs_busca)
        gerar_pacote.recusar_pacote_vazio(itens, sem_resposta)
        relatorio['assuntos'] = gerar_pacote.assuntos_sem(relatorio['assuntos'], sem_resposta)
        relatorio['sem_resposta'] = sem_resposta
        fora = {e['id'] for e in sem_resposta}
        relatorio['tema_de_outro_ano'] = [t for t in relatorio['tema_de_outro_ano'] if t['id'] not in fora]
    if not itens:
        raise SystemExit('erro: --itens-curados: nenhum item ficou no pacote (%d excluidos)' % len(relatorio['excluidos']))
    conteudo['itens.json'] = gerar_pacote.json_bytes(itens)
    conteudo['teoria.json'] = gerar_pacote.json_bytes([])
    conteudo['busca.json'] = gerar_pacote.json_bytes(gerar_pacote.montar_busca(docs_busca))
    conteudo['apelidos.json'] = gerar_pacote.json_bytes(apelidos)
    series = sorted(set(i['serie'] for i in itens), key=ordem_da_serie)
    contagens = {'modulos': len(set((i['serie'], i['modulo']['slug']) for i in itens)), 'aulas_teoria': 0,
                 'paginas_teoria': 0, 'aulas_exercicios': len(set((i['serie'], i['modulo']['slug'], i['aula']['slug'])
                                                                  for i in itens)),
                 'itens': len(itens), 'itens_com_solucao': 0, 'itens_excluidos': len(relatorio['excluidos'])}
    if n_gabarito is not None:
        contagens['itens_com_gabarito_agente'], contagens['itens_com_gabarito_agente_parcial'] = n_gabarito
    if sem_resposta is not None:
        contagens['itens_sem_resposta_excluidos'] = len(sem_resposta)
    manifest = {
        'esquema': 1, 'pacote': nome, 'versao': versao,
        'gerado_em': gerado_em or datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-3))).replace(
            microsecond=0).isoformat(),
        'gerador': {'nome': 'biblioteca/gerar_pacote.py --fonte lista-curada',
                    'commit': commit or gerar_pacote.commit_do_gerador(), 'pymupdf': pymupdf.VersionBind},
        'materia': 'matematica',
        'fonte': {k: fonte[k] for k in ('id', 'nome', 'url', 'licenca')},
        'series': series, 'licenca': fonte['licenca'], 'privado': fonte['privado'],
    }
    manifest.update({'contagens': contagens, 'arquivos': {k: gerar_pacote.sha(conteudo[k]) for k in sorted(conteudo)}})
    manifest_b = (json.dumps(manifest, ensure_ascii=False, indent=1) + '\n').encode('utf-8')
    zip_caminho = gerar_pacote.gravar_pacote(conteudo, manifest_b, nome, versao, saida, trabalho, gravar_zip)
    tam = collections.Counter()
    for k, v in conteudo.items():
        tam['enunciado' if k.startswith('assets/') else k] += len(v)
    relatorio.update({
        'contagens': contagens, 'hash_manifest': gerar_pacote.sha(manifest_b),
        'zip': {'caminho': zip_caminho if gravar_zip else None,
                'bytes': os.path.getsize(zip_caminho) if gravar_zip else None},
        'bytes_por_tipo': dict(sorted(tam.items())), 'segundos': round(time.time() - t_ini, 1),
    })
    with open(os.path.join(trabalho, 'relatorio.json'), 'w', encoding='utf-8', newline='') as f:
        f.write(json.dumps(relatorio, ensure_ascii=False, indent=1) + '\n')
    return manifest, relatorio, trabalho
