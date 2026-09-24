"""Monta as folhas da comparacao cega da kits-v1 contra sorteio.

    python biblioteca/_comparacao_cega.py <pacote.zip> --saida <pasta> [--semente 20260923]

Por que ela existe: invariante conferida no dado prova ESTRUTURA, nao didatica.
Um conjunto de kits pode passar em I1 a I7 e ser ruim, e ninguem perceberia ate
ela parar de usar sem dizer por que. Foi assim que o acervo de 14/09 morreu.

DOIS BRACOS, com a leitura escrita ANTES de qualquer resultado (decisao da
orquestradora em 23/09, que substitui a arvore de dois destinos do desenho):

  BRACO A, o portao, 20 pares. A regra contra um concorrente do MESMO modulo,
    com o MESMO numero de exercicios, o MESMO orcamento ao decimo, e ORDENADO
    POR DEGRAU pela mesma funcao de ordem da regra. So o conjunto de itens e
    sorteado. Isto pergunta a unica coisa que interessa: a curadoria vale
    alguma coisa alem de ordenar por degrau?

  BRACO B, de sanidade, 10 pares. A regra contra sorteio puro, inclusive na
    ordem, como o DESENHO_kits.md escreveu.

  A ganha                  -> a regra fica como esta.
  A empata ou perde, B ganha -> a regra se simplifica para rampa mais
                             orcamento, que continua sendo kit.
  B tambem perde           -> a saida da secao 8(f): desligar o kit automatico.

O INSTRUMENTO, e ele e parte da prova:

  - A folha vai SEM dizer qual lista e qual, SEM degrau, SEM minutos e SEM
    dizer que restricao foi afrouxada. Rotulo na folha e parte do instrumento,
    e isso invalidou uma revisao inteira em 23/09.
  - O rotulo original do exercicio ("Exercicio 7.") e TAPADO de branco e
    renumerado, exatamente como o compositor do aplicativo faz. Sem isso o
    numero de origem vaza a posicao na lista da fonte, que e de onde o degrau
    sai, e o revisor leria a resposta na propria folha.
  - A ordem de A e B e sorteada por par, e sorteada DE NOVO, de forma
    independente, para cada revisor, para a concordancia entre os dois nao vir
    de os dois verem a mesma disposicao.
  - O gabarito sai num arquivo a parte, que nao vai para revisor nenhum.

O concorrente sai de um sorteio UNIFORME entre todos os subconjuntos do modulo
com aquele tamanho e aquela soma de minutos, contados por programacao dinamica.
Sorteio por tentativa e erro daria peso maior aos conjuntos faceis de achar, e
o peso viraria parte do resultado sem ninguem ter escolhido isso.

O RESULTADO DA PRIMEIRA RODADA, 24/09/2026, sobre o 9o ano v5:

  Braco A: a regra venceu 21 dos 40 julgamentos; o limiar era 26 (p = 0,4373).
           Revisor 1: 12 de 20. Revisor 2: 9 de 20.
           Concordancia entre os dois: 15 de 20 pares, 75%.
  Braco B: 7 de 10; o limiar era 9 (p = 0,1719). Fica como NAO DEMONSTRADO.

  A kits-v1 nao passou, e nao vai para a professora. Post-hoc, e marcado como
  post-hoc porque nao estava pre-registrado e nao decide nada: por nivel a
  regra venceu 11 de 14 no T1, 9 de 14 no T2 e 1 de 12 no T3.

  Esta ferramenta fica porque ela e o instrumento, e nao a peca: serve para a
  proxima regra, para outra serie, e para qualquer coisa que alguem queira
  afirmar sobre qualidade de lista. Foi ela que custou uma rodada inteira e
  evitou entregar 237 listas cuja unica qualidade seria existir.
"""
import argparse
import base64
import collections
import io
import json
import os
import random
import sys
import zipfile
from decimal import Decimal, ROUND_HALF_UP

AQUI = os.path.dirname(os.path.abspath(__file__))

# a tempo-v1, escrita aqui tambem: esta ferramenta nao pode depender nem do
# gerador nem da conferencia para saber quanto vale um item
MEDIANA_SOLUCAO_PT = Decimal(139)


def minutos_decimos(item):
    sol = (item.get('medidas') or {}).get('solucao')
    altura = MEDIANA_SOLUCAO_PT if (not sol or sol.get('altura_pt') is None) else sol['altura_pt']
    v = Decimal('1.5') + Decimal('3.0') * Decimal(str(altura)) / MEDIANA_SOLUCAO_PT
    v = max(Decimal(2), min(Decimal(15), v))
    return int((v * 10).quantize(Decimal('1'), rounding=ROUND_HALF_UP))


def id_do_modulo(item):
    return '%s:%s' % (item['serie'], item['modulo']['slug'])


# ------------------------------------------------- sorteio uniforme exato

def sorteia_subconjunto(itens, n, alvo, rng, evitar=None, tentativas=40):
    """Um subconjunto de `itens` com exatamente `n` itens somando `alvo`
    decimos, sorteado UNIFORMEMENTE entre todos os que existem.

    Conta por programacao dinamica quantos subconjuntos cada estado alcanca e
    depois desce o caminho sorteando proporcionalmente a essa contagem.

    Devolve (subconjunto, quantos existem). O subconjunto vem None quando nao
    existe nenhum, ou quando o unico que existe e o `evitar`, e a contagem ao
    lado diz qual dos dois casos foi."""
    m = len(itens)
    # conta[i][c][s] = subconjuntos usando os itens de i em diante
    conta = [[[0] * (alvo + 1) for _ in range(n + 1)] for _ in range(m + 1)]
    conta[m][0][0] = 1
    for i in range(m - 1, -1, -1):
        mi = itens[i]['_min']
        for c in range(n + 1):
            linha_sem = conta[i + 1][c]
            linha = conta[i][c]
            linha_com = conta[i + 1][c - 1] if c else None
            for s in range(alvo + 1):
                total = linha_sem[s]
                if linha_com is not None and s >= mi:
                    total += linha_com[s - mi]
                linha[s] = total
    quantos = conta[0][n][alvo]
    if quantos == 0:
        return None, 0
    alvo_evitar = tuple(sorted(evitar)) if evitar else None
    for _ in range(tentativas):
        escolhidos = []
        c, s = n, alvo
        for i in range(m):
            if c == 0:
                break
            mi = itens[i]['_min']
            com = conta[i + 1][c - 1][s - mi] if s >= mi else 0
            total = conta[i][c][s]
            if total == 0:
                return None, quantos
            if rng.randrange(total) < com:
                escolhidos.append(itens[i])
                c -= 1
                s -= mi
        if c != 0 or s != 0:
            return None, quantos
        if alvo_evitar and tuple(sorted(i['id'] for i in escolhidos)) == alvo_evitar:
            continue
        return escolhidos, quantos
    return None, quantos


def ordem_da_regra(itens):
    """A mesma ordem que a kits-v1 usa: degrau, minutos, numero. No braco A o
    concorrente recebe ESTA ordem, para o que se compara ser so a escolha dos
    itens."""
    return sorted(itens, key=lambda i: (i['dificuldade'], i['_min'], i['numero'], i['id']))


# ------------------------------------------------------------- as folhas

CABECA = """<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>%s</title>
<style>
  @page { size: 210mm auto; margin: 0; }
  body { margin: 0; padding: 18pt 16pt 24pt; width: 300pt; background: #fff;
         font: 10pt/1.35 Georgia, "Times New Roman", serif; color: #111; }
  h1 { font-size: 12pt; margin: 0 0 14pt; font-weight: normal; letter-spacing: .04em; }
  .item { margin: 0 0 16pt; page-break-inside: avoid; }
  .acima { font-size: 9.5pt; margin: 0 0 3pt; }
  .recorte { position: relative; }
  .recorte img { display: block; width: 100%%; height: auto; }
  .tapa { position: absolute; background: #fff; }
  .numero { position: absolute; font-size: 9.5pt; line-height: 1; white-space: nowrap; }
</style></head><body>
<h1>%s</h1>
"""


def folha_html(titulo, itens, assets):
    partes = [CABECA % (titulo, titulo)]
    for k, it in enumerate(itens, 1):
        medidas = (it.get('medidas') or {}).get('enunciado') or {}
        largura = float(medidas.get('largura_pt') or 262)
        altura = float(medidas.get('altura_pt') or 100)
        rotulo = medidas.get('rotulo')
        svg = assets[it['assets']['enunciado']]
        b64 = base64.b64encode(svg).decode('ascii')
        partes.append('<div class="item">')
        if not rotulo:
            # sem caixa do rotulo, o numero novo vai numa linha acima e o
            # original fica visivel: e o que o aplicativo faz
            partes.append('<p class="acima">Exerc&iacute;cio %d.</p>' % k)
        partes.append('<div class="recorte" style="width:%.2fpt;height:%.2fpt">' % (largura, altura))
        partes.append('<img alt="" src="data:image/svg+xml;base64,%s">' % b64)
        if rotulo:
            x0, y0, x1, y1 = [float(v) for v in rotulo]
            partes.append('<div class="tapa" style="left:%.2fpt;top:%.2fpt;width:%.2fpt;height:%.2fpt"></div>'
                          % (x0 - 1, y0 - 1, x1 - x0 + 2, y1 - y0 + 2))
            partes.append('<div class="numero" style="left:%.2fpt;top:%.2fpt">Exerc&iacute;cio %d.</div>'
                          % (x0, y0, k))
        partes.append('</div></div>')
    partes.append('</body></html>')
    return ''.join(partes)


# ------------------------------------------------------- o que o revisor le

"""O texto que vai ao revisor e parte do instrumento, tanto quanto a folha, e
por isso ele mora aqui, versionado, e nao na cabeca de quem lanca o revisor.

Nada nele diz que existe uma regra, um kit, um sorteio, um nivel ou uma
trajetoria. Nada diz que uma das listas foi montada por programa. Falar em
"rampa", "dificuldade crescente" ou "cobertura do assunto" entregaria a
resposta junto com a pergunta, que foi o que invalidou uma revisao inteira em
23/09."""
PERGUNTA = """Voce da aulas particulares de matematica para alunos do 9o ano.

Para cada par abaixo voce recebe DUAS folhas de exercicios candidatas a mesma
aula. As duas sao do mesmo assunto, tem o mesmo numero de exercicios e foram
pensadas para o mesmo tempo de aula. Elas diferem em quais exercicios entraram
e na ordem em que aparecem.

Sua tarefa, para cada par: olhe as duas folhas e responda UMA coisa so.

    Qual das duas voce daria ao aluno, e por que?

Nao existe gabarito. Ninguem vai conferir a sua escolha contra uma resposta
certa: o que interessa e o seu juizo de professora.

REGRAS
- Voce NAO pode abrir subagente, nem delegar a leitura. Olhe as folhas voce
  mesma, uma por uma.
- Abra as DUAS folhas de um par antes de responder aquele par.
- Escolha sempre uma das duas. Empate nao e resposta.
- O "por que" tem no maximo duas frases e fala do que voce viu nas folhas.
- Responda todos os pares, na ordem.

OS ARQUIVOS
Os pares vao de 01 ate %(ultimo)02d. Cada folha e alta e por isso vem em
partes, sempre cortadas entre um exercicio e o seguinte, nunca no meio de um.
O arquivo INDICE.txt desta pasta lista, para cada folha, as partes na ordem.
Abra TODAS as partes de uma folha antes de julgar.

    par-NN-lista-A-parte-1.png, par-NN-lista-A-parte-2.png, ...
    par-NN-lista-B-parte-1.png, par-NN-lista-B-parte-2.png, ...

A RESPOSTA
Termine o seu relatorio final com este JSON, e nada depois dele:

{"braco": "%(braco)s", "revisor": "%(revisor)s", "respostas": [
  {"par": 1, "escolha": "A", "porque": "..."},
  {"par": 2, "escolha": "B", "porque": "..."}
]}

"escolha" e a letra da folha que voce daria ao aluno.
"""


# ------------------------------------------------------------------ o todo

def escolher_kits(kits, semente, por_nivel):
    """Os kits que viram par, sorteados com semente fixa, estratificados por
    nivel para os tres aparecerem."""
    rng = random.Random(semente)
    saida = []
    for nivel, quantos in sorted(por_nivel.items()):
        do_nivel = sorted([k for k in kits if k['nivel'] == nivel], key=lambda k: k['id'])
        rng.shuffle(do_nivel)
        saida.extend(do_nivel[:quantos])
    return sorted(saida, key=lambda k: k['id'])


def monta(pacote, saida, semente, revisores, caminho_gabarito):
    with zipfile.ZipFile(pacote) as z:
        itens = json.loads(z.read('itens.json').decode('utf-8'))
        kits = json.loads(z.read('kits.json').decode('utf-8'))
        nomes = set(z.namelist())
        assets = {}
        for it in itens:
            cam = (it.get('assets') or {}).get('enunciado')
            if cam and cam in nomes:
                assets[cam] = z.read(cam)
    for it in itens:
        it['_min'] = minutos_decimos(it)
    por_modulo = collections.defaultdict(list)
    for it in itens:
        if (it.get('assets') or {}).get('solucao'):
            por_modulo[id_do_modulo(it)].append(it)
    por_id = {i['id']: i for i in itens}

    bracos = [
        ('A', {1: 7, 2: 7, 3: 6}, semente, True),      # ordenado por degrau
        ('B', {1: 3, 2: 3, 3: 4}, semente + 1, False),  # sorteio puro, inclusive a ordem
    ]
    gabarito = {'pacote': os.path.basename(pacote), 'semente': semente, 'revisores': revisores, 'bracos': {}}
    os.makedirs(saida, exist_ok=True)

    for nome_braco, por_nivel, sem, ordenado in bracos:
        rng = random.Random(sem)
        escolhidos = escolher_kits(kits, sem, por_nivel)
        pares, descartados = [], []
        for kit in escolhidos:
            ids = [d['item'] for d in kit['degraus']]
            nossos = [por_id[i] for i in ids]
            alvo = sum(i['_min'] for i in nossos)
            candidatos = sorted(por_modulo[kit['modulo']], key=lambda i: i['id'])
            outro, quantos = sorteia_subconjunto(candidatos, len(nossos), alvo, rng, evitar=ids)
            if outro is None:
                # a mensagem diz QUAL das duas coisas aconteceu: nao existe
                # conjunto nenhum, ou o unico que existe e o nosso. Dizer
                # sempre a primeira seria escrever no registro um fato que nao
                # foi medido.
                motivo = ('nao existe conjunto nenhum do modulo com %d itens somando %s minutos'
                          % (len(nossos), Decimal(alvo) / 10) if quantos == 0 else
                          'o unico conjunto do modulo com %d itens somando %s minutos e o proprio kit'
                          % (len(nossos), Decimal(alvo) / 10))
                descartados.append({'kit': kit['id'], 'motivo': motivo, 'conjuntos_possiveis': quantos})
                continue
            nossa_lista = [por_id[i] for i in ids]          # a ordem do kit, que e a trajetoria
            if ordenado:
                dele = ordem_da_regra(outro)
            else:
                dele = list(outro)
                rng.shuffle(dele)
            pares.append({'kit': kit['id'], 'nivel': kit['nivel'], 'modulo': kit['modulo'],
                          'n': len(nossos), 'minutos': str(Decimal(alvo) / 10),
                          'regra': [i['id'] for i in nossa_lista], 'sorteio': [i['id'] for i in dele],
                          '_regra': nossa_lista, '_sorteio': dele})

        do_braco = {'pares': [], 'descartados': descartados, 'ordenado_por_degrau': ordenado}
        # A disposicao de cada revisor e sorteada de forma independente, mas
        # EQUILIBRADA: metade dos pares com a regra na lista A. Sorteio par a
        # par, sem equilibrio, deixa a contagem de lados torta, e ai um revisor
        # que so goste da folha da esquerda ja pontua acima de metade sem ter
        # julgado nada. Medido na primeira montagem: 11 e 11 de 20, e os dois
        # revisores vendo o mesmo lado em 14 dos 20 pares.
        quantos_revisores = revisores if nome_braco == 'A' else 1
        disposicao = {}
        for rev in range(1, quantos_revisores + 1):
            lados = [True] * (len(pares) // 2) + [False] * (len(pares) - len(pares) // 2)
            random.Random('%s|%s|disposicao|%d' % (sem, nome_braco, rev)).shuffle(lados)
            disposicao['revisor%d' % rev] = lados
        for n_par, par in enumerate(pares, 1):
            registro = {'par': n_par, 'kit': par['kit'], 'nivel': par['nivel'], 'modulo': par['modulo'],
                        'n': par['n'], 'minutos': par['minutos'],
                        'regra': par['regra'], 'sorteio': par['sorteio'], 'por_revisor': {}}
            # dois revisores independentes no braco A, que e o portao; um no B
            for rev in range(1, quantos_revisores + 1):
                primeiro_e_a_regra = disposicao['revisor%d' % rev][n_par - 1]
                lado = {'A': 'regra' if primeiro_e_a_regra else 'sorteio',
                        'B': 'sorteio' if primeiro_e_a_regra else 'regra'}
                registro['por_revisor']['revisor%d' % rev] = lado
                pasta = os.path.join(saida, 'braco-%s' % nome_braco, 'revisor%d' % rev)
                os.makedirs(pasta, exist_ok=True)
                for letra in ('A', 'B'):
                    lista = par['_regra'] if lado[letra] == 'regra' else par['_sorteio']
                    html = folha_html('Par %02d, lista %s' % (n_par, letra), lista, assets)
                    alvo_html = os.path.join(pasta, 'par-%02d-lista-%s.html' % (n_par, letra))
                    io.open(alvo_html, 'w', encoding='utf-8', newline='\n').write(html)
            do_braco['pares'].append(registro)
        # a pergunta vai junto com as folhas, uma copia por revisor
        quantos_revisores = revisores if nome_braco == 'A' else 1
        for rev in range(1, quantos_revisores + 1):
            pasta = os.path.join(saida, 'braco-%s' % nome_braco, 'revisor%d' % rev)
            if not os.path.isdir(pasta):
                continue
            io.open(os.path.join(pasta, 'PERGUNTA.txt'), 'w', encoding='utf-8', newline='\n').write(
                PERGUNTA % {'ultimo': len(do_braco['pares']), 'braco': nome_braco,
                            'revisor': 'revisor%d' % rev})
        gabarito['bracos'][nome_braco] = do_braco
        print('braco %s: %d pares montados, %d descartados' % (nome_braco, len(do_braco['pares']), len(descartados)))
        for d in descartados:
            print('   descartado: %s (%s)' % (d['kit'], d['motivo']))

    # O gabarito NAO mora dentro da arvore que o revisor enxerga. Chave de
    # resposta ao lado da folha e o mesmo erro do rotulo na folha: basta o
    # revisor olhar a pasta de cima uma vez.
    io.open(caminho_gabarito, 'w', encoding='utf-8', newline='\n').write(
        json.dumps(gabarito, ensure_ascii=False, indent=1) + '\n')
    print('gabarito, FORA da pasta das folhas: %s' % caminho_gabarito)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('pacote')
    ap.add_argument('--saida', required=True)
    ap.add_argument('--semente', type=int, default=20260923)
    ap.add_argument('--revisores', type=int, default=2)
    ap.add_argument('--gabarito', default=None,
                    help='caminho do gabarito. O padrao fica FORA da pasta das folhas, de proposito')
    x = ap.parse_args(argv)
    gab = x.gabarito or (os.path.normpath(x.saida.rstrip('/\\')) + '-GABARITO_nao_mostrar.json')
    monta(x.pacote, x.saida, x.semente, x.revisores, gab)
    return 0


if __name__ == '__main__':
    sys.exit(main())
