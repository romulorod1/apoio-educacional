# -*- coding: utf-8 -*-
"""
Gera o que o aplicativo le, a partir dos temas em Markdown, materia por materia.

Os .md sao a fonte, boas de escrever e de revisar. O aplicativo consome JSON,
para nao ter que baixar um arquivo por tema no tablet.

Cada exercicio sai separado, com o bloco a que pertence e a resposta pareada.
E isso que permite a Nathalia montar a lista marcando e desmarcando questoes:
a numeracao e refeita na hora da montagem, e o gabarito acompanha.

A saida de cada materia vai para a raiz declarada na tabela (Core.MATERIAS no
core.js, exportada para materias.json): matematica em banco/, que e o caminho
legado e nao pode mudar nunca, porque e a chave do cache BAIXADOS nos tablets;
materia nova em banco/<id>/. Os arquivos da matematica saem BYTE A BYTE iguais
aos de antes desta ferramenta aprender outras materias: a ausencia do campo
`materia` significa matematica, por decisao, e o app vai ler assim.

Uso:
    python gerar_banco.py                        gera para toda materia com temas
    python gerar_banco.py --provar               monta uma lista de exemplo e mostra
    python gerar_banco.py --temas DIR --saida DIR
        raizes alternativas: DIR/<pasta>/<serie>/*.md na entrada e DIR/<raiz da
        materia>/ na saida. E como se prova o caminho de uma materia nova sem
        deixar tema falso dentro do repositorio.
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
RAIZ_PROJETO = os.path.dirname(RAIZ)

# A materia legada. Os tres pontos em que ela e diferente das outras existem
# para os arquivos que o tablet ja baixou continuarem identicos: sem campo
# `materia` nos temas, formato 'banco-temas-matematica' versao 1, e o banco
# inteiro em temas/banco.json (os pilotos de figuras/ leem de la). E o mesmo
# MATERIA_PADRAO do core.js, escrito aqui porque o materias.json nao o exporta.
MATERIA_LEGADA = 'matematica'
FORMATO_LEGADO = ('banco-temas-matematica', 1)
FORMATO_NOVO = ('banco-temas', 2)

# Os titulos das subsecoes por lingua sao os do verificador, que e quem os
# exige. Mantido com este nome porque e o que se le no resto do arquivo.
TITULOS = verificar.SECOES


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


def ler(caminho, materia=None):
    """Le um tema para o dicionario que vai no JSON.

    A ordem das chaves importa: e ela que sai no arquivo, e o da matematica
    tem que continuar igual. Por isso `materia` entra logo depois do id so
    nas materias novas, e a lingua so entra quando a materia a declara: tema
    sem ingles sai sem a chave en, e nao com en vazio.
    """
    materia = materia or verificar.materia_do_caminho(caminho)
    cab, corpo = verificar.ler_tema(caminho)
    legada = materia['id'] == MATERIA_LEGADA
    tema = {'id': cab['id']}
    if not legada:
        tema['materia'] = materia['id']
    tema['serie'] = cab['serie']
    tema['unidade'] = cab['unidade']
    tema['duracaoMin'] = int(cab.get('duracao_min') or 60)
    tema['dificuldade'] = int(cab.get('dificuldade') or 3)
    tema['prerequisitos'] = verificar.lista_do_cabecalho(cab.get('prerequisitos'))
    if not legada and 'topicos' in cab:
        tema['topicos'] = verificar.lista_do_cabecalho(cab['topicos'])
    for lingua in materia['temas']['linguas']:
        t = TITULOS[lingua]
        parte = verificar.secao(corpo, t['secao'])
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


def gerar_indice_de_busca(temas, pasta_banco):
    """Chama o busca.js para montar o indice, e grava busca.json na pasta da materia.

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
        ['node', '-e', script, os.path.join(RAIZ_PROJETO, 'busca.js'), caminho_entrada],
        capture_output=True, text=True, encoding='utf-8')
    os.unlink(caminho_entrada)
    if saida.returncode != 0:
        raise SystemExit('nao consegui montar o indice de busca: %s' % saida.stderr[:400])

    caminho = os.path.join(pasta_banco, 'busca.json')
    io.open(caminho, 'w', encoding='utf-8', newline=chr(10)).write(saida.stdout)
    print('  busca.json: %.0f KB, carrega junto com o indice'
          % (os.path.getsize(caminho) / 1024.0))


def _gravar(caminho, dados):
    io.open(caminho, 'w', encoding='utf-8', newline=chr(10)).write(
        json.dumps(dados, ensure_ascii=False, separators=(',', ':')))


def _envelope(materia, corpo):
    """O cabecalho do JSON: legado para a matematica, novo para as outras.

    No novo vai a materia tambem no envelope, e nao so em cada tema, para um
    arquivo baixado ser reconhecivel sozinho.
    """
    if materia['id'] == MATERIA_LEGADA:
        formato, versao = FORMATO_LEGADO
        envelope = {'formato': formato, 'versao': versao}
    else:
        formato, versao = FORMATO_NOVO
        envelope = {'formato': formato, 'versao': versao, 'materia': materia['id']}
    envelope.update(corpo)
    return envelope


def gerar_materia(materia, temas, pasta_banco, raiz_temas):
    """Grava o indice, um arquivo por serie, o indice de busca e o banco inteiro.

    Sao dois niveis, de proposito. O indice e leve e carrega sempre, para a
    lista de temas aparecer na hora. O conteudo de cada serie so e baixado
    quando ela abre um tema daquela serie: no tablet, puxar dois megabytes toda
    vez que alguem quer ver um titulo seria desperdicio.
    """
    if not os.path.isdir(pasta_banco):
        os.makedirs(pasta_banco)
    legada = materia['id'] == MATERIA_LEGADA

    indice = []
    for t in temas:
        registro = {'id': t['id']}
        if not legada:
            registro['materia'] = materia['id']
        registro.update({
            'serie': t['serie'], 'unidade': t['unidade'],
            'duracaoMin': t['duracaoMin'], 'dificuldade': t['dificuldade'],
            'qtd': len(t['pt']['exercicios']),
        })
        for lingua in materia['temas']['linguas']:
            registro[lingua] = {'titulo': t[lingua]['titulo'], 'resumo': t[lingua]['resumo']}
        # O pre-requisito viaja no indice, e nao so no arquivo da serie.
        #
        # A trilha que fecha uma lacuna atravessa anos: fracoes no 6 ano puxa
        # multiplos e divisores do 6, operacoes com naturais do 4 e o sistema
        # decimal do 3. Montada a partir dos arquivos de serie, ela custaria ate
        # onze downloads e 2,4 MB, na casa da familia e muitas vezes sem sinal.
        # No indice custa 3,7 KB sobre 69 KB, e o indice ja e baixado na
        # primeira abertura e ja fica no cache do service worker.
        #
        # So sai quando existe: 22 dos 148 temas nao dependem de nenhum outro,
        # e campo vazio em 22 registros e peso sem informacao.
        if t.get('prerequisitos'):
            registro['prerequisitos'] = t['prerequisitos']
        # Os topicos tambem viajam no indice, pelo mesmo motivo: e por eles que
        # o aplicativo vai achar material a partir do assunto marcado na aula,
        # e isso precisa funcionar antes de qualquer serie ser baixada.
        if t.get('topicos'):
            registro['topicos'] = t['topicos']
        indice.append(registro)
    caminho_indice = os.path.join(pasta_banco, 'indice.json')
    _gravar(caminho_indice, _envelope(materia, {'temas': indice}))

    por_serie = {}
    for t in temas:
        por_serie.setdefault(t['serie'], []).append(t)
    maior = 0
    for serie, lista in sorted(por_serie.items()):
        caminho = os.path.join(pasta_banco, 'serie-%s.json' % serie)
        corpo = {'serie': serie, 'temas': lista}
        if not legada:
            corpo = {'materia': materia['id'], 'serie': serie, 'temas': lista}
        _gravar(caminho, corpo)
        maior = max(maior, os.path.getsize(caminho) / 1024.0)

    # indice de busca, montado pelo proprio busca.js para nao existirem duas
    # regras de normalizacao que possam divergir com o tempo
    gerar_indice_de_busca(temas, pasta_banco)

    # O banco inteiro num arquivo so, para ferramenta que quer um tema sem
    # juntar serie: temas/banco.json e o nome legado, lido pelos pilotos de
    # figuras/; materia nova ganha temas/banco-<id>.json ao lado.
    nome_banco = 'banco.json' if legada else 'banco-%s.json' % materia['id']
    caminho_banco = os.path.join(raiz_temas, nome_banco)
    banco = _envelope(materia, {'temas': temas})
    _gravar(caminho_banco, banco)

    total_ex = sum(len(t['pt']['exercicios']) for t in temas)
    print('  %d tema(s), %d exercicio(s) em portugues' % (len(temas), total_ex))
    print('  indice.json: %.0f KB, carrega sempre' % (os.path.getsize(caminho_indice) / 1024.0))
    print('  %d arquivos de serie, o maior com %.0f KB, baixados so quando precisa'
          % (len(por_serie), maior))
    print('  %s inteiro: %.0f KB' % (nome_banco, os.path.getsize(caminho_banco) / 1024.0))
    return banco


def gerar(raiz_temas=None, raiz_saida=None):
    """Gera o que o aplicativo consome, para cada materia que tem tema escrito.

    Materia declarada na tabela mas ainda sem tema nao gera nada: escrever um
    indice vazio em banco/portugues/ criaria arquivo no repositorio antes de
    existir conteudo, e o aplicativo trataria a pasta como banco disponivel.
    Devolve {id da materia: banco inteiro}.
    """
    raiz_temas = os.path.abspath(raiz_temas or RAIZ)
    raiz_saida = os.path.abspath(raiz_saida or RAIZ_PROJETO)
    bancos = {}
    for materia in verificar.materias():
        pasta = materia['temas']['pasta']
        arquivos = sorted(glob.glob(os.path.join(raiz_temas, pasta, '*', '*.md')))
        if not arquivos:
            print('%s: nenhum tema escrito ainda em %s/, nada gerado' % (materia['id'], pasta))
            continue
        print('%s (%s/ -> %s):' % (materia['id'], pasta, materia['temas']['raiz']))
        temas = []
        reprovados = []
        for caminho in arquivos:
            erros, avisos, manuais, cab = verificar.conferir(caminho)
            if erros:
                reprovados.append((os.path.basename(caminho), erros[0]))
                continue
            temas.append(ler(caminho, materia))

        # a raiz da tabela e relativa ao projeto e termina em barra: banco/ ou
        # banco/<id>/
        partes = [p for p in materia['temas']['raiz'].split('/') if p]
        pasta_banco = os.path.join(raiz_saida, *partes)
        bancos[materia['id']] = gerar_materia(materia, temas, pasta_banco, raiz_temas)
        if reprovados:
            print('')
            print('  %d tema(s) ficaram de fora por nao passarem na conferencia:' % len(reprovados))
            for nome, erro in reprovados:
                print('    %s: %s' % (nome, erro[:90]))
    return bancos


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


def _argumento(nome):
    """O valor que segue --nome na linha de comando, ou None."""
    if nome in sys.argv:
        i = sys.argv.index(nome)
        if i + 1 < len(sys.argv):
            return sys.argv[i + 1]
    return None


if __name__ == '__main__':
    bancos = gerar(_argumento('--temas'), _argumento('--saida'))
    if '--provar' in sys.argv and MATERIA_LEGADA in bancos:
        provar(bancos[MATERIA_LEGADA])
