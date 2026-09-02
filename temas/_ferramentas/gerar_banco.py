# -*- coding: utf-8 -*-
"""
Gera o arquivo unico que o aplicativo vai ler, a partir dos temas em Markdown.

Os .md sao a fonte, boas de escrever e de revisar. O aplicativo consome um JSON
so, para nao ter que baixar 146 arquivos no tablet.

Cada exercicio sai separado, com o bloco a que pertence e a resposta pareada.
E isso que permite a Nathalia montar a lista marcando e desmarcando questoes:
a numeracao e refeita na hora da montagem, e o gabarito acompanha.

Uso:
    python gerar_banco.py            gera banco.json
    python gerar_banco.py --provar   monta uma lista de exemplo e mostra o resultado
"""
import io
import os
import re
import sys
import json
import glob

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import verificar

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'banco.json')
PASTA_BANCO = os.path.join(os.path.dirname(RAIZ), 'banco')

TITULOS = {
    'pt': {'explicacao': 'Explicação', 'exercicios': 'Exercícios', 'gabarito': 'Gabarito'},
    'en': {'explicacao': 'Explanation', 'exercicios': 'Exercises', 'gabarito': 'Answer key'},
}


def blocos_e_itens(texto):
    """Separa a lista de exercicios em itens, guardando o bloco de cada um.

    O bloco vem das linhas em negrito que abrem cada parte da lista.
    """
    itens = []
    bloco = ''
    atual = None
    for linha in (texto or '').split('\n'):
        cabecalho = re.match(r'^\*\*(?:Bloco|Block)\s+([A-C])[.．]?\s*(.*?)\*\*\s*$', linha.strip())
        if cabecalho:
            if atual:
                itens.append(atual)
                atual = None
            bloco = cabecalho.group(2).strip()
            continue
        comeco = re.match(r'^(\d+)\.\s+(.*)$', linha)
        if comeco:
            if atual:
                itens.append(atual)
            atual = {'n': int(comeco.group(1)), 'bloco': bloco, 'texto': comeco.group(2).strip()}
        elif atual is not None and linha.strip():
            atual['texto'] += ' ' + linha.strip()
    if atual:
        itens.append(atual)
    return itens


def ler(caminho):
    cab, corpo = verificar.ler_tema(caminho)
    tema = {
        'id': cab['id'],
        'serie': cab['serie'],
        'unidade': cab['unidade'],
        'duracaoMin': int(cab.get('duracao_min') or 60),
        'dificuldade': int(cab.get('dificuldade') or 3),
        'prerequisitos': [p.strip() for p in
                          (cab.get('prerequisitos') or '').strip('[]').split(',') if p.strip()],
        'pt': {}, 'en': {},
    }
    for lingua, secao_nome in (('pt', 'PT'), ('en', 'EN')):
        parte = verificar.secao(corpo, secao_nome)
        t = TITULOS[lingua]
        exercicios = blocos_e_itens(verificar.subsecao(parte, t['exercicios']))
        respostas = verificar.itens_numerados(verificar.subsecao(parte, t['gabarito']))
        tema[lingua] = {
            'titulo': cab['titulo_%s' % lingua],
            'resumo': cab['resumo_%s' % lingua],
            'explicacao': (verificar.subsecao(parte, t['explicacao']) or '').strip(),
            'exercicios': [
                {
                    'n': it['n'],
                    'bloco': it['bloco'],
                    'enunciado': it['texto'],
                    'resposta': respostas[i] if i < len(respostas) else '',
                }
                for i, it in enumerate(exercicios)
            ],
        }
    return tema


def montar_lista(tema, lingua, escolhidos, com_gabarito=True):
    """Monta a lista com os exercicios escolhidos, renumerando do 1.

    escolhidos e a lista dos numeros originais que ficaram marcados.
    """
    dados = tema[lingua]
    selecionados = [e for e in dados['exercicios'] if e['n'] in escolhidos]
    linhas, gabarito, bloco_atual = [], [], None
    for novo, ex in enumerate(selecionados, 1):
        if ex['bloco'] != bloco_atual:
            bloco_atual = ex['bloco']
            if bloco_atual:
                linhas.append('')
                linhas.append('**%s**' % bloco_atual)
                linhas.append('')
        linhas.append('%d. %s' % (novo, ex['enunciado']))
        gabarito.append('%d. %s' % (novo, ex['resposta']))
    saida = {'lista': '\n'.join(linhas).strip(), 'quantidade': len(selecionados)}
    if com_gabarito:
        saida['gabarito'] = '\n'.join(gabarito)
    return saida


def gerar_indice_de_busca(temas):
    """Chama o busca.js para montar o indice, e grava banco/busca.json.

    Quem normaliza palavra e o busca.js, e nao este script. Se a regra morasse
    nos dois lugares, um dia elas divergiriam e a busca passaria a nao achar o
    que o indice guardou.
    """
    import subprocess
    import tempfile

    entrada = [
        {
            'id': t['id'], 'serie': t['serie'],
            'titulo': t['pt']['titulo'], 'resumo': t['pt']['resumo'],
            'explicacao': t['pt']['explicacao'],
            'enunciados': ' '.join(e['enunciado'] for e in t['pt']['exercicios']),
        }
        for t in temas
    ]
    raiz_proj = os.path.dirname(RAIZ)
    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8') as f:
        json.dump(entrada, f, ensure_ascii=False)
        caminho_entrada = f.name

    script = (
        "const fs=require('fs');"
        "const B=require(process.argv[1]);"
        "const t=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));"
        "process.stdout.write(JSON.stringify({formato:'indice-de-busca',versao:1,"
        "temas:B.montarIndice(t)}));"
    )
    saida = subprocess.run(
        ['node', '-e', script, os.path.join(raiz_proj, 'busca.js'), caminho_entrada],
        capture_output=True, text=True, encoding='utf-8')
    os.unlink(caminho_entrada)
    if saida.returncode != 0:
        raise SystemExit('nao consegui montar o indice de busca: %s' % saida.stderr[:400])

    caminho = os.path.join(PASTA_BANCO, 'busca.json')
    io.open(caminho, 'w', encoding='utf-8', newline=chr(10)).write(saida.stdout)
    print('busca.json: %.0f KB, carrega junto com o indice'
          % (os.path.getsize(caminho) / 1024.0))


def gerar():
    """Gera o que o aplicativo consome.

    Sao dois niveis, de proposito. O indice e leve e carrega sempre, para a
    lista de temas aparecer na hora. O conteudo de cada serie so e baixado
    quando ela abre um tema daquela serie: no tablet, puxar dois megabytes toda
    vez que alguem quer ver um titulo seria desperdicio.
    """
    temas = []
    reprovados = []
    for caminho in sorted(glob.glob(os.path.join(RAIZ, 'mat', '*', '*.md'))):
        erros, avisos, manuais, cab = verificar.conferir(caminho)
        if erros:
            reprovados.append((os.path.basename(caminho), erros[0]))
            continue
        temas.append(ler(caminho))

    if not os.path.isdir(PASTA_BANCO):
        os.makedirs(PASTA_BANCO)

    indice = []
    for t in temas:
        indice.append({
            'id': t['id'], 'serie': t['serie'], 'unidade': t['unidade'],
            'duracaoMin': t['duracaoMin'], 'dificuldade': t['dificuldade'],
            'qtd': len(t['pt']['exercicios']),
            'pt': {'titulo': t['pt']['titulo'], 'resumo': t['pt']['resumo']},
            'en': {'titulo': t['en']['titulo'], 'resumo': t['en']['resumo']},
        })
    caminho_indice = os.path.join(PASTA_BANCO, 'indice.json')
    io.open(caminho_indice, 'w', encoding='utf-8', newline=chr(10)).write(
        json.dumps({'formato': 'banco-temas-matematica', 'versao': 1, 'temas': indice},
                   ensure_ascii=False, separators=(',', ':')))

    por_serie = {}
    for t in temas:
        por_serie.setdefault(t['serie'], []).append(t)
    maior = 0
    for serie, lista in sorted(por_serie.items()):
        caminho = os.path.join(PASTA_BANCO, 'serie-%s.json' % serie)
        io.open(caminho, 'w', encoding='utf-8', newline=chr(10)).write(
            json.dumps({'serie': serie, 'temas': lista},
                       ensure_ascii=False, separators=(',', ':')))
        maior = max(maior, os.path.getsize(caminho) / 1024.0)

    # indice de busca, montado pelo proprio busca.js para nao existirem duas
    # regras de normalizacao que possam divergir com o tempo
    gerar_indice_de_busca(temas)

    banco = {'formato': 'banco-temas-matematica', 'versao': 1, 'temas': temas}
    io.open(SAIDA, 'w', encoding='utf-8', newline=chr(10)).write(
        json.dumps(banco, ensure_ascii=False, separators=(',', ':')))

    total_ex = sum(len(t['pt']['exercicios']) for t in temas)
    print('%d tema(s), %d exercicio(s) em portugues' % (len(temas), total_ex))
    print('indice.json: %.0f KB, carrega sempre' % (os.path.getsize(caminho_indice) / 1024.0))
    print('%d arquivos de serie, o maior com %.0f KB, baixados so quando precisa'
          % (len(por_serie), maior))
    print('banco.json inteiro: %.0f KB' % (os.path.getsize(SAIDA) / 1024.0))
    if reprovados:
        print('')
        print('%d tema(s) ficaram de fora por nao passarem na conferencia:' % len(reprovados))
        for nome, erro in reprovados:
            print('  %s: %s' % (nome, erro[:90]))
    return banco


def provar(banco):
    """Demonstra a montagem: seleciona um subconjunto e mostra o resultado."""
    tema = [t for t in banco['temas'] if t['id'] == 'MATEM1-04'][0]
    todos = [e['n'] for e in tema['pt']['exercicios']]

    print('')
    print('=' * 68)
    print('TEMA: %s' % tema['pt']['titulo'])
    print('A lista completa tem %d exercicios, em %d blocos.'
          % (len(todos), len(set(e['bloco'] for e in tema['pt']['exercicios']))))
    print('')
    print('Como ela ve na tela, com tudo marcado de inicio:')
    for e in tema['pt']['exercicios'][:4]:
        print('  [x] %2d. (%s) %s' % (e['n'], e['bloco'], e['enunciado'][:56]))
    print('      ... e mais %d' % (len(todos) - 4))

    print('')
    print('-' * 68)
    print('CASO 1: ela desmarca os fundamentos e fica so com o resto')
    escolha = [n for n in todos if n > 5]
    montada = montar_lista(tema, 'pt', escolha)
    print('%d exercicios, renumerados de 1 a %d:' % (montada['quantidade'], montada['quantidade']))
    print('')
    for linha in montada['lista'].split('\n')[:8]:
        print('  ' + linha[:74])
    print('')
    print('  gabarito alinhado com a numeracao nova:')
    for linha in montada['gabarito'].split('\n')[:3]:
        print('    ' + linha[:70])

    print('')
    print('-' * 68)
    print('CASO 2: ela desmarca tudo e escolhe cinco a dedo')
    escolha = [1, 8, 13, 17, 18]
    montada = montar_lista(tema, 'pt', escolha)
    print('escolhidos os originais %s, viram 1 a %d:' % (escolha, montada['quantidade']))
    print('')
    for linha in montada['lista'].split('\n'):
        print('  ' + linha[:74])
    print('')
    print('  gabarito:')
    for linha in montada['gabarito'].split('\n'):
        print('    ' + linha[:72])

    print('')
    print('-' * 68)
    print('CASO 3: a mesma escolha, em ingles')
    montada = montar_lista(tema, 'en', escolha)
    for linha in montada['lista'].split('\n')[:6]:
        print('  ' + linha[:74])

    print('')
    print('-' * 68)
    print('CASO 4: versao do aluno, sem gabarito')
    montada = montar_lista(tema, 'pt', escolha, com_gabarito=False)
    print('  tem gabarito? %s' % ('sim' if 'gabarito' in montada else 'nao'))
    print('=' * 68)


if __name__ == '__main__':
    banco = gerar()
    if '--provar' in sys.argv:
        provar(banco)
