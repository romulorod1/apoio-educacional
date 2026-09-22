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
