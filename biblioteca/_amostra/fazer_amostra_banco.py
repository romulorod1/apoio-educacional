"""Faz um volume sintetico do Banco de Questoes, no modelo de 2016 a 2020.

    python biblioteca/_amostra/fazer_amostra_banco.py <pasta>

Conteudo proprio, escrito aqui, para a prova do Banco rodar no portao sem o
Drive. Imita o que a B2 mediu (Biblioteca/ESPEC_detector_banco.md):

- pagina de 581 x 779 pt, uma coluna, margem alternada (impar em x 99, par
  em x 42), cabecalho corrido em y 39 e rodape em y 732;
- sumario com os titulos das secoes em corpo pequeno, que nao podem abrir secao;
- "NIVEL 1" e "ENUNCIADOS E SOLUCOES DO NIVEL 1" em 15,8 pt; um Nivel 2 curto,
  que o pacote do nivel 1 nao pode levar;
- cabecalho "N Titulo" em negrito de 13,2 pt, com o numero numa caixa cinza cuja
  borda sobe 2 pt acima do texto;
- problema 2 com o titulo quebrado em duas linhas, a segunda 15 pt abaixo;
- problema 3 atravessando a pagina;
- na secao de solucoes: "1 ... - Solucao" com erro de digitacao no titulo,
  "2 ... - So-" / "lucao" hifenizado, e o 3 com o sufixo esquecido (a segunda
  ocorrencia e a solucao).
"""
import os
import sys

import pymupdf

FIXO = {'creationDate': 'D:20260922000000', 'modDate': 'D:20260922000000', 'producer': 'amostra', 'creator': 'amostra'}
W, H = 581.1, 779.5


class Folha:
    def __init__(self, doc, n):
        self.pg = doc.new_page(width=W, height=H)
        self.n = n
        self.x = 99.0 if n % 2 else 42.0
        self.pg.insert_text((self.x, 48), 'OBMEP - Banco de Questões 2099', fontname='hebo', fontsize=11)
        self.pg.draw_line((self.x, 52), (self.x + 440, 52), width=0.5)
        self.pg.insert_text((self.x, 742), 'www.obmep.org.br', fontname='cour', fontsize=12)

    def secao(self, y, texto):
        self.pg.insert_text((self.x + 120, y), texto, fontname='helv', fontsize=15.8)

    def cab(self, y, texto, numero=None):
        """Cabecalho em negrito de 13,2 pt; com numero, a caixa cinza atras dele."""
        if numero is not None:
            # a caixa sobe uns 2 pt acima da caixa do texto, como na fonte (2017, p. 13)
            r = pymupdf.Rect(self.x, y - 16.2, self.x + 14, y + 3)
            self.pg.draw_rect(r, color=(0, 0, 0), fill=(0.85, 0.85, 0.85), width=0.4)
        self.pg.insert_text((self.x + 3, y), texto, fontname='hebo', fontsize=13.2)

    def texto(self, y, linhas):
        for i, l in enumerate(linhas):
            self.pg.insert_text((self.x, y + 14.5 * i), l, fontname='helv', fontsize=11)
        return y + 14.5 * len(linhas)


def fazer(pasta, nome='banco-de-questoes-2099.pdf'):
    os.makedirs(pasta, exist_ok=True)
    doc = pymupdf.open()
    # sumario
    f = Folha(doc, 1)
    f.pg.insert_text((f.x, 120), 'Nível 1 ....... 3', fontname='helv', fontsize=11)
    f.pg.insert_text((f.x, 140), 'Enunciados e Soluções do Nível 1 ....... 5', fontname='helv', fontsize=11)
    # enunciados do nivel 1
    f = Folha(doc, 2)
    f.secao(120, 'NÍVEL 1')
    f.cab(200, '1 O cachorro e o gato', 1)
    f.texto(230, ['Um cachorro avista um gato a 30 m e corre atrás dele. Cada passo do',
                  'cachorro mede 50 cm e cada passo do gato mede 30 cm. Depois de quantos',
                  'passos o cachorro alcança o gato?'])
    f.cab(330, '2 Quadrados perfeitos que possuem um número quadrado perfeito de', 2)
    f.cab(345, 'divisores')
    f.texto(375, ['Quais números menores que 100 são quadrados perfeitos e têm uma',
                  'quantidade de divisores que também é um quadrado perfeito?'])
    f.cab(470, '3 Caixas e mentiras', 3)
    f.texto(500, ['Há 100 caixas em fila, e uma delas guarda um diamante. Cada caixa diz',
                  'que o diamante está na caixa da esquerda ou na da direita. Exatamente',
                  'uma mensagem é verdadeira.'])
    f.pg.draw_rect(pymupdf.Rect(f.x + 60, 560, f.x + 360, 700), width=1)
    f = Folha(doc, 3)
    f.texto(90, ['a) Quantas caixas é preciso abrir para achar o diamante?',
                 'b) E se fossem 101 caixas?'])
    # nivel 2 (nao entra no pacote do nivel 1)
    f.secao(200, 'NÍVEL 2')
    f.cab(280, '1 Um problema do nível dois', 1)
    f.texto(310, ['Este problema é do nível 2 e não pode aparecer no pacote do nível 1.'])
    # enunciados e solucoes do nivel 1
    f = Folha(doc, 4)
    f.secao(120, 'ENUNCIADOS E SOLUÇÕES DO NÍVEL 1')
    f.cab(190, '1 O cachorro e o gato', 1)
    f.texto(220, ['Um cachorro avista um gato a 30 m e corre atrás dele.'])
    f.cab(270, '1 O cachorro e a gato - Solução', 1)
    f.texto(300, ['A cada passo a distância cai 20 cm. Como 30 m são 3000 cm, são',
                  '3000 / 20 = 150 passos.'])
    f.cab(380, '2 Quadrados perfeitos que possuem um número quadrado perfeito de', 2)
    f.cab(395, 'divisores')
    f.texto(425, ['Quais números menores que 100 são quadrados perfeitos?'])
    f.cab(480, '2 Quadrados perfeitos que possuem um número quadrado perfeito de divisores - So-', 2)
    f.cab(495, 'lução')
    f.texto(525, ['São 1, 16, 36, 64 e 81, pois cada um tem 1, 5, 9, 7 e 5 divisores:',
                  'basta conferir quais dessas contagens são quadrados.'])
    f = Folha(doc, 5)
    f.cab(100, '3 Caixas e mentiras', 3)
    f.texto(130, ['Há 100 caixas em fila, e uma delas guarda um diamante.'])
    # a fonte esqueceu o " - Solucao": a segunda ocorrencia do 3 e a solucao
    f.cab(200, '3 Caixas e mentiras', 3)
    f.texto(230, ['a) Basta abrir uma caixa da ponta: se o diamante estivesse no meio,',
                  'duas mensagens seriam verdadeiras.', 'b) A mesma conta vale para 101.'])
    # o livro fecha com o indice remissivo (2018 a 2020): nao e da ultima solucao
    f = Folha(doc, 6)
    f.secao(120, 'ÍNDICE REMISSIVO')
    f.texto(200, ['Caixas e mentiras, 3', 'Cachorro e o gato, 1', 'Quadrados perfeitos, 2'])
    doc.set_metadata(FIXO)
    caminho = os.path.join(pasta, nome)
    doc.save(caminho, garbage=3, deflate=True, no_new_id=True)
    return caminho


if __name__ == '__main__':
    print(fazer(sys.argv[1]))
