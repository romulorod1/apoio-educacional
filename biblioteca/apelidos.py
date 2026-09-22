"""Confere a lista de apelidos da biblioteca contra os modulos do Portal.

    python biblioteca/apelidos.py --portal <pasta obmep-portal> --apelidos <curadoria/apelidos.json>

Cada apelido ("bhaskara") leva a uma ou mais frases de busca ("equacao do
segundo grau"). A frase resolve para um modulo quando todas as suas palavras
de conteudo (sem acento, no singular, sem palavras vazias) estao no
vocabulario do modulo: o titulo dele, os titulos das aulas e os slugs. Falha:

- apelido orfao, cuja frase nao resolve para modulo nenhum das 7 series;
- modulo que nenhum apelido alcanca (o brief pede os 79 cobertos);
- chave fora do padrao (minuscula, sem acento, so letra, numero e espaco);
- travessao ou meia-risca na frase.

Chave que comeca com "_" e comentario e nao entra no pacote.
"""
import argparse
import io
import json
import os
import re
import sys
import unicodedata

import pymupdf

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import portal  # noqa: E402

VAZIAS = {'de', 'do', 'da', 'dos', 'das', 'e', 'o', 'a', 'os', 'as', 'no', 'na', 'nos', 'nas', 'em', 'para',
          'com', 'por', 'um', 'uma', 'entre', 'ao', 'aos', 'que', 'se', 'sobre', 'parte', 'i', 'ii', 'iii'}
SERIES = ['6ano', '7ano', '8ano', '9ano', '1em', '2em', '3em']


def sem_acento(s):
    s = unicodedata.normalize('NFD', s.lower())
    return ''.join(c for c in s if unicodedata.category(c) != 'Mn')


def singular(p):
    for fim, troca in (('oes', 'ao'), ('aes', 'ao'), ('ais', 'al'), ('eis', 'el')):
        if p.endswith(fim) and len(p) > 4:
            return p[:-3] + troca
    if p.endswith('res') and len(p) > 4:
        return p[:-2]
    if p.endswith('s') and len(p) > 3:
        return p[:-1]
    return p


def palavras(s):
    return {singular(p) for p in re.findall(r'[a-z0-9]+', sem_acento(s)) if p not in VAZIAS}


def modulos_do_portal(raiz, series=SERIES):
    """[{serie, slug, titulo, aulas}] das 7 series, lidos das capas como o gerador os le."""
    out = []
    for serie in series:
        pasta = os.path.join(raiz, serie)
        if os.path.isdir(pasta):
            out.extend(modulos_da_pasta(pasta, serie))
    return out


def modulos_da_pasta(pasta, serie):
    """Os modulos de uma pasta de serie, na ordem dos slugs."""
    mods = {}
    for a in portal.listar(pasta):
        m = mods.setdefault(a['modulo'], {'serie': serie, 'slug': a['modulo'], 'titulo': None, 'aulas': []})
        doc = pymupdf.open(os.path.join(pasta, a['arquivo']))
        capa = portal.capa_da_lista(doc) if a['tipo'] == 'exercicios' else portal.capa_da_teoria(doc)
        doc.close()
        m['titulo'] = m['titulo'] or capa.get('modulo')
        m['aulas'].append(capa.get('titulo') or '')
        m['aulas'].append(a['aula'])
    return [mods[k] for k in sorted(mods)]


def vocabulario(m):
    v = palavras(m['titulo'] or '') | palavras(m['slug'].replace('-', ' '))
    for a in m['aulas']:
        v |= palavras(a.replace('-', ' '))
    return v


def conferir(apelidos, modulos, exigir_todos=True):
    """Lista de falhas (vazia se tudo bem) e o conjunto de modulos alcancados."""
    falhas = []
    vocab = {m['serie'] + ':' + m['slug']: vocabulario(m) for m in modulos}
    alcancados = set()
    for chave, alvos in apelidos.items():
        if chave.startswith('_'):
            continue
        if chave != sem_acento(chave).strip() or re.search(r'[^a-z0-9 ]', chave):
            falhas.append('chave fora do padrao (minuscula, sem acento, so letras e numeros): %r' % chave)
        if not isinstance(alvos, list) or not alvos:
            falhas.append('apelido sem alvo: %r' % chave)
            continue
        for alvo in alvos:
            if '—' in alvo or '–' in alvo:
                falhas.append('travessao ou meia-risca no alvo %r' % alvo)
            ps = palavras(alvo)
            hits = [k for k, v in vocab.items() if ps and ps <= v]
            if not hits:
                falhas.append('apelido orfao: %r -> %r (palavras %s)' % (chave, alvo, sorted(ps)))
            alcancados.update(hits)
    if exigir_todos:
        falhas.extend('modulo sem apelido: %s' % k for k in sorted(set(vocab) - alcancados))
    return falhas, alcancados


def principal(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--portal', required=True)
    ap.add_argument('--apelidos', required=True)
    a = ap.parse_args(argv)
    apelidos = json.load(io.open(a.apelidos, encoding='utf-8'))
    modulos = modulos_do_portal(a.portal)
    falhas, alc = conferir(apelidos, modulos)
    n = sum(1 for k in apelidos if not k.startswith('_'))
    print('%d apelidos, %d modulos, %d alcancados, %d falhas' % (n, len(modulos), len(alc), len(falhas)))
    for f in falhas:
        print('  FALHA', f)
    sys.exit(1 if falhas else 0)


if __name__ == '__main__':
    principal()
