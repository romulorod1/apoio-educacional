"""Atualiza Biblioteca/LACUNAS_temas_sem_aulas.md e .csv com as questoes dos pacotes de provas (C12).

    python biblioteca/lacunas.py --pasta <Aplicativo/Biblioteca> --pacote <zip ou pasta de trabalho> [--pacote ...]
                                 [--data 2026-10-30] [--escrever]

O arquivo foi feito em 22/09 pela sessao B1, por um script que nao esta no
repositorio nem no Drive (procurado no repositorio, em Biblioteca e Consolidado
no Drive e nas pastas de rascunho das sessoes). Refazer o cruzamento inteiro
dos 148 temas com as aulas seria escrever outro script e mudar linhas que
nada tem com o C12; esta ferramenta so reaplica a evidencia nova:

- tema "sem aula" com questao de prova classificada nele (tema_app, pela
  regra de palavras do biblioteca/provas.py) passa a "com questoes";
- tema de outra situacao com questao de prova ganha a contagem na evidencia,
  e a situacao fica (a situacao fala de aula, e questao nao e aula);
- a contagem por serie, o resumo das lacunas e a conferencia sao refeitos.

Sem --escrever, so diz o que mudaria. Rodar de novo com os mesmos pacotes nao
muda nada (a coluna das questoes e reescrita, e nao somada).
"""
import argparse
import collections
import csv
import io
import json
import os
import re
import sys
import zipfile

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import provas  # noqa: E402

COM_QUESTOES = 'com questões'
SITUACOES = ['casado', 'em outra série', 'parcial', COM_QUESTOES, 'sem aula']
ORDEM_SERIE = ['2º ano', '3º ano', '4º ano', '5º ano', '6º ano', '7º ano', '8º ano', '9º ano',
               '1ª série', '2ª série', '3ª série']
BULLET_SITUACAO = ('- **com questões**: nenhuma aula cobre o tema, mas um pacote de provas (OBMEP Mirim ou ENEM, '
                   'item C12) traz questões classificadas nele pela regra de palavras do gerador. Questão de prova '
                   'não é aula: serve para praticar e diagnosticar, e a aula continua faltando.')
TRACOS = (chr(0x2013), chr(0x2014))


def ler_pacote(caminho):
    """(nome do pacote, itens) de um zip ou de uma pasta de trabalho."""
    if caminho.lower().endswith('.zip'):
        with zipfile.ZipFile(caminho) as z:
            man = json.loads(z.read('manifest.json').decode('utf-8'))
            itens = json.loads(z.read('itens.json').decode('utf-8'))
    else:
        man = json.load(io.open(os.path.join(caminho, 'manifest.json'), encoding='utf-8'))
        itens = json.load(io.open(os.path.join(caminho, 'itens.json'), encoding='utf-8'))
    return '%s v%d' % (man['pacote'], man['versao']), itens


def questoes_por_tema(pacotes):
    """{tema: {pacote: [aula, ...]}} das questoes com tema_app."""
    out = collections.defaultdict(lambda: collections.defaultdict(list))
    for nome, itens in pacotes:
        for it in itens:
            if it.get('tema_app'):
                out[it['tema_app']][nome].append(it['aula']['titulo'])
    return out


def descrever(por_pacote):
    """'7 questões em `matematica-obmep-mirim-m1 v1` (OBMEP Mirim 2022, 1ª fase, ...)'"""
    partes = []
    for nome in sorted(por_pacote):
        aulas = por_pacote[nome]
        provas_ = sorted(set(aulas))
        partes.append('%d %s em `%s` (%s)' % (len(aulas), 'questão' if len(aulas) == 1 else 'questões', nome,
                                             ', '.join(provas_)))
    return '; '.join(partes)


def atualizar(pasta, pacotes, data):
    csv_cam = os.path.join(pasta, 'LACUNAS_temas_sem_aulas.csv')
    md_cam = os.path.join(pasta, 'LACUNAS_temas_sem_aulas.md')
    linhas = list(csv.reader(io.open(csv_cam, encoding='utf-8-sig', newline=''), delimiter=';'))
    cab, corpo = linhas[0], linhas[1:]
    if 'questoes_de_prova' not in cab:
        cab.append('questoes_de_prova')
        for l in corpo:
            l.append('')
    i_id, i_serie, i_sit, i_q = cab.index('id'), cab.index('serie'), cab.index('situacao'), cab.index('questoes_de_prova')
    i_tit = cab.index('titulo')
    qt = questoes_por_tema(pacotes)
    mudou, anotou = [], []
    for l in corpo:
        tid = l[i_id]
        if tid in qt:
            l[i_q] = descrever(qt[tid])
            if l[i_sit] in ('sem aula', COM_QUESTOES):
                if l[i_sit] == 'sem aula':
                    mudou.append(tid)
                l[i_sit] = COM_QUESTOES
            else:
                anotou.append(tid)
        else:
            l[i_q] = ''
            if l[i_sit] == COM_QUESTOES:
                l[i_sit] = 'sem aula'
    por = {l[i_id]: l for l in corpo}

    md = io.open(md_cam, encoding='utf-8').read()
    # situacoes: a nova entra depois de "parcial"
    if '**com questões**' not in md:
        md = md.replace('- **sem aula**:', BULLET_SITUACAO + '\n- **sem aula**:', 1)
    # contagem por serie, refeita da tabela
    conta = collections.OrderedDict((s, collections.Counter()) for s in ORDEM_SERIE)
    for l in corpo:
        conta.setdefault(l[i_serie], collections.Counter())[l[i_sit]] += 1
    tab = ['| Série | Temas | Casado | Em outra série | Parcial | Com questões | Sem aula |',
           '|---|---:|---:|---:|---:|---:|---:|']
    total = collections.Counter()
    for s, c in conta.items():
        if not sum(c.values()):
            continue
        tab.append('| %s | %d | %s |' % (s, sum(c.values()), ' | '.join(str(c[x]) for x in SITUACOES)))
        total.update(c)
    tab.append('| **Total** | **%d** | %s |' % (sum(total.values()), ' | '.join('**%d**' % total[x] for x in SITUACOES)))
    md = re.sub(r'\| Série \| Temas \|[^\n]*\n\|---[^\n]*\n(?:\|[^\n]*\n)+', '\n'.join(tab) + '\n', md, count=1)
    # o resumo das lacunas
    sem, com, par = total['sem aula'], total[COM_QUESTOES], total['parcial']
    md = re.sub(r'^\d+ temas: [^\n]*?\. Para cada um', '%d temas: %d sem aula, %d com questões de prova e %d parciais. '
                'Para cada um' % (sem + com + par, sem, com, par), md, count=1, flags=re.M)
    # o cabecalho de cada tema e a linha das questoes logo abaixo dele
    saida = []
    texto = md.split('\n')
    k = 0
    while k < len(texto):
        l = texto[k]
        m = re.match(r'^\*\*(MAT\S+) (.+)\*\* \((.+?), (sem aula|parcial|com questões)\)$', l)
        if m and m.group(1) in por:
            tid = m.group(1)
            sit = por[tid][i_sit]
            l = '**%s %s** (%s, %s)' % (tid, m.group(2), m.group(3), sit)
            saida.append(l)
            k += 1
            # tira a linha de questoes de uma rodada anterior
            if k + 1 < len(texto) and texto[k] == '' and texto[k + 1].startswith('- Questões de prova:'):
                k += 2
            if por[tid][i_q]:
                saida.extend(['', '- Questões de prova: %s.' % por[tid][i_q]])
            continue
        # a tabela completa: situacao e evidencia
        m = re.match(r'^\| (MAT\S+) ([^|]+) \| ([^|]+) \| ([^|]+) \|(.*)$', l)
        if m and m.group(1) in por:
            tid = m.group(1)
            resto = re.sub(r'; questões de prova: [^|]*', '', m.group(5))
            if por[tid][i_q]:
                celulas = resto.rsplit('|', 2)
                if len(celulas) == 3:
                    celulas[1] = celulas[1].rstrip() + '; questões de prova: %s ' % por[tid][i_q]
                    resto = '|'.join(celulas)
            l = '| %s %s | %s | %s |%s' % (tid, m.group(2).strip(), m.group(3).strip(), por[tid][i_sit], resto)
        saida.append(l)
        k += 1
    md = '\n'.join(saida)
    # a conferencia desta atualizacao
    md = re.sub(r'\n\nAtualização de \d{2}/\d{2}/\d{4} \(C12\):[^\n]*', '', md)
    n_q = sum(len(v) for t in qt.values() for v in t.values())
    md = md.rstrip('\n') + ('\n\nAtualização de %s (C12): o script que fez este arquivo em 22/09 não está no repositório '
                            'nem no Drive; esta atualização é do `biblioteca/lacunas.py`, que só reaplica a evidência dos '
                            'pacotes de provas (%s). Conferiu %d questões com assunto em %d temas; %d temas passaram de '
                            '"sem aula" a "com questões" e %d de outra situação ganharam a contagem na evidência. As '
                            'outras linhas são as de 22/09.\n') % (
        data, ', '.join('`%s`' % n for n, _ in pacotes), n_q, len(qt), len(mudou), len(anotou))
    for t in TRACOS:
        if t in md:
            raise SystemExit('erro: o texto novo teria travessao ou meia-risca')
    # conferencia: md e csv contam igual, e todo "com questoes" tem questao
    for l in corpo:
        if l[i_sit] == COM_QUESTOES and l[i_id] not in qt:
            raise SystemExit('erro: %s com questoes sem questao nos pacotes' % l[i_id])
    faltam = [tid for tid in mudou if '**%s ' % tid not in md or '| %s ' % tid not in md]
    if faltam:
        raise SystemExit('erro: tema mudado que nao aparece no texto: %s' % faltam)
    for s, c in conta.items():
        linha = re.search(r'^\| %s \| (\d+) \|' % re.escape(s), md, re.M)
        if sum(c.values()) and (not linha or int(linha.group(1)) != sum(c.values())):
            raise SystemExit('erro: a contagem do %s no texto nao bate com a tabela' % s)
    return cab, corpo, md, mudou, anotou, conta, i_tit


def principal(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('--pasta', required=True)
    ap.add_argument('--pacote', action='append', required=True)
    ap.add_argument('--data', default='30/10/2026')
    ap.add_argument('--escrever', action='store_true')
    a = ap.parse_args(argv)
    pacotes = [ler_pacote(p) for p in a.pacote]
    cab, corpo, md, mudou, anotou, conta, i_tit = atualizar(a.pasta, pacotes, a.data)
    temas = provas.carregar_temas()
    dois_a_cinco = [t for t in mudou if temas.get(t, {}).get('serie') in ('02', '03', '04', '05')]
    print(json.dumps({'sem_aula_para_com_questoes': len(mudou), 'dos_quais_2o_ao_5o_ano': len(dois_a_cinco),
                      'temas': mudou, 'outra_situacao_com_questoes': anotou}, ensure_ascii=False, indent=1))
    if a.escrever:
        with io.open(os.path.join(a.pasta, 'LACUNAS_temas_sem_aulas.csv'), 'w', encoding='utf-8-sig', newline='') as f:
            w = csv.writer(f, delimiter=';', lineterminator='\n')
            w.writerow(cab)
            w.writerows(corpo)
        with io.open(os.path.join(a.pasta, 'LACUNAS_temas_sem_aulas.md'), 'w', encoding='utf-8', newline='') as f:
            f.write(md)
        print('gravados os dois arquivos em %s' % a.pasta)


if __name__ == '__main__':
    principal()
