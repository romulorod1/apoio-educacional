# -*- coding: utf-8 -*-
"""Monta a página a partir do modelo, em dois formatos.

embutido: cada imagem vira um data URI dentro do próprio HTML. É o formato do
  link do Claude, que não pode buscar arquivo de fora.

solto: o HTML aponta para os arquivos de imagem ao lado dele, na mesma pasta.
  É o formato do Drive, onde ele fica junto das imagens e das simulações.

Uso:
    python _prints_pagina.py embutido _modelo.html destino.html
    python _prints_pagina.py solto    _modelo.html pasta/destino.html
"""
import io
import json
import os
import re
import shutil
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
PRINTS = os.path.join(AQUI, 'prints')
IMAGENS = json.load(io.open(os.path.join(PRINTS, 'imagens.json'), encoding='utf-8'))


def usadas(modelo):
    return re.findall(r'\{\{IMG:([a-z0-9-]+)\}\}', io.open(modelo, encoding='utf-8').read())


def conferir(texto):
    if '{{IMG:' in texto:
        raise SystemExit('sobrou marcador de imagem na página')
    for ch, nome in ((u'–', 'en-dash'), (u'—', 'em-dash')):
        if ch in texto:
            raise SystemExit('travessão (%s) encontrado na página' % nome)


def montar(modo, modelo, destino):
    s = io.open(modelo, encoding='utf-8').read()
    pasta = os.path.dirname(os.path.abspath(destino))

    def trocar(m):
        nome = m.group(1)
        if nome not in IMAGENS:
            raise SystemExit('print que falta: %s' % nome)
        d = IMAGENS[nome]
        if modo == 'embutido':
            fonte = d['url']
        else:
            # a imagem vai para o lado do html, e o html aponta para ela
            arquivo = nome + '.jpg'
            alvo = os.path.join(pasta, 'imagens', arquivo)
            if not os.path.isdir(os.path.dirname(alvo)):
                os.makedirs(os.path.dirname(alvo))
            import base64
            io.open(alvo, 'wb').write(base64.b64decode(d['url'].split(',', 1)[1]))
            fonte = 'imagens/' + arquivo
        # lazy so no formato solto: com data URI a imagem ja esta no documento
        preguica = '' if modo == 'embutido' else ' loading="lazy"'
        return 'src="%s" width="%d" height="%d"%s' % (fonte, d['w'], d['h'], preguica)

    s = re.sub(r'\{\{IMG:([a-z0-9-]+)\}\}', trocar, s)
    conferir(s)

    if modo == 'solto':
        # arquivo que abre com dois cliques, sem depender de servidor
        cabeca, resto = s.split('<div class="folha">', 1)
        s = ('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
             '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
             '<style>*{margin:0;padding:0}img{max-width:100%}</style>\n'
             + cabeca + '</head>\n<body>\n<div class="folha">' + resto + '\n</body>\n</html>\n')

    io.open(destino, 'w', encoding='utf-8', newline='\n').write(s)
    return len(s.encode('utf-8'))


if __name__ == '__main__':
    modo, modelo, destino = sys.argv[1], sys.argv[2], sys.argv[3]
    if modo not in ('embutido', 'solto'):
        raise SystemExit('modo tem que ser embutido ou solto')
    tam = montar(modo, modelo, destino)
    print('%s: %.1f MB  (%s)' % (os.path.basename(destino), tam / 1048576.0, modo))
    if modo == 'solto':
        pasta = os.path.join(os.path.dirname(os.path.abspath(destino)), 'imagens')
        peso = sum(os.path.getsize(os.path.join(pasta, f)) for f in os.listdir(pasta))
        print('   mais %d imagens ao lado, %.1f MB' % (len(os.listdir(pasta)), peso / 1048576.0))
    faltando = sorted(set(IMAGENS) - set(usadas(modelo)))
    if faltando:
        print('   gerados e nao usados: %s' % ', '.join(faltando))
