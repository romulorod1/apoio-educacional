# -*- coding: utf-8 -*-
"""Baixa paginas do Wikisource pt pela API: o wikitext e o texto renderizado (HTML -> texto).

Uso: python baixa_wikisource.py "Titulo 1" "Titulo 2" ...
Grava em fontes_brutas/<titulo>.wiki e <titulo>.txt. Espera 6 s entre pedidos (o servidor devolve 429).
"""
import io, os, sys, json, time, re, html
import urllib.request, urllib.parse
from html.parser import HTMLParser
sys.stdout.reconfigure(encoding='utf-8')
AQUI = os.path.dirname(os.path.abspath(__file__))
DEST = os.path.join(AQUI, '_wikisource')
os.makedirs(DEST, exist_ok=True)
UA = 'apoio-educacional/1.0 (uso pessoal, educacional; contato romulo)'


class Texto(HTMLParser):
    """HTML -> texto: paragrafos e quebras viram linhas; o resto e descartado."""
    def __init__(self):
        super().__init__()
        self.partes = []
        self.pula = 0
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = a.get('class', '') or ''
        if tag in ('style', 'script') or 'pagenum' in cls or 'mw-editsection' in cls or 'noprint' in cls \
                or 'ws-noexport' in cls or 'navbox' in cls or 'ws-header' in cls or a.get('id') == 'headertemplate' \
                or 'catlinks' in cls or 'printfooter' in cls:
            self.pula += 1
        elif tag in ('p', 'div', 'h1', 'h2', 'h3', 'h4', 'li', 'tr'):
            self.partes.append('\n')
        elif tag == 'br':
            self.partes.append('\n')
    def handle_endtag(self, tag):
        if tag in ('style', 'script', 'div', 'span', 'table', 'p', 'h1', 'h2', 'h3'):
            if self.pula:
                # so fecha o que abriu; aproximacao suficiente para div/span/table
                if tag in ('div', 'span', 'table', 'style', 'script'):
                    self.pula -= 1
        if tag in ('p', 'div', 'h1', 'h2', 'h3', 'h4', 'li', 'tr'):
            self.partes.append('\n')
    def handle_data(self, d):
        if not self.pula:
            self.partes.append(d)


def api(params):
    q = urllib.parse.urlencode(params)
    req = urllib.request.Request('https://pt.wikisource.org/w/api.php?' + q, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def baixa(titulo):
    d = api({'action': 'parse', 'page': titulo, 'prop': 'wikitext|text', 'format': 'json', 'redirects': 1, 'disabletoc': 1})
    if 'error' in d:
        return None, None, d['error'].get('info')
    p = d['parse']
    t = Texto()
    t.feed(p['text']['*'])
    texto = ''.join(t.partes)
    texto = html.unescape(texto)
    texto = re.sub(r'[ \t\xa0]+', ' ', texto)
    texto = re.sub(r' *\n *', '\n', texto)
    texto = re.sub(r'\n{3,}', '\n\n', texto).strip() + '\n'
    return p['wikitext']['*'], texto, p['title']


for i, titulo in enumerate(sys.argv[1:]):
    if i:
        time.sleep(6)
    try:
        wiki, texto, info = baixa(titulo)
    except Exception as e:
        print('%-45s ERRO %s' % (titulo, e))
        continue
    nome = titulo.replace('/', '__').replace(' ', '_')
    if wiki is None:
        print('%-45s ERRO %s' % (titulo, info))
        continue
    io.open(os.path.join(DEST, nome + '.wiki'), 'w', encoding='utf-8', newline='\n').write(wiki)
    io.open(os.path.join(DEST, nome + '.txt'), 'w', encoding='utf-8', newline='\n').write(texto)
    print('%-45s wiki %6d, texto %6d chars (%s)' % (titulo, len(wiki), len(texto), info))
