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


def gerar():
    temas = []
    reprovados = []
    for caminho in sorted(glob.glob(os.path.join(RAIZ, 'mat', '*', '*.md'))):
        erros, avisos, manuais, cab = verificar.conferir(caminho)
        if erros:
            reprovados.append((os.path.basename(caminho), erros[0]))
            continue
        temas.append(ler(caminho))

    banco = {'formato': 'banco-temas-matematica', 'versao': 1, 'temas': temas}
    io.open(SAIDA, 'w', encoding='utf-8', newline='\n').write(
        json.dumps(banco, ensure_ascii=False, separators=(',', ':')))

    tamanho = os.path.getsize(SAIDA)
    total_ex = sum(len(t['pt']['exercicios']) for t in temas)
    print('banco.json gerado: %d tema(s), %d exercicio(s) em portugues, %.1f KB'
          % (len(temas), total_ex, tamanho / 1024.0))
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
