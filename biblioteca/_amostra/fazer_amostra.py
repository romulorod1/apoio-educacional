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
secao "Respostas e Solucoes" em pagina propria; bloco de creditos
("Elaborado por", "Produzido por") no fim do documento. A lista tem tres paginas, e
nao duas, porque as solucoes do Portal comecam sempre em pagina propria.

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

    def fios(self, n):
        g = self.g
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
        p.texto(X0, y3 + 12, ['x² - 5x + 6 = 0 usando a fórmula de', 'Bhaskara e responda aos itens.',
                              'a) Qual é o discriminante?', 'b) Quais são as raízes?', 'c) Qual é a soma das raízes?',
                              'd) Qual é o produto das raízes?', 'e) Confira as raízes na equação.'])
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
    teoria(os.path.join(pasta, 'amostra-sintetica__teoria-lista-de-amostra-parte-i.pdf'))


def _opcao(nome):
    if nome in sys.argv:
        return int(sys.argv[sys.argv.index(nome) + 1])
    return None


if __name__ == '__main__':
    fazer(sys.argv[1], _opcao('--sem-item'), _opcao('--duplica-solucao'))
