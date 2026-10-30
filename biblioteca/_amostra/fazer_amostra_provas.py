"""Faz provas sinteticas no formato da OBMEP Mirim e do ENEM, para a prova do tipo de fonte provas.

    python biblioteca/_amostra/fazer_amostra_provas.py <pasta>

Conteudo proprio, escrito aqui, para a prova rodar no portao sem o Drive.
Imita o que o C12 mediu nas provas reais (ver o cabecalho de biblioteca/provas.py):

Mirim (pasta <pasta>/mirim):
- 2099_fase1_mirim1_prova.pdf: capa com "MIRIM 1", "2o E 3o ANOS DO ENSINO
  FUNDAMENTAL" e instrucoes numeradas "1." a "3." em negrito de 10 pt (a
  primeira sem palavra de instrucao, para so a cadeia de tras a recusar);
  tres paginas de questoes com cabecalho corrido, questao "N." em negrito de
  13 pt na margem, fio separador de pagina inteira acima de cada questao, a
  figura da questao 2 subindo 6 pt acima da linha do numero, e a questao 3
  atravessando a pagina; na quarta pagina, o fecho ("Obrigado por participar"
  e uma atividade extra), que nao e da ultima questao.
- 2099_fase1_mirim1_solucao.pdf: "QUESTAO N - ALTERNATIVA X" e a solucao,
  com cabecalho corrido nas paginas 2 e 3.

ENEM (pasta <pasta>/enem):
- 2099_dia2_caderno-azul.pdf: capa com instrucoes; paginas de duas colunas
  com fio vertical na divisa, cabecalho e rodape com o numero da pagina;
  "QUESTAO 135" (fora da Matematica), 136 a 140, a 137 atravessando para a
  pagina seguinte e a 139 com uma figura que cruza a divisa.
- 2099_dia2_gabarito.pdf: a tabela QUESTAO / GABARITO, com a 138 anulada.
"""
import os
import sys

import pymupdf

FIXO = {'creationDate': 'D:20261030000000', 'modDate': 'D:20261030000000', 'producer': 'amostra', 'creator': 'amostra'}
W, H = 595.0, 842.0


def salvar(doc, caminho):
    doc.set_metadata(FIXO)
    doc.save(caminho, garbage=3, deflate=True, no_new_id=True)
    return caminho


def linhas(pg, x, y, textos, corpo=10, fonte='helv', passo=13.0):
    for i, t in enumerate(textos):
        pg.insert_text((x, y + passo * i), t, fontname=fonte, fontsize=corpo)
    return y + passo * len(textos)


def alternativas(pg, x, y, valores):
    for i, (letra, v) in enumerate(zip('ABCDE', valores)):
        pg.draw_circle((x + 4, y - 3.5 + 13 * i), 4.5, width=0.6)
        pg.insert_text((x + 1.8, y + 13 * i), letra, fontname='helv', fontsize=6)
        pg.insert_text((x + 14, y + 13 * i), v, fontname='helv', fontsize=10)
    return y + 13 * len(valores)


def cab_mirim(pg, n):
    pg.insert_text((210, 40), 'OBMEP MIRIM 2o E 3o ANOS - 1a Fase', fontname='hebo', fontsize=10)
    pg.draw_line((22, 52), (573, 52), width=0.5)
    pg.insert_text((32, 44), str(n), fontname='helv', fontsize=16)


def fio(pg, y):
    pg.draw_line((22, y), (573, y), width=1.0)


def mirim(pasta):
    os.makedirs(pasta, exist_ok=True)
    doc = pymupdf.open()
    pg = doc.new_page(width=W, height=H)
    pg.insert_text((480, 50), 'MIRIM 1', fontname='hebo', fontsize=18)
    pg.insert_text((290, 75), '2o E 3o ANOS DO ENSINO FUNDAMENTAL', fontname='hebo', fontsize=14)
    pg.insert_text((262, 240), 'INSTRUÇÕES', fontname='hebo', fontsize=11)
    pg.insert_text((23, 270), '1.', fontname='hebo', fontsize=10)
    pg.insert_text((42, 270), 'ESCREVA SEU NOME COM LETRA DE FORMA.', fontname='helv', fontsize=10)
    pg.insert_text((23, 300), '2.', fontname='hebo', fontsize=10)
    pg.insert_text((42, 300), 'MARQUE APENAS UMA ALTERNATIVA PARA CADA QUESTÃO.', fontname='helv', fontsize=10)
    pg.insert_text((23, 330), '3.', fontname='hebo', fontsize=10)
    pg.insert_text((42, 330), 'PASSE AS RESPOSTAS PARA O CARTÃO DA PROVA.', fontname='helv', fontsize=10)
    # pagina 2: questoes 1 e 2
    pg = doc.new_page(width=W, height=H)
    cab_mirim(pg, 2)
    pg.insert_text((23, 80), '1.', fontname='hebo', fontsize=13)
    linhas(pg, 44, 80, ['QUANTAS BOLINHAS HÁ NA CAIXA AO LADO?'])
    pg.draw_rect(pymupdf.Rect(380, 70, 560, 160), width=1.2)
    for k in range(6):
        pg.draw_circle((400 + 25 * k, 115), 8, fill=(0, 0, 0))
    alternativas(pg, 23, 110, ['4', '5', '6', '7', '8'])
    fio(pg, 300)
    # a figura da questao 2 sobe 6 pt acima da linha do numero (como a 5 da Mirim 1 2022, 1a fase)
    pg.draw_rect(pymupdf.Rect(400, 309, 560, 420), color=(0, 0, 0), fill=(0.6, 0.6, 0.6), width=0.8)
    pg.insert_text((23, 328), '2.', fontname='hebo', fontsize=13)
    linhas(pg, 44, 328, ['JOANA TINHA 9 FIGURINHAS E GANHOU MAIS 5 DE SUA AVÓ.',
                         'QUANTAS FIGURINHAS ELA TEM AGORA?'])
    alternativas(pg, 23, 370, ['12', '13', '14', '15', '16'])
    fio(pg, 560)
    pg.insert_text((23, 590), '3.', fontname='hebo', fontsize=13)
    linhas(pg, 44, 590, ['O RELÓGIO MARCA 9 HORAS. QUE HORAS SERÃO', 'DAQUI A 2 HORAS E 30 MINUTOS?'])
    pg.draw_rect(pymupdf.Rect(60, 640, 300, 800), width=1)
    # pagina 3: o resto da questao 3, e a 4
    pg = doc.new_page(width=W, height=H)
    cab_mirim(pg, 3)
    alternativas(pg, 23, 90, ['10h30', '11h', '11h30', '12h', '12h30'])
    fio(pg, 200)
    pg.insert_text((23, 230), '4.', fontname='hebo', fontsize=13)
    linhas(pg, 44, 230, ['QUAL DESTAS FIGURAS É UM TRIÂNGULO?'])
    for k in range(5):
        pg.draw_rect(pymupdf.Rect(60 + 90 * k, 260, 120 + 90 * k, 320), width=1)
    alternativas(pg, 23, 350, ['A PRIMEIRA', 'A SEGUNDA', 'A TERCEIRA', 'A QUARTA', 'A QUINTA'])
    # pagina 4: o fecho da prova (como a atividade extra do Nivel A de 2019),
    # que nao e da questao 4
    pg = doc.new_page(width=W, height=H)
    cab_mirim(pg, 4)
    pg.insert_text((23, 90), 'Obrigado por participar da OBMEP Mirim 2099.', fontname='helv', fontsize=10)
    pg.insert_text((23, 120), 'ATIVIDADE EXTRA: DESENHE UM QUADRADO E CONTE OS LADOS.', fontname='hebo', fontsize=12)
    salvar(doc, os.path.join(pasta, '2099_fase1_mirim1_prova.pdf'))

    doc = pymupdf.open()
    pg = doc.new_page(width=W, height=H)
    pg.insert_text((214, 160), 'Solução da prova', fontname='hebo', fontsize=20)
    pg.insert_text((430, 55), 'MIRIM 1 - 2099', fontname='hebo', fontsize=18)
    pg.insert_text((262, 80), '2o E 3o ANOS DO ENSINO FUNDAMENTAL', fontname='hebo', fontsize=12)
    y = 200
    for n, letra, sol in ((1, 'C', ['Solução: Na caixa há 6 bolinhas pretas.']),
                          (2, 'C', ['Solução: Ela tinha 9 e ganhou 5; então tem 9 + 5 = 14 figurinhas.'])):
        pg.insert_text((43, y), 'QUESTÃO %d - ALTERNATIVA %s' % (n, letra), fontname='hebo', fontsize=12)
        y = linhas(pg, 43, y + 22, sol) + 30
        fio(pg, y - 15)
    for p in (2, 3):
        pg = doc.new_page(width=W, height=H)
        pg.insert_text((376, 55), 'MIRIM 1 - OBMEP 2099', fontname='hebo', fontsize=14)
        pg.insert_text((545, 85), str(p), fontname='hebo', fontsize=14)
        if p == 2:
            pg.insert_text((43, 120), 'QUESTÃO 3 - ALTERNATIVA C', fontname='hebo', fontsize=12)
            linhas(pg, 43, 142, ['Solução: Duas horas depois das 9 horas são 11 horas, e mais',
                                 '30 minutos dão 11h30.'])
            fio(pg, 300)
        else:
            pg.insert_text((43, 120), 'QUESTÃO 4 - ALTERNATIVA B', fontname='hebo', fontsize=12)
            linhas(pg, 43, 142, ['Solução: O triângulo tem três lados; só a segunda figura tem três lados.'])
    salvar(doc, os.path.join(pasta, '2099_fase1_mirim1_solucao.pdf'))


def cab_enem(pg, n):
    pg.insert_text((420, 35), 'enem2099', fontname='hebo', fontsize=18)
    pg.draw_line((32, 50), (563, 50), width=0.5)
    pg.insert_text((32, 820), 'MT - 2o DIA - CADERNO 7 - AZUL - Página %d' % n, fontname='helv', fontsize=7)
    pg.draw_line((297.5, 60), (297.5, 800), width=0.4)


def questao(pg, x, y, n, textos, valores):
    pg.insert_text((x, y), 'QUESTÃO %d' % n, fontname='hebo', fontsize=10)
    y = linhas(pg, x, y + 18, textos, corpo=9.5, passo=12)
    return alternativas(pg, x, y + 8, valores)


def enem(pasta):
    os.makedirs(pasta, exist_ok=True)
    doc = pymupdf.open()
    pg = doc.new_page(width=W, height=H)
    pg.insert_text((40, 300), '1. Este CADERNO DE QUESTÕES contém 90 questões.', fontname='hebo', fontsize=10)
    pg.insert_text((40, 320), '2. Confira se a quantidade e a ordem das questões estão corretas.', fontname='hebo', fontsize=10)
    # pagina 2: 135 (outra area), 136 e 137 (que segue na pagina 3)
    pg = doc.new_page(width=W, height=H)
    cab_enem(pg, 2)
    questao(pg, 32, 80, 135, ['Uma questão de outra área, que não entra no pacote.'], ['1', '2', '3', '4', '5'])
    pg.insert_text((32, 300), 'MATEMÁTICA E SUAS TECNOLOGIAS', fontname='hebo', fontsize=11)
    pg.insert_text((32, 314), 'Questões de 136 a 180', fontname='hebo', fontsize=11)
    questao(pg, 32, 340, 136, ['Uma loja vende canetas a 3 reais cada.', 'Quanto custam 7 canetas?'],
            ['18', '19', '20', '21', '22'])
    questao(pg, 305, 80, 137, ['Um terreno retangular mede 12 m por 30 m.', 'Qual é a área do terreno,',
                               'em metros quadrados?'], ['42', '84', '180', '360', '720'])
    pg.draw_rect(pymupdf.Rect(320, 220, 540, 780), width=1)
    pg = doc.new_page(width=W, height=H)
    cab_enem(pg, 3)
    # o resto da 137, no alto da coluna da esquerda
    linhas(pg, 32, 80, ['(continuação) Considere o terreno inteiro.'], corpo=9.5)
    questao(pg, 32, 130, 138, ['Uma questão que o gabarito anulou.'], ['1', '2', '3', '4', '5'])
    questao(pg, 305, 80, 139, ['Observe a figura, que ocupa as duas colunas.'], ['1', '2', '3', '4', '5'])
    pg.draw_rect(pymupdf.Rect(200, 200, 450, 260), width=1.2, fill=(0.4, 0.4, 0.4))
    questao(pg, 305, 400, 140, ['Num sorteio com 4 bolas, 1 é azul.', 'Qual é a probabilidade de sair a azul?'],
            ['1/2', '1/3', '1/4', '1/5', '1/6'])
    salvar(doc, os.path.join(pasta, '2099_dia2_caderno-azul.pdf'))

    doc = pymupdf.open()
    pg = doc.new_page(width=W, height=H)
    pg.insert_text((60, 60), '2o DIA - CADERNO 7 - AZUL', fontname='hebo', fontsize=12)
    pg.insert_text((60, 90), 'QUESTÃO', fontname='hebo', fontsize=9)
    pg.insert_text((120, 90), 'GABARITO', fontname='hebo', fontsize=9)
    for k, (n, r) in enumerate(((136, 'D'), (137, 'D'), (138, 'Anulado'), (139, 'A'), (140, 'C'))):
        pg.insert_text((60, 110 + 16 * k), str(n), fontname='helv', fontsize=9)
        pg.insert_text((125, 110 + 16 * k), r, fontname='helv', fontsize=9)
    salvar(doc, os.path.join(pasta, '2099_dia2_gabarito.pdf'))


def fazer(pasta):
    mirim(os.path.join(pasta, 'mirim'))
    enem(os.path.join(pasta, 'enem'))
    return pasta


if __name__ == '__main__':
    print(fazer(sys.argv[1]))
