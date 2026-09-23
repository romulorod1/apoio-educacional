"""Faz os PDFs sinteticos da amostra do gerador, imitando o layout do Portal.

    python biblioteca/_amostra/fazer_amostra.py <pasta> [--sem-item N] [--duplica-solucao N]

Conteudo proprio, escrito aqui, para a prova do gerador rodar no portao sem
o Drive e sem nenhum PDF de terceiros no repositorio. Os PDFs sao feitos a
cada rodada da prova, numa pasta temporaria; nada binario fica guardado.

Imita o que foi medido nas listas do 9o ano (Biblioteca/PADROES_numeracao_9ano.md),
nos dois modelos de pagina do Portal:

- lista-de-amostra (modelo Palladio): fio separador em x 306, margem direita
  em 315,6, fio de rodape em y 767;
- lista-cm (modelo Computer Modern): fio em x 291, margem direita em 301,4,
  fio de rodape em y 747. A divisa entre 291 e 306 e o que a trava de coluna
  tem de acompanhar.

Em cada lista: capa; marcador "Exercicio" e numero em spans separados (itens
1, 3 e 4) e num span so (item 2); titulo de secao logo abaixo do fim de um
item; item que atravessa a coluna (item 3); objetiva com alternativas a) a e)
e "Resposta B." na solucao, que traz a origem "(Extraido da OBMEP - 2013)";
nota de rodape no pe da coluna, abaixo do item 3; secao "Respostas e
Solucoes" em pagina propria; bloco de creditos
("Elaborado por", "Produzido por") no fim do documento. A lista tem tres paginas, e
nao duas, porque as solucoes do Portal comecam sempre em pagina propria.

O PDF de teoria tem quatro paginas: capa; uma com a marca d'agua "Portal da
OBMEP" girada pela matriz do TEXTO e, ao lado, a marca MIUDA de 20 pt, com a
escala entrando em dois `cm` que se cancelam (a do Teorema de Tales, 9o ano);
uma com a marca girada pela matriz do DESENHO, mais quatro controles que a
remocao nao pode levar (girado preto e miudo, girado preto e grande, claro e
grande sem giro, claro girado e miudo) e o rodape com a URL; e uma pagina sem
marca nenhuma.

A terceira lista, lista-variantes (modelo CM), traz os padroes que a B2 mediu
nas outras series: solucoes sem o titulo "Respostas e Solucoes", marcador com
recuo de paragrafo e solucoes em duas partes (ver lista_variantes).

Venenos: --sem-item N tira o item N dos enunciados da lista-de-amostra (o
item 2 e o de marcador num span so); --duplica-solucao N rotula a solucao N
com o numero N-1, como o "9." duas vezes de Areas de figuras planas.
"""
import os
import sys

import pymupdf

AQUI = os.path.dirname(os.path.abspath(__file__))
FIXO = {'creationDate': 'D:20260921000000', 'modDate': 'D:20260921000000', 'producer': 'amostra', 'creator': 'amostra'}

MODELOS = {
    'palladio': {'x0': 29.5, 'xsep': 306.0, 'x1': 315.6, 'yrod': 767.0, 'topo': 40.0},
    'cm': {'x0': 29.5, 'xsep': 291.0, 'x1': 301.4, 'yrod': 747.0, 'topo': 66.0},
}


class Pagina:
    def __init__(self, doc, g):
        self.pg = doc.new_page(width=612, height=792)
        self.g = g

    def fios(self, n, separador=True):
        g = self.g
        if separador:
            self.pg.draw_line((g['xsep'], g['topo']), (g['xsep'], g['yrod'] - 18), width=0.4)
        self.pg.draw_line((29, g['yrod']), (582, g['yrod']), width=0.4)
        self.pg.insert_text((29.5, g['yrod'] + 13), 'http://matematica.obmep.org.br/', fontname='cour', fontsize=10)
        self.pg.insert_text((303, g['yrod'] + 13), str(n), fontname='helv', fontsize=10)

    def marcador(self, x, y, n, junto=False):
        """"Exercicio" em negrito e o numero: num span so ou em spans separados."""
        if junto:
            self.pg.insert_text((x, y), 'Exercício %d.' % n, fontname='hebo', fontsize=10)
            return x + 72
        self.pg.insert_text((x, y), 'Exercício', fontname='hebo', fontsize=10)
        # o numero vem com um vao, como no Portal, e por isso sai num span proprio
        self.pg.insert_text((x + 52, y), str(n), fontname='hebo', fontsize=10)
        self.pg.insert_text((x + 52 + 5.6 * len(str(n)), y), '.', fontname='helv', fontsize=10)
        return x + 68

    def texto(self, x, y, linhas, passo=12.0):
        for i, l in enumerate(linhas):
            self.pg.insert_text((x, y + i * passo), l, fontname='helv', fontsize=10)
        return y + len(linhas) * passo

    def secao(self, x, y, n, nome):
        self.pg.insert_text((x, y), str(n), fontname='hebo', fontsize=14.3)
        self.pg.insert_text((x + 25, y), nome, fontname='hebo', fontsize=14.3)

    def numero_solucao(self, x, y, n):
        self.pg.insert_text((x, y), '%d.' % n, fontname='hebo', fontsize=10)


def lista(caminho, modelo='palladio', sem_item=None, duplica=None):
    g = MODELOS[modelo]
    X0, X1 = g['x0'], g['x1']
    T = g['topo']
    doc = pymupdf.open()
    capa = doc.new_page(width=612, height=792)
    capa.insert_text((150, 80), 'Módulo de Amostra Sintética', fontname='hebo', fontsize=14.3)
    capa.insert_text((150, 150), 'Lista de Amostra.' if modelo == 'palladio' else 'Lista no Modelo CM.',
                     fontname='hebo', fontsize=14.3)
    capa.insert_text((258, 225), 'Nono Ano', fontname='hebo', fontsize=14.3)
    # enunciados
    p = Pagina(doc, g)
    p.fios(1)
    p.secao(X0, T + 60, 1, 'Exercícios Introdutórios')
    y = T + 90
    if sem_item != 1:
        xt = p.marcador(X0, y, 1)
        p.pg.insert_text((xt, y), 'Qual é o valor de x na equação', fontname='helv', fontsize=10)
        y = p.texto(X0, y + 12, ['2x + 3 = 13?', '', 'a) 3.', 'b) 5.', 'c) 7.', 'd) 8.', 'e) 10.']) + 14
    if sem_item != 2:
        xt = p.marcador(X0, y, 2, junto=True)
        p.pg.insert_text((xt, y), 'Observe o retângulo abaixo.', fontname='helv', fontsize=10)
        p.pg.draw_rect(pymupdf.Rect(80, y + 10, 200, y + 70), width=1)
        p.pg.insert_text((135, y + 84), '6 cm', fontname='helv', fontsize=9)
        y = p.texto(X0, y + 102, ['a) Calcule o perímetro.', 'b) Calcule a área.']) + 14
    y3 = g['yrod'] - 127
    if sem_item != 3:
        xt = p.marcador(X0, y3, 3)
        p.pg.insert_text((xt, y3), 'Resolva a equação do segundo grau', fontname='helv', fontsize=10)
        p.texto(X0, y3 + 12, ['x² - 5x + 6 = 0 usando a fórmula de'])
        # chamada da nota, em sobrescrito miudo colado em "Bhaskara" (contrato, 8a:
        # a nota vai com o item que a chama, como ultimo pedaco). No Portal o LaTeX
        # parte o texto na chamada, entao aqui tambem: palavra, chamada, resto
        largura = pymupdf.get_text_length('Bhaskara', fontname='helv', fontsize=10)
        p.pg.insert_text((X0, y3 + 24), 'Bhaskara', fontname='helv', fontsize=10)
        p.pg.insert_text((X0 + largura + 0.3, y3 + 20), '1', fontname='helv', fontsize=7)
        p.pg.insert_text((X0 + largura + 5, y3 + 24), 'e responda aos itens.', fontname='helv', fontsize=10)
        p.texto(X0, y3 + 36, ['a) Qual é o discriminante?', 'b) Quais são as raízes?', 'c) Qual é a soma das raízes?',
                              'd) Qual é o produto das raízes?', 'e) Confira as raízes na equação.'])
        # nota de rodape no pe da coluna: fio curto na margem e texto miudo
        p.pg.draw_line((X0, g['yrod'] - 36), (X0 + 100, g['yrod'] - 36), width=0.4)
        # o numero da nota e um span proprio, em sobrescrito, como no Portal
        p.pg.insert_text((X0, g['yrod'] - 30), '1', fontname='helv', fontsize=5)
        p.pg.insert_text((X0 + 6, g['yrod'] - 28), 'Nota de rodape de outro assunto.', fontname='helv', fontsize=7)
        # continua no alto da coluna direita
        p.texto(X1, T + 20, ['f) Escreva a equação na forma fatorada.', 'g) Desenhe as raízes na reta.'])
        p.pg.draw_line((X1 + 10, T + 60), (X1 + 200, T + 60), width=1)
        for i in range(5):
            p.pg.draw_line((X1 + 20 + 40 * i, T + 56), (X1 + 20 + 40 * i, T + 64), width=1)
    # titulo de secao logo abaixo do fim do item 3: nao pode colar nele
    p.secao(X1, T + 88, 2, 'Exercícios de Fixação')
    if sem_item != 4:
        xt = p.marcador(X1, T + 118, 4)
        p.pg.insert_text((xt, T + 118), 'Um terreno tem 12 m de frente e 30 m', fontname='helv', fontsize=10)
        p.texto(X1, T + 130, ['de fundo. Qual é a sua área em metros quadrados?'])
    # solucoes
    p = Pagina(doc, g)
    p.fios(2)
    p.pg.insert_text((114, T + 12), 'Respostas e Soluções.', fontname='hebo', fontsize=10)
    p.secao(X0, T + 40, 1, 'Exercícios Introdutórios')
    rot = {n: (n - 1 if duplica == n else n) for n in range(1, 5)}
    p.numero_solucao(X0, T + 70, rot[1])
    p.texto(X0 + 14, T + 70, ['(Extraído da OBMEP - 2013) Temos 2x = 13 - 3,'])
    p.texto(X0, T + 82, ['logo 2x = 10 e x = 5. Resposta B.'])
    p.numero_solucao(X0, T + 110, rot[2])
    p.texto(X0, T + 124, ['a) O perímetro é 2 · (6 + 4) = 20 cm.', 'b) A área é 6 · 4 = 24 cm².'])
    p.numero_solucao(X0, T + 170, rot[3])
    y = p.texto(X0 + 14, T + 170, ['a) O discriminante é 25 - 24 = 1.'])
    p.texto(X0, y, ['b) As raízes são 2 e 3.', 'c) A soma é 5.', 'd) O produto é 6.',
                    'e) 4 - 10 + 6 = 0 e 9 - 15 + 6 = 0.', 'f) (x - 2)(x - 3) = 0.'])
    p.texto(X1, T + 20, ['g) Os pontos 2 e 3 marcados na reta.'])
    p.secao(X1, T + 70, 2, 'Exercícios de Fixação')
    p.numero_solucao(X1, T + 100, rot[4])
    p.texto(X1 + 14, T + 100, ['A área é 12 · 30 = 360 m².'])
    # bloco de creditos do fim do documento, logo abaixo da ultima solucao
    p.texto(X1 + 30, T + 124, ['Elaborado por Autor da Amostra', 'Produzido por Amostra Sintética'])
    doc.set_metadata(FIXO)
    doc.save(caminho, garbage=3, deflate=True, no_new_id=True)


def lista_variantes(caminho):
    """Lista no modelo CM com os padroes que a B2 mediu fora do 9o ano.

    - soluções SEM o titulo "Respostas e Solucoes": comecam quando a secao
      "1 Exercicios Introdutorios" reaparece (8o ano, Potenciacao);
    - "Exercicio 3." com recuo de paragrafo de 23,5 pt, depois de uma formula
      centrada (6o ano, Exercicios sobre Fracoes, exercicio 7);
    - solucao 2 em duas partes, "2." e "2. (Outra solucao.)" (8o ano,
      Divisibilidade), e solucao 3 em duas, "3." e "3. Solucao 2." (1o medio,
      Inequacoes de 2o grau): cada par e UM item;
    - nenhum fio separador de colunas em pagina nenhuma: a divisa sai da margem
      do texto (8o ano, Produtos Notaveis).
    """
    g = MODELOS['cm']
    X0, X1, T = g['x0'], g['x1'], g['topo']
    doc = pymupdf.open()
    capa = doc.new_page(width=612, height=792)
    capa.insert_text((150, 80), 'Módulo de Amostra Sintética', fontname='hebo', fontsize=14.3)
    capa.insert_text((150, 150), 'Lista de Variantes.', fontname='hebo', fontsize=14.3)
    capa.insert_text((258, 225), 'Nono Ano', fontname='hebo', fontsize=14.3)
    p = Pagina(doc, g)
    p.fios(1, separador=False)
    p.secao(X0, T + 60, 1, 'Exercícios Introdutórios')
    xt = p.marcador(X0, T + 90, 1)
    p.pg.insert_text((xt, T + 90), 'Calcule o valor da soma de', fontname='helv', fontsize=10)
    p.texto(X0, T + 102, ['3 com 4.'])
    xt = p.marcador(X0, T + 120, 2)
    p.pg.insert_text((xt, T + 120), 'Quanto vale a expressão', fontname='helv', fontsize=10)
    p.pg.insert_text((120, T + 140), '10 - 7 + 0 = ?', fontname='helv', fontsize=10)
    # o marcador depois da formula centrada sai com o recuo de paragrafo
    xt = p.marcador(X0 + 23.5, T + 166, 3)
    p.pg.insert_text((xt, T + 166), 'Que fração expressa', fontname='helv', fontsize=10)
    p.texto(X0, T + 178, ['a soma de um meio com um quarto?'])
    # palavra que termina a 0,6 pt da divisa, sem cruzar (6o ano, Exercicios sobre
    # Divisibilidade, exercicio 18): a borda da coluna esquerda tem de acompanhar
    fim = pymupdf.get_text_length('fim', fontname='helv', fontsize=10)
    p.pg.insert_text((X1 - 10.0 - 0.6 - fim, T + 178), 'fim', fontname='helv', fontsize=10)
    p.secao(X1, T + 60, 2, 'Exercícios de Fixação')
    xt = p.marcador(X1, T + 90, 4)
    p.pg.insert_text((xt, T + 90), 'Um quadrado tem 5 cm de lado.', fontname='helv', fontsize=10)
    p.texto(X1, T + 102, ['Qual é a sua área?'])
    # solucoes, sem "Respostas e Solucoes": a secao 1 reaparece
    p = Pagina(doc, g)
    p.fios(2, separador=False)
    p.secao(X0, T + 40, 1, 'Exercícios Introdutórios')
    p.numero_solucao(X0, T + 70, 1)
    p.texto(X0 + 14, T + 70, ['(Adaptado da Amostra - 2020) Temos 3 + 4 = 7.'])
    p.numero_solucao(X0, T + 100, 2)
    p.texto(X0 + 14, T + 100, ['(Extraído da Amostra) Temos 10 - 7 = 3.'])
    p.numero_solucao(X0, T + 130, 2)
    p.texto(X0 + 14, T + 130, ['(Outra solução.) Contando de 7 até 10,'])
    p.texto(X0, T + 142, ['são 3 passos.'])
    p.numero_solucao(X0, T + 172, 3)
    p.texto(X0 + 14, T + 172, ['Um meio mais um quarto dá três quartos.'])
    p.numero_solucao(X0, T + 202, 3)
    p.texto(X0 + 14, T + 202, ['Solução 2. Em quartos: 2 + 1 = 3.'])
    p.secao(X1, T + 40, 2, 'Exercícios de Fixação')
    p.numero_solucao(X1, T + 70, 4)
    p.texto(X1 + 14, T + 70, ['A área é 5 · 5 = 25 cm².'])
    # barra de fracao na margem com o denominador miudo embaixo: nao e nota de
    # rodape, e o que vem depois e do item (1o medio, Inequacoes Mistas, ex. 9)
    p.pg.insert_text((X1 + 20, T + 94), 'x + 1', fontname='helv', fontsize=7)
    p.pg.draw_line((X1, T + 98), (X1 + 60, T + 98), width=0.4)
    p.pg.insert_text((X1 + 20, T + 106), 'x + 2', fontname='helv', fontsize=7)
    p.texto(X1, T + 124, ['Portanto a área do quadrado é 25 cm².'])
    # ponto final que passa da borda da coluna direita (1o e 3o medio)
    p.pg.insert_text((X1, T + 146), 'Conferindo:', fontname='helv', fontsize=10)
    p.pg.insert_text((589.0, T + 146), '.', fontname='helv', fontsize=10)
    # rotulo cinza claro de figura, no fim do item (9o ano, Nocoes Basicas):
    # e no fim que o aperto pela tinta o cortava
    p.pg.insert_text((X1 + 40, T + 170), 'Figura em cinza', fontname='helv', fontsize=10, color=(0.85, 0.85, 0.85))
    doc.set_metadata(FIXO)
    doc.save(caminho, garbage=3, deflate=True, no_new_id=True)


def lista_bordas(caminho):
    """Lista no modelo Palladio com o que passa das bordas de uma linha ou coluna.

    - fracao de fracoes na linha do rotulo do exercicio 2, com o expoente 20 pt
      acima do topo do rotulo (7o ano, Numeros Racionais, exercicio 22): o
      recorte do 2 comeca no alto dela, e o do 1 acaba antes;
    - tabela no exercicio 3 cujos tracos passam 2 pt do fio entre as colunas
      (6o ano, Operacoes com Numeros Naturais, solucao 19): o 3 e o 4, que esta
      na mesma altura da outra coluna, saem pela regra da calha;
    - nota de rodape do exercicio 5 que comeca por uma fracao mais alta que o
      numero da nota (7o ano, Introducao a Porcentagem, nota da solucao 40);
    - traco do exercicio 1 recortado por clip antes do fio: so a caixa cruza;
    - circulo do exercicio 1 que comeca em x 18, antes da margem da coluna.
    """
    g = MODELOS['palladio']
    X0, X1, T, XS = g['x0'], g['x1'], g['topo'], g['xsep']
    doc = pymupdf.open()
    capa = doc.new_page(width=612, height=792)
    capa.insert_text((150, 80), 'Módulo de Amostra Sintética', fontname='hebo', fontsize=14.3)
    capa.insert_text((150, 150), 'Lista de Bordas.', fontname='hebo', fontsize=14.3)
    capa.insert_text((258, 225), 'Nono Ano', fontname='hebo', fontsize=14.3)
    p = Pagina(doc, g)
    p.fios(1)
    p.secao(X0, T + 60, 1, 'Exercícios Introdutórios')
    xt = p.marcador(X0, T + 90, 1)
    p.pg.insert_text((xt, T + 90), 'Quanto é 2 + 2?', fontname='helv', fontsize=10)
    p.texto(X0, T + 102, ['a) 3.', 'b) 4.'])
    # figura que comeca antes da margem da coluna (1o medio, PAs Inteiras, ex. 2)
    p.pg.draw_circle((22.0, T + 122), 4.0, color=(0, 0, 0), fill=(0.2, 0.4, 0.8))
    # traco que a figura recorta por clip: a caixa cruza o fio, a tinta para em
    # 250 pt (8o ano, Angulos, exercicio 14). O 1 fica no pacote
    xref = p.pg.get_contents()[-1]
    yb = 792 - (T + 110)
    doc.update_stream(xref, doc.xref_stream(xref) + (
        b' q 29 %.1f 221 6 re W n 0.4 w 29.5 %.1f m 330 %.1f l S Q ' % (yb - 3, yb, yb) +
        # e outro que comeca em x 5, com o clip na margem: a caixa passa da margem,
        # a tinta nao, e o recorte nao estica ate a caixa (Areas, 9o ano)
        b' q 29 %.1f 221 6 re W n 0.4 w 5 %.1f m 200 %.1f l S Q ' % (yb + 1, yb + 4, yb + 4)))
    y = T + 156
    xt = p.marcador(X0, y, 2)
    p.pg.insert_text((xt, y), 'Simplifique', fontname='helv', fontsize=10)
    p.pg.insert_text((160, y - 7), '(a + 1)', fontname='helv', fontsize=10)
    # expoente em escada, com a tinta continua do parentese ate o alto
    for k, c in enumerate('234'):
        p.pg.insert_text((192 + 4 * k, y - 13 - 5 * k), c, fontname='helv', fontsize=7)
    p.pg.draw_line((158, y - 3.5), (200, y - 3.5), width=0.4)
    p.pg.insert_text((175, y + 7), 'b', fontname='helv', fontsize=10)
    p.pg.insert_text((205, y), 'e dê o resultado.', fontname='helv', fontsize=10)
    y = T + 190
    xt = p.marcador(X0, y, 3)
    p.pg.insert_text((xt, y), 'Complete a tabela.', fontname='helv', fontsize=10)
    for i in range(4):
        p.pg.draw_line((X0, y + 10 + 20 * i), (XS + 2.0, y + 10 + 20 * i), width=0.4)
        p.pg.draw_line((XS + 2.0, y + 10 + 20 * i), (XS + 2.0, y + 30 + 20 * i), width=0.4) if i < 3 else None
        if i < 3:
            p.pg.insert_text((X0 + 10, y + 24 + 20 * i), '%d   %d   %d' % (i, 2 * i, 3 * i), fontname='helv', fontsize=10)
    p.texto(X0, y + 84, ['Qual é a regra?'])
    xt = p.marcador(X1, T + 90, 4)
    p.pg.insert_text((xt, T + 90), 'Quanto é 3 + 3?', fontname='helv', fontsize=10)
    p.texto(X1, T + 102, ['Explique a conta com desenhos e palavras,', 'passo a passo, em cada linha.'] + [
        'Linha %d da explicação.' % k for k in range(1, 11)])
    xt = p.marcador(X1, T + 300, 5)
    p.pg.insert_text((xt, T + 300), 'Conte os pares de objetos', fontname='helv', fontsize=10)
    largura = pymupdf.get_text_length('distintos', fontname='helv', fontsize=10)
    p.pg.insert_text((X1, T + 312), 'distintos', fontname='helv', fontsize=10)
    p.pg.insert_text((X1 + largura + 0.3, T + 308), '1', fontname='helv', fontsize=7)
    p.pg.insert_text((X1 + largura + 5, T + 312), 'de um conjunto.', fontname='helv', fontsize=10)
    yr = g['yrod']
    p.pg.draw_line((X1, yr - 50), (X1 + 100, yr - 50), width=0.4)
    p.pg.insert_text((X1, yr - 32), '1', fontname='helv', fontsize=5)
    p.pg.insert_text((X1 + 6, yr - 30), 'Entre k objetos, existem', fontname='helv', fontsize=7)
    p.pg.insert_text((X1 + 90, yr - 35), 'k(k - 1)', fontname='helv', fontsize=7)
    p.pg.draw_line((X1 + 89, yr - 32.5), (X1 + 116, yr - 32.5), width=0.4)
    p.pg.insert_text((X1 + 100, yr - 25), '2', fontname='helv', fontsize=7)
    p.pg.insert_text((X1 + 120, yr - 30), 'pares.', fontname='helv', fontsize=7)
    p = Pagina(doc, g)
    p.fios(2)
    p.pg.insert_text((114, T + 12), 'Respostas e Soluções.', fontname='hebo', fontsize=10)
    p.secao(X0, T + 40, 1, 'Exercícios Introdutórios')
    for k in range(1, 6):
        p.numero_solucao(X0, T + 40 + 30 * k, k)
        p.texto(X0 + 14, T + 40 + 30 * k, ['A resposta do exercício %d.' % k])
    doc.set_metadata(FIXO)
    doc.save(caminho, garbage=3, deflate=True, no_new_id=True)


def lista_fio_imagem(caminho):
    """Lista no modelo CM com os fios (coluna e rodape) feitos de imagem, e nao de desenho.

    8o ano, Produtos Notaveis: o fio do rodape e uma imagem de 0,6 pt, e o
    exercicio 2, que vai ate perto do pe da coluna, nao pode levar o fio. A ultima
    linha do 1 encosta por cima do rotulo 2 e e do 1; o "=" miudo encostado por
    cima do rotulo 4 e do 4; a barra de segmento sobre "AB" e da linha do rotulo 5, e nao do 4;
    o "c" que rotula a figura do 1 so encosta na linha do rotulo 2, e fica no 1; e o
    credito "Material elaborado por" fecha a ultima solucao.
    """
    g = MODELOS['cm']
    X0, X1, T = g['x0'], g['x1'], g['topo']
    preto = pymupdf.Pixmap(pymupdf.csGRAY, pymupdf.IRect(0, 0, 1, 1), False)
    preto.clear_with(0)
    doc = pymupdf.open()
    capa = doc.new_page(width=612, height=792)
    capa.insert_text((150, 80), 'Módulo de Amostra Sintética', fontname='hebo', fontsize=14.3)
    capa.insert_text((150, 150), 'Lista de Fio em Imagem.', fontname='hebo', fontsize=14.3)
    capa.insert_text((258, 225), 'Nono Ano', fontname='hebo', fontsize=14.3)
    for n in (1, 2):
        p = Pagina(doc, g)
        p.pg.insert_image(pymupdf.Rect(g['xsep'] + 0.2, T, g['xsep'] + 0.8, g['yrod'] - 18), pixmap=preto)
        p.pg.insert_image(pymupdf.Rect(29, g['yrod'] - 0.6, 582, g['yrod']), pixmap=preto)
        p.pg.insert_text((29.5, g['yrod'] + 13), 'http://matematica.obmep.org.br/', fontname='cour', fontsize=10)
        p.pg.insert_text((303, g['yrod'] + 13), str(n), fontname='helv', fontsize=10)
        if n == 1:
            p.secao(X0, T + 60, 1, 'Exercícios Introdutórios')
            xt = p.marcador(X0, T + 90, 1)
            p.pg.insert_text((xt, T + 90), 'Quanto é 5 + 5?', fontname='helv', fontsize=10)
            # a ultima linha do 1 com a caixa 0,1 pt acima da caixa do rotulo 2 (6o
            # ano, Divisibilidade, solucoes 18 e 19): e do 1, e o 2 comeca no rotulo
            p.texto(X0, T + 124 - 13.79, ['Responda com um número.'])
            xt = p.marcador(X0, T + 124, 2)
            p.pg.insert_text((xt, T + 124), 'Some os números de cada linha.', fontname='helv', fontsize=10)
            p.texto(X0, T + 136, ['Linha %d: %d + %d.' % (k, k, 2 * k) for k in range(1, 47)])
            xt = p.marcador(X1, T + 90, 3)
            p.pg.insert_text((xt, T + 90), 'Quanto é 6 + 6?', fontname='helv', fontsize=10)
            p.texto(X1, T + 102, ['Responda com um número.'])
            xt = p.marcador(X1, T + 124, 4)
            p.pg.insert_text((xt, T + 124), 'Some os pares de cada linha.', fontname='helv', fontsize=10)
            # sinal miudo sobre a linha do rotulo 4 com a caixa 0,1 pt acima da caixa
            # do rotulo e a tinta separada dela (a seta sobre "LB", 3o medio, Pontos,
            # Retas e Planos, solucao 12): e do exercicio 4, e nao do 3
            p.pg.insert_text((X1 + 170, T + 124 - 13.17), '=', fontname='helv', fontsize=7.9)
            # rótulo de figura do exercício 1, em corpo normal, que passa 0,8 pt na
            # caixa do rótulo 2 (8o ano, Produtos Notáveis 11 e 12): é do 1, e não do 2
            p.pg.insert_text((250, T + 124 - 12.5), 'c', fontname='helv', fontsize=10)
            p.texto(X1, T + 136, ['e diga o total.'])
            # o 4 acaba 3,6 pt acima da barra do 5: assim a folga dele alcanca a barra
            p.texto(X1, T + 152, ['Escreva a conta por extenso.'])
            xt = p.marcador(X1, T + 170, 5)
            p.pg.insert_text((xt, T + 170), 'Some AB com AB.', fontname='helv', fontsize=10)
            # barra de segmento sobre o primeiro "AB", 1,2 pt acima da caixa do rótulo,
            # com um vão em branco (9o ano, Relações Métricas, solução 10): é da linha
            # do rótulo 5, e não do exercício 4, que acaba logo acima
            largura = pymupdf.get_text_length('AB', fontname='helv', fontsize=10)
            p.pg.draw_line((xt + 30, T + 170 - 11.9), (xt + 30 + largura, T + 170 - 11.9), width=0.4)
            p.texto(X1, T + 182, ['Responda com uma soma.'])
        else:
            p.pg.insert_text((114, T + 12), 'Respostas e Soluções.', fontname='hebo', fontsize=10)
            p.secao(X0, T + 40, 1, 'Exercícios Introdutórios')
            p.numero_solucao(X0, T + 70, 1)
            p.texto(X0 + 14, T + 70, ['A soma é 10.'])
            p.numero_solucao(X0, T + 100, 2)
            p.texto(X0 + 14, T + 100, ['Cada linha dá o triplo do seu número.'])
            p.numero_solucao(X0, T + 130, 3)
            p.texto(X0 + 14, T + 130, ['A soma é 12.'])
            p.numero_solucao(X0, T + 160, 4)
            p.texto(X0 + 14, T + 160, ['Cada par dá o dobro.'])
            p.numero_solucao(X0, T + 190, 5)
            p.texto(X0 + 14, T + 190, ['O dobro de AB.'])
            # crédito do autor no pé da coluna, como no Portal: fecha o último item
            p.pg.insert_text((X0 + 60, g['yrod'] - 24), 'Material elaborado por Autor da Amostra.', fontname='helv', fontsize=9)
    doc.set_metadata(FIXO)
    doc.save(caminho, garbage=3, deflate=True, no_new_id=True)


# A marca d'agua "Portal OBMEP" das paginas de teoria, nos dois formatos
# medidos nas sete series (Biblioteca/b2_insumos/MARCA_DAGUA_achado.md): o giro
# vem da matriz do desenho (`cm`) ou da matriz do texto (`Tm`). Vai no comeco do
# fluxo, antes do conteudo, como no Portal: a marca passa POR BAIXO do texto.
MARCAS = {
    'cm': b'q .70711 .70711 -.70711 .70711 0 0 cm 0.8 g 0.8 G BT /helv 76 Tf 254.6 169.7 Td [(Portal)-350(OBMEP)]TJ ET Q\n',
    # sem q/Q, como o Portal escreve este formato: a cor volta a preto depois
    'tm': b'0.800781 g BT /helv 76 Tf 0.707107 0.707107 -0.707107 0.707107 40 380 Tm [(P)-2(ortal)-350(da)-350(OBMEP)]TJ ET 0 g\n',
    # a marca miuda do Teorema de Tales (9o ano), no corpo exato dela -- 17,4 pt
    # --, com a escala entrando em dois `cm` que se cancelam (0,1 e 10), como o
    # PDF do Portal a escreve. Com o limite antigo de 30 pt ela passava batida, e
    # e ela que prende o limite por cima: 14 pt tem de ficar ABAIXO de 17,4.
    'miuda': b'q 0.1 0 0 0.1 0 0 cm 0.800781 g q 10 0 0 10 0 0 cm BT /helv 17.4 Tf'
             b' 0.707107 0.707107 -0.707107 0.707107 340 96 Tm [(P)22(ortal)-298(OBMEP)]TJ ET Q Q\n',
    # marca a 47 graus: dentro da folga de 4 graus que a regra do giro declara.
    # Prende a folga: sem ela, esta marca sobrevive.
    'torta': b'q 0.8 g BT /helv 44 Tf 0.68200 0.73135 -0.73135 0.68200 60 250 Tm [(Portal)-350(OBMEP)]TJ ET Q\n',
    # marca em cinza 0,76: dentro da faixa declarada (0,75 a 0,85), e nao e
    # nenhum dos dois valores que o Portal usa hoje. Prende a faixa por baixo.
    'clara': b'q 0.76 g BT /helv 52 Tf 0.707107 0.707107 -0.707107 0.707107 250 60 Tm [(Portal)-350(OBMEP)]TJ ET Q\n',
    # marca cuja matriz efetiva so sai 45 graus se a composicao for na ordem
    # certa: o desenho estica 2x em x, e a matriz do texto compensa. Inverter a
    # ordem em _multiplicar da 24 graus, fora da faixa, e a marca fica.
    # marca a 43 graus: do OUTRO lado de 45, para a folga do giro ficar presa
    # dos dois lados (a 'torta' esta a 47)
    'torta43': b'q 0.8 g BT /helv 46 Tf 0.73135 0.68200 -0.68200 0.73135 250 400 Tm [(Portal)-350(OBMEP)]TJ ET Q\n',
    # marca cujo corpo so passa de 14 pt por causa da escala do desenho: 9 pt
    # vezes 2. Se a conta usar o corpo cru, ela nao e vista.
    'escalada': b'q 2 0 0 2 0 0 cm 0.8 g BT /helv 9 Tf 0.707107 0.707107 -0.707107 0.707107 30 30 Tm'
                b' [(Portal)-350(OBMEP)]TJ ET Q\n',
    # marca que so fica clara DEPOIS do BT: se a cor for lida no BT, ela passa
    # por preta e sobrevive
    'tardia': b'q 0 g BT /helv 40 Tf 0.707107 0.707107 -0.707107 0.707107 330 330 Tm 0.8 g [(Portal)-350(OBMEP)]TJ ET Q\n',
    # objeto de texto claro, girado e grande que nao DESENHA nada: nao e marca,
    # e a remocao nao pode conta-lo nem tira-lo
    'vazia': b'q 0.8 g BT /helv 60 Tf 0.707107 0.707107 -0.707107 0.707107 120 120 Tm ET Q\n',
    # imagem embutida (BI ... ID <binario> EI) seguida de marca: se o pulo do
    # binario estiver errado, ou a marca depois dela some do radar, ou os bytes
    # da imagem viram "operadores"
    # A imagem e BINARIA e os bytes dela dizem "BT(", que e comeco de objeto de
    # texto e de string: lidos como codigo, engolem a marca que vem logo depois.
    'imagem': b'q 20 0 0 20 400 600 cm BI /W 4 /H 2 /CS /G /BPC 8 ID BT(\x00\xff Q\n EI Q\n'
              b'q 0.8 g BT /helv 38 Tf 0.707107 0.707107 -0.707107 0.707107 400 420 Tm [(Portal)-350(OBMEP)]TJ ET Q\n',
    # comentario com parentese aberto: se o `%` nao for pulado, o parentese abre
    # uma string que engole o BT da marca seguinte
    'comentada': b'% ( comentario com parentese aberto\n'
                 b'q 0.8 g BT /helv 36 Tf 0.707107 0.707107 -0.707107 0.707107 90 560 Tm [(Portal)-350(OBMEP)]TJ ET Q\n',
    # string com parentese ESCAPADO: se a barra invertida nao for tratada, a
    # string continua alem do fecha-parenteses e engole a marca seguinte
    'escapada': b'q 0 g BT /helv 7 Tf 1 0 0 1 60 700 Tm (parentese escapado: a\\( )Tj ET Q\n'
                b'q 0.8 g BT /helv 34 Tf 0.707107 0.707107 -0.707107 0.707107 470 520 Tm [(Portal)-350(OBMEP)]TJ ET Q\n',
    'ordem': b'q 2 0 0 1 0 0 cm 0.8 g BT /helv 40 Tf 0.353553 0.707107 -0.353553 0.707107 30 470 Tm'
             b' [(Portal)-350(OBMEP)]TJ ET Q\n',
}
# Um controle por condicao da regra, e nenhum pode sair da pagina: girado mas
# preto e miudo (rotulo de figura, o "|sen a|" que a sonda achou em duas
# paginas de exercicios), girado e grande mas preto, claro e grande mas sem
# giro, claro e girado mas miudo.
CONTROLES = (b'0 g BT /helv 8 Tf 0.707107 0.707107 -0.707107 0.707107 400 200 Tm (|sen a| girado em preto)Tj ET\n'
             b'0 g BT /helv 36 Tf 0.707107 0.707107 -0.707107 0.707107 250 120 Tm (Eixo girado)Tj ET\n'
             # claro, girado e de 12 pt: prende o limite de corpo por baixo, que
             # tem de ficar ACIMA de 12 para este nao sair
             b'0.8 g BT /helv 12 Tf 0.707107 0.707107 -0.707107 0.707107 300 150 Tm (rotulo claro girado de 12 pt)Tj ET 0 g\n'
             # claro, grande, mas girado so 30 graus: prende a folga do giro
             b'0.8 g BT /helv 34 Tf 0.866025 0.5 -0.5 0.866025 40 60 Tm (girado 30 graus)Tj ET 0 g\n'
             # girado 55 graus: prende a folga do giro por cima
             b'0.8 g BT /helv 32 Tf 0.573576 0.819152 -0.819152 0.573576 500 80 Tm (girado 55 graus)Tj ET 0 g\n'
             # claro demais (cinza 0,88): prende a faixa de cor por cima
             b'0.88 g BT /helv 33 Tf 0.707107 0.707107 -0.707107 0.707107 430 430 Tm (cinza 0,88)Tj ET 0 g\n'
             # girado e grande, mas cinza 0,70: prende a faixa de cor por baixo
             b'0.70 g BT /helv 30 Tf 0.707107 0.707107 -0.707107 0.707107 120 300 Tm (cinza 0,70)Tj ET 0 g\n'
             b'0.8 g BT /helv 40 Tf 1 0 0 1 60 640 Tm (Titulo claro e reto)Tj ET\n'
             b'0.8 g BT /helv 9 Tf 0.707107 0.707107 -0.707107 0.707107 430 120 Tm (nota clara girada e miuda)Tj ET 0 g\n')


def marca_dagua(pg, formatos, controles=False):
    """Poe a marca d'agua do Portal (e, se pedido, os controles) no fluxo da pagina."""
    doc = pg.parent
    pg.insert_font(fontname='helv')
    xref = pg.get_contents()[0]
    antes = b''.join(MARCAS[f] for f in formatos.split())
    doc.update_stream(xref, antes + (CONTROLES if controles else b'') + doc.xref_stream(xref))


def teoria(caminho):
    doc = pymupdf.open()
    pg = doc.new_page(width=612, height=792)
    pg.insert_text((120, 70), 'Material Teórico - Módulo Amostra Sintética', fontname='hebo', fontsize=14.3)
    pg.insert_text((180, 130), 'Lista de Amostra - Parte I', fontname='hebo', fontsize=14.3)
    pg.insert_text((258, 190), 'Nono Ano', fontname='hebo', fontsize=14.3)
    pg.insert_text((180, 250), 'Autor: Prof. Autor da Amostra', fontname='hebo', fontsize=14.3)
    pg.insert_text((160, 276), 'Revisor: Prof. Revisor da Amostra', fontname='hebo', fontsize=14.3)
    pg.insert_text((210, 330), '7 de Agosto de 2025', fontname='hebo', fontsize=14.3)
    pg = doc.new_page(width=612, height=792)
    for i, l in enumerate(['1 Equações do segundo grau', '',
                           'Uma equação do segundo grau tem a forma ax² + bx + c = 0.',
                           'A fórmula de Bhaskara dá as raízes a partir do discriminante.']):
        pg.insert_text((60, 80 + 12 * i), l, fontname='helv', fontsize=10)
    marca_dagua(pg, 'tm miuda torta torta43 clara ordem escalada tardia vazia imagem comentada escapada')
    # pagina com a marca no outro formato, cruzando o texto, e com os controles
    pg = doc.new_page(width=612, height=792)
    for i, l in enumerate(['2 Discriminante', '',
                           'O discriminante diz quantas raízes reais a equação tem.',
                           'Com discriminante negativo não há raiz real.']):
        pg.insert_text((60, 300 + 12 * i), l, fontname='helv', fontsize=10)
    pg.insert_text((60, 770), 'http://matematica.obmep.org.br/', fontname='cour', fontsize=10)
    marca_dagua(pg, 'cm', controles=True)
    # pagina sem marca nenhuma: a remocao nao pode mexer nela (ha modulos
    # inteiros do Portal sem a marca)
    pg = doc.new_page(width=612, height=792)
    for i, l in enumerate(['3 Soma e produto das raízes', '',
                           'A soma das raízes é menos b sobre a.',
                           'O produto das raízes é c sobre a.',
                           '',
                           # mencao de verdade ao Portal no conteudo, como as 11
                           # que existem nas sete series: a lista curada tem de
                           # aceitar esta e reprovar qualquer outra
                           'Mais exercícios no próprio portal da matemática.']):
        pg.insert_text((60, 300 + 12 * i), l, fontname='helv', fontsize=10)
    doc.set_metadata(FIXO)
    doc.save(caminho, garbage=3, deflate=True, no_new_id=True)


def fazer(pasta, sem_item=None, duplica=None):
    os.makedirs(pasta, exist_ok=True)
    lista(os.path.join(pasta, 'amostra-sintetica__exercicios-lista-de-amostra.pdf'), 'palladio', sem_item, duplica)
    lista(os.path.join(pasta, 'amostra-sintetica__exercicios-lista-cm.pdf'), 'cm')
    lista_variantes(os.path.join(pasta, 'amostra-sintetica__exercicios-lista-variantes.pdf'))
    lista_bordas(os.path.join(pasta, 'amostra-sintetica__exercicios-lista-bordas.pdf'))
    lista_fio_imagem(os.path.join(pasta, 'amostra-sintetica__exercicios-lista-fio-imagem.pdf'))
    teoria(os.path.join(pasta, 'amostra-sintetica__teoria-lista-de-amostra-parte-i.pdf'))


def _opcao(nome):
    if nome in sys.argv:
        return int(sys.argv[sys.argv.index(nome) + 1])
    return None


if __name__ == '__main__':
    fazer(sys.argv[1], _opcao('--sem-item'), _opcao('--duplica-solucao'))
