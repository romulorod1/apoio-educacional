# figuras/_audita_marcas.py
#
# Auditor independente das marcas de geometria. Nao chama o marcas.js, nao chama
# o base.js e nao reaproveita nenhuma conta deles: le o FLUXO DE CONTEUDO do PDF
# ja escrito, reconstroi arco, tracinho, seta, halo e rotulo a partir dos
# operadores, e mede na folha.
#
# A razao de existir separado: um conserto conferido pela mesma conta que o
# produziu nao foi conferido. Aqui o arco nasce de um ajuste de circunferencia
# por minimos quadrados sobre os pontos amostrados das curvas de Bezier, e nao
# do raio que o desenhador pediu; a folga entre dois tracinhos nasce da distancia
# entre os centros medidos, e nao da constante FOLGA_TRACO; a bissetriz nasce dos
# dois extremos do arco desenhado, e nao do atan2 do desenhador.
#
# Uso:
#   python _audita_marcas.py arquivo.pdf [arquivo2.pdf ...]
#   python _audita_marcas.py --paginas 3,6 arquivo.pdf
#
# Sai com codigo 1 quando acha defeito, 0 quando fica quieto.
#
# Regra da casa: nunca usar travessao.

import sys, math, re

try:
    import pymupdf
except ImportError:
    import fitz as pymupdf


# ------------------------------------------------------------------ os pisos
#
# Os numeros vem da medicao da folha, e cada um traz ao lado o defeito que o
# motivou. Estao repetidos aqui de proposito: se um dia alguem afrouxar o piso
# dentro do marcas.js, o auditor continua cobrando o numero antigo e a mudanca
# aparece em vez de passar calada.
PISO_TRACINHO = 3.4      # tres tracos de 0.9 pt com vao de 1.6 pt fundem na 2a fotocopia
PISO_SETA = 7.0          # duas cabecas a 3.53 pt com 4.87 pt de profundidade viram borrao
PISO_ENTRE_ARCOS = 6.0   # 115 externo e 65 interno a 2.5 pt emendam num semicirculo
PISO_ENTRE_VOLTAS = 3.0  # arcos concentricos do MESMO angulo sao um grupo, nao dois
ALCANCE_DO_ARCO = 12.0   # mais meia largura do proprio rotulo
DESVIO_BISSETRIZ = 25.0  # graus entre o rotulo e o meio do arco a que ele pertence
PISO_ENTRE_ROTULOS = 0.0 # so acusa sobreposicao de verdade
# O olho agrupa por PROXIMIDADE antes de agrupar por significado: um valor de
# angulo mais perto do rotulo de outra coisa do que do proprio arco passa a ser
# lido como se pertencesse aquele outro rotulo. Medido no exercicio 17 do piloto:
# o "70°" saiu a 7.77 pt do "I" do encontro das bissetrizes e a 15.04 pt do arco
# que ele mede, e a aluna responde 70 no lugar de 125. O piso e o CORPO do
# proprio rotulo, porque duas caixas a menos de uma altura de linha uma da outra
# leem como um bloco so.
FATOR_BLOCO = 1.0        # multiplica o corpo do rotulo para virar piso de vao


# ------------------------------------------------------------------ tokenizador

def tokenizar(dados):
    """Quebra o fluxo em tokens, preservando ( ... ) como um token unico."""
    saida = []
    i, n = 0, len(dados)
    while i < n:
        c = dados[i]
        if c in b' \t\r\n':
            i += 1
            continue
        if c == 0x28:  # (
            j, prof, buf = i + 1, 1, bytearray()
            while j < n and prof:
                d = dados[j]
                if d == 0x5c:  # barra invertida
                    buf.append(dados[j + 1] if j + 1 < n else 0x20)
                    j += 2
                    continue
                if d == 0x28:
                    prof += 1
                elif d == 0x29:
                    prof -= 1
                    if not prof:
                        break
                buf.append(d)
                j += 1
            saida.append(('str', bytes(buf)))
            i = j + 1
            continue
        if c == 0x5b:  # [
            j = dados.find(b']', i)
            saida.append(('op', dados[i:j + 1].decode('latin-1')))
            i = j + 1
            continue
        j = i
        while j < n and dados[j] not in b' \t\r\n[]()':
            j += 1
        tk = dados[i:j].decode('latin-1')
        try:
            saida.append(('num', float(tk)))
        except ValueError:
            saida.append(('op', tk))
        i = j if j > i else i + 1
    return saida


def amostrar_bezier(p0, p1, p2, p3, n=12):
    pts = []
    for k in range(1, n + 1):
        t = k / n
        u = 1 - t
        x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0]
        y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
        pts.append((x, y))
    return pts


class Figura(object):
    """O que uma pagina desenhou, ja separado por especie."""

    def __init__(self, pagina):
        self.pagina = pagina
        self.tracos = []    # {p: [(x,y)...], w, cor, tracejado, curvo}
        self.halos = []     # {x0,y0,x1,y1}
        self.cheios = []    # poligonos preenchidos que nao sao retangulo branco
        self.textos = []    # {txt, x, y, tam, cor, caixa}


def ler_pagina(pag, numero):
    dados = pag.read_contents()
    tokens = tokenizar(dados)
    fig = Figura(numero)

    pilha = []
    est = {'w': 1.0, 'RG': (0.0, 0.0, 0.0), 'rg': (0.0, 0.0, 0.0), 'd': '[] 0'}
    num = []
    sub = []          # subcaminhos: cada um {'pts': [...], 'curvo': bool}
    atual = None
    txt = None
    dash_pend = None

    def fechar_sub():
        if atual and len(atual['pts']) >= 2:
            sub.append(atual)

    for tipo, v in tokens:
        if tipo == 'num':
            num.append(v)
            continue
        if tipo == 'str':
            if txt is not None:
                txt['bytes'] = v
            continue

        o = v
        if o == 'q':
            pilha.append(dict(est))
        elif o == 'Q':
            if pilha:
                est = pilha.pop()
        elif o == 'w' and num:
            est['w'] = num[-1]
        elif o == 'd':
            est['d'] = (dash_pend or '[]') + ' ' + (str(num[-1]) if num else '0')
        elif o == 'RG' and len(num) >= 3:
            est['RG'] = tuple(num[-3:])
        elif o == 'rg' and len(num) >= 3:
            est['rg'] = tuple(num[-3:])
        elif o == 'm' and len(num) >= 2:
            fechar_sub()
            atual = {'pts': [(num[-2], num[-1])], 'curvo': False}
        elif o == 'l' and len(num) >= 2:
            if atual:
                atual['pts'].append((num[-2], num[-1]))
        elif o == 'c' and len(num) >= 6:
            if atual:
                p0 = atual['pts'][-1]
                atual['pts'].extend(amostrar_bezier(
                    p0, (num[-6], num[-5]), (num[-4], num[-3]), (num[-2], num[-1])))
                atual['curvo'] = True
        elif o == 're' and len(num) >= 4:
            x, y, w, h = num[-4:]
            fechar_sub()
            atual = {'pts': [(x, y), (x + w, y), (x + w, y + h), (x, y + h), (x, y)],
                     'curvo': False, 'ret': (x, y, x + w, y + h)}
        elif o == 'h':
            if atual and len(atual['pts']) >= 2:
                atual['pts'].append(atual['pts'][0])
        elif o in ('S', 's'):
            fechar_sub()
            for s in sub:
                fig.tracos.append({'p': s['pts'], 'w': est['w'], 'cor': est['RG'],
                                   'tracejado': est['d'], 'curvo': s['curvo']})
            sub, atual = [], None
        elif o in ('f', 'F', 'f*', 'B', 'B*', 'b'):
            fechar_sub()
            branco = all(c > 0.98 for c in est['rg'])
            for s in sub:
                if 'ret' in s and branco:
                    fig.halos.append({'x0': s['ret'][0], 'y0': s['ret'][1],
                                      'x1': s['ret'][2], 'y1': s['ret'][3]})
                elif not branco:
                    fig.cheios.append({'p': s['pts'], 'cor': est['rg']})
            sub, atual = [], None
        elif o == 'n':
            sub, atual = [], None
        elif o == 'BT':
            txt = {'tam': 10.0, 'x': 0.0, 'y': 0.0, 'cor': est['rg'], 'bytes': b''}
        elif o == 'Tf' and num:
            if txt is not None:
                txt['tam'] = num[-1]
        elif o == 'Td' and len(num) >= 2:
            if txt is not None:
                txt['x'], txt['y'] = num[-2], num[-1]
        elif o == 'Tj':
            if txt is not None:
                txt['cor'] = est['rg']
        elif o == 'ET':
            if txt is not None and txt['bytes']:
                fig.textos.append({
                    'txt': txt['bytes'].decode('latin-1'),
                    'x': txt['x'], 'y': txt['y'], 'tam': txt['tam'], 'cor': txt['cor']})
            txt = None

        if o == 'd':
            dash_pend = None
        if tipo == 'op' and o.startswith('['):
            dash_pend = o
        else:
            num = []
    return fig


# ------------------------------------------------------- reconstrucao geometrica

def ajustar_circulo(pts):
    """Kasa: resolve o sistema linear do circulo. Devolve (cx, cy, r, residuo)."""
    n = len(pts)
    if n < 4:
        return None
    sx = sy = sxx = syy = sxy = sz = sxz = syz = 0.0
    for x, y in pts:
        z = x * x + y * y
        sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y
        sz += z; sxz += x * z; syz += y * z
    a = [[sxx, sxy, sx], [sxy, syy, sy], [sx, sy, float(n)]]
    b = [sxz, syz, sz]
    # eliminacao de Gauss em 3 por 3
    m = [a[i] + [b[i]] for i in range(3)]
    for i in range(3):
        p = max(range(i, 3), key=lambda k: abs(m[k][i]))
        if abs(m[p][i]) < 1e-12:
            return None
        m[i], m[p] = m[p], m[i]
        for k in range(i + 1, 3):
            f = m[k][i] / m[i][i]
            for j in range(i, 4):
                m[k][j] -= f * m[i][j]
    sol = [0.0, 0.0, 0.0]
    for i in (2, 1, 0):
        s = m[i][3] - sum(m[i][j] * sol[j] for j in range(i + 1, 3))
        sol[i] = s / m[i][i]
    cx, cy = sol[0] / 2.0, sol[1] / 2.0
    r2 = sol[2] + cx * cx + cy * cy
    if r2 <= 0:
        return None
    r = math.sqrt(r2)
    res = max(abs(math.hypot(x - cx, y - cy) - r) for x, y in pts)
    return (cx, cy, r, res)


def graus(a):
    return (math.degrees(a) + 360.0) % 360.0


def arcos_de(fig):
    """Todo traco curvo que fecha num circulo e um arco de angulo."""
    saida = []
    for t in fig.tracos:
        if not t['curvo'] or len(t['p']) < 5:
            continue
        aj = ajustar_circulo(t['p'])
        if not aj:
            continue
        cx, cy, r, res = aj
        if res > 0.35 or r < 4 or r > 45:
            continue
        # A abertura vem da soma dos passos ANGULARES entre pontos consecutivos,
        # cada um trazido para o intervalo de menos 180 a mais 180. Somar assim
        # segue a curva como ela foi desenhada, sem depender do sentido nem de
        # onde caiu o corte do atan2: com o angulo do primeiro e do ultimo ponto
        # so, um arco de 115 graus percorrido no sentido horario aparece como
        # 245, e o vertice do angulo externo passava por reto.
        a0 = graus(math.atan2(t['p'][0][1] - cy, t['p'][0][0] - cx))
        a1 = graus(math.atan2(t['p'][-1][1] - cy, t['p'][-1][0] - cx))
        soma = 0.0
        ant = a0
        for q in t['p'][1:]:
            ang = graus(math.atan2(q[1] - cy, q[0] - cx))
            passo = (ang - ant + 180.0) % 360.0 - 180.0
            soma += passo
            ant = ang
        meio = (a0 + soma / 2.0) % 360.0    # a0 e soma ja estao em graus
        if abs(soma) > 350.0:
            continue    # circunferencia inteira nao e arco de angulo
        saida.append({'cx': cx, 'cy': cy, 'r': r, 'de': a0, 'ate': a1,
                      'meio': meio, 'abertura': abs(soma), 'w': t['w'],
                      'cor': t['cor'], 'pts': t['p']})
    return saida


def dist_ao_arco(arco, p):
    return min(math.hypot(p[0] - q[0], p[1] - q[1]) for q in arco['pts'])


def caixa_do_texto(fig, tx):
    """O halo branco que o escritor emite logo antes do texto e a caixa exata."""
    melhor, area = None, 1e9
    for h in fig.halos:
        if h['x0'] - 0.5 <= tx['x'] <= h['x1'] + 0.5 and \
           h['y0'] - 0.5 <= tx['y'] <= h['y1'] + tx['tam']:
            a = (h['x1'] - h['x0']) * (h['y1'] - h['y0'])
            if a < area:
                melhor, area = h, a
    if melhor:
        return melhor
    larg = 0.55 * tx['tam'] * len(tx['txt'])
    return {'x0': tx['x'], 'y0': tx['y'], 'x1': tx['x'] + larg, 'y1': tx['y'] + tx['tam']}


def vao_entre_caixas(a, b):
    """Vao de papel branco entre dois retangulos, zero quando eles se tocam ou se
    sobrepoem. Distancia entre CENTROS nao serve aqui: no exercicio 17 os centros
    do "70°" e do "I" ficaram a 14.1 pt e o vao a 7.8 pt, e o que o olho agrupa e
    o vao."""
    gx = max(0.0, max(a['x0'], b['x0']) - min(a['x1'], b['x1']))
    gy = max(0.0, max(a['y0'], b['y0']) - min(a['y1'], b['y1']))
    return math.hypot(gx, gy)


def luminancia(c):
    def canal(v):
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * canal(c[0]) + 0.7152 * canal(c[1]) + 0.0722 * canal(c[2])


def contraste(cor):
    """Contraste da WCAG contra o branco. Serve para separar o traco que carrega
    significado da marca d'agua, que atravessa a folha inteira e nao pertence a
    figura nenhuma."""
    return 1.05 / (luminancia(cor) + 0.05)


RE_GRAU = re.compile(r'\d')
RE_LINEAR = re.compile(r'^[-+]?[\d.]*[a-z](?:[-+][\d.]+)?$|^[-+]?[\d.]+[-+][\d.]*[a-z]$')


def eh_valor_de_angulo(s):
    """Valor de angulo e o que traz o simbolo de grau, uma expressao com numero
    (3x+10, 2x) ou a letra x sozinha.

    A letra solta que NAO e x fica de fora, e a razao e medida e nao estetica:
    no fluxo, "h" ao lado de uma altura e "m" ao lado de uma mediana sao NOMES de
    segmento e nunca aparecem com arco, entao a trava do valor sem arco os acusava
    em toda figura com ceviana e virava ruido. O x e a incognita de angulo por
    convencao deste material, e segmento aqui se chama a, b, c, h ou m. Este e o
    unico ponto em que o auditor e mais estreito do que o conferirFigura, e a
    diferenca esta anotada no relatorio: la o "h" tambem e acusado."""
    t = s.replace(' ', '')
    if '\xb0' in t and RE_GRAU.search(t):
        return True
    # Medida de LADO com unidade nao e valor de angulo: "10 m", "8 cm". Sem esta
    # linha, "10m" casa com a forma "numero seguido de letra" e a trava do valor
    # sem arco acusa toda cota da folha.
    if re.match(r'^[\d.]+(m|cm|mm|km|dm)$', t):
        return False
    if not RE_LINEAR.match(t):
        return False
    return t == 'x' or bool(RE_GRAU.search(t))


def cruza_segmento(p, q, r, s):
    """Cruzamento proprio de dois segmentos, com tolerancia para nao contar
    encosto de ponta. Escrito aqui, com a parametrizacao direta, e nao importado
    de lugar nenhum."""
    rx, ry = q[0] - p[0], q[1] - p[1]
    sx, sy = s[0] - r[0], s[1] - r[1]
    den = rx * sy - ry * sx
    if abs(den) < 1e-9:
        return False
    t = ((r[0] - p[0]) * sy - (r[1] - p[1]) * sx) / den
    u = ((r[0] - p[0]) * ry - (r[1] - p[1]) * rx) / den
    return 1e-4 < t < 1 - 1e-4 and 1e-4 < u < 1 - 1e-4


def atravessa(fig, centro_do_arco, centro_do_rotulo, raio):
    """Existe traco entre o arco e o numero? Comeca na borda do arco, e nao no
    vertice: os lados do angulo NASCEM no vertice e um encontro ali nao e
    travessia. Devolve a espessura do traco encontrado, ou zero."""
    dx = centro_do_rotulo[0] - centro_do_arco[0]
    dy = centro_do_rotulo[1] - centro_do_arco[1]
    n = math.hypot(dx, dy)
    if n < raio + 0.5:
        return 0.0
    p = (centro_do_arco[0] + dx / n * raio, centro_do_arco[1] + dy / n * raio)
    for t in fig.tracos:
        if t['w'] < 0.55 or contraste(t['cor']) < 2.0 or t['curvo']:
            continue
        for i in range(len(t['p']) - 1):
            if cruza_segmento(p, centro_do_rotulo, t['p'][i], t['p'][i + 1]):
                return t['w']
    return 0.0


def fio_de_chamada(fig, arco, centro_do_rotulo):
    """O risco fino que liga a ponta do arco ao valor que saiu da cunha. Devolve
    o segmento, ou None. Reconhecido pela FORMA no fluxo: dois pontos, espessura
    de linha auxiliar, uma ponta encostada no arco e a outra apontando para o
    numero."""
    pontas = [arco['pts'][0], arco['pts'][-1]]
    for t in fig.tracos:
        if t['curvo'] or len(t['p']) != 2 or t['w'] > 0.7:
            continue
        for a, b in ((t['p'][0], t['p'][1]), (t['p'][1], t['p'][0])):
            if min(math.hypot(a[0] - q[0], a[1] - q[1]) for q in pontas) > 2.0:
                continue
            if math.hypot(b[0] - centro_do_rotulo[0], b[1] - centro_do_rotulo[1]) < \
               math.hypot(a[0] - centro_do_rotulo[0], a[1] - centro_do_rotulo[1]):
                return (a, b)
    return None


def seg_cruza_caixa(p, q, cx):
    """Liang e Barsky, escrito aqui e nao importado: o auditor nao pode depender
    da mesma funcao que o desenhador usa para decidir a mesma coisa."""
    t0, t1 = 0.0, 1.0
    dx, dy = q[0] - p[0], q[1] - p[1]
    pp = [-dx, dx, -dy, dy]
    qq = [p[0] - cx['x0'], cx['x1'] - p[0], p[1] - cx['y0'], cx['y1'] - p[1]]
    for i in range(4):
        if abs(pp[i]) < 1e-12:
            if qq[i] < 0:
                return False
            continue
        r = qq[i] / pp[i]
        if pp[i] < 0:
            if r > t1:
                return False
            t0 = max(t0, r)
        else:
            if r < t0:
                return False
            t1 = min(t1, r)
    return t1 >= t0


# ------------------------------------------------------------------ as travas

def auditar(fig):
    falhas = []
    arcos = arcos_de(fig)

    # (1) todo valor de angulo tem que ter arco, e o arco tem que ser o DELE
    for tx in fig.textos:
        if not eh_valor_de_angulo(tx['txt']):
            continue
        cx = caixa_do_texto(fig, tx)
        centro = ((cx['x0'] + cx['x1']) / 2.0, (cx['y0'] + cx['y1']) / 2.0)
        larg = cx['x1'] - cx['x0']
        perto, melhor = 1e9, None
        for a in arcos:
            d = dist_ao_arco(a, centro)
            if d < perto:
                perto, melhor = d, a
        alcance = ALCANCE_DO_ARCO + larg / 2.0
        if not melhor or perto > alcance:
            falhas.append('p%d valor "%s" em (%.1f, %.1f) sem arco: o mais proximo esta a %s pt '
                          '(alcance %.1f)' % (fig.pagina, tx['txt'], tx['x'], tx['y'],
                                              ('%.2f' % perto) if melhor else 'infinito', alcance))
            continue
        # (1b) o valor GRUDADO no rotulo de outra coisa
        #
        # Nao basta o valor estar perto do arco dele: ele tem que estar mais perto
        # do arco DELE do que de qualquer outro rotulo da figura, e a pelo menos
        # uma altura de linha desse outro rotulo. Esta trava roda ANTES do desvio
        # de bissetriz e ANTES do desvio do fio de chamada de proposito: o valor
        # empurrado por qualquer um dos dois caminhos continua tendo que responder
        # por ela.
        perto_de, d_outro = None, 1e9
        for outro in fig.textos:
            if outro is tx:
                continue
            co = caixa_do_texto(fig, outro)
            if co is cx:
                continue
            if (co['x1'] - co['x0']) > 60 or (co['y1'] - co['y0']) > 20:
                continue   # o retangulo de fundo do bloco nao e rotulo
            d = vao_entre_caixas(cx, co)
            if d < d_outro:
                d_outro, perto_de = d, outro
        piso_bloco = FATOR_BLOCO * tx['tam']
        if perto_de is not None and d_outro < piso_bloco and d_outro < perto:
            falhas.append('p%d valor "%s" a %.2f pt do rotulo "%s" e a %.2f pt do arco que ele '
                          'mede (piso de bloco %.2f pt): o olho agrupa os dois num bloco so e o '
                          'valor passa a ler como se fosse daquele outro rotulo'
                          % (fig.pagina, tx['txt'], d_outro, perto_de['txt'], perto, piso_bloco))

        # Um valor que saiu da cunha com FIO DE CHAMADA e caso previsto: ele nao
        # esta na bissetriz de proposito. O que nao se admite e o fio cruzando o
        # contorno, porque ai a figura ganha um quarto risco que nao e lado, nem
        # altura, nem bissetriz, e na fotocopia ele some deixando o numero colado
        # no angulo errado.
        fio = fio_de_chamada(fig, melhor, centro)
        if fio is not None:
            # O fio NASCE na ponta do arco, e a ponta do arco fica em cima de um
            # dos dois lados do angulo: o encosto na origem e por construcao e nao
            # e travessia. O teste comeca a um quinto do fio para nao confundir os
            # dois, do mesmo jeito que o caminho do rotulo comeca fora do vertice.
            de = (fio[0][0] + (fio[1][0] - fio[0][0]) * 0.2,
                  fio[0][1] + (fio[1][1] - fio[0][1]) * 0.2)
            for t in fig.tracos:
                if t['w'] < 0.9 or contraste(t['cor']) < 2.0 or t['curvo']:
                    continue
                achou = False
                for i in range(len(t['p']) - 1):
                    if cruza_segmento(de, fio[1], t['p'][i], t['p'][i + 1]):
                        achou = True
                        break
                if achou:
                    falhas.append('p%d o fio de chamada do valor "%s" cruza um traco de %.2f w: '
                                  'a figura ganha um risco que nao e lado nem construcao'
                                  % (fig.pagina, tx['txt'], t['w']))
                    break
            continue

        # o rotulo tem que estar na bissetriz DO ARCO, e nao em qualquer lugar
        dirL = graus(math.atan2(centro[1] - melhor['cy'], centro[0] - melhor['cx']))
        desvio = abs(((dirL - melhor['meio']) + 180.0) % 360.0 - 180.0)
        if desvio > DESVIO_BISSETRIZ:
            falhas.append('p%d valor "%s" sai a %.1f graus da bissetriz do arco dele '
                          '(arco de %.1f graus no vertice %.1f %.1f): o numero pousa fora da '
                          'cunha e passa a apontar outro angulo'
                          % (fig.pagina, tx['txt'], desvio, melhor['abertura'],
                             melhor['cx'], melhor['cy']))
        # ir do vertice ate o numero nao pode exigir atravessar um traco. Quando
        # exige, o numero mora na outra regiao da figura: e o 30 graus que foi
        # parar acima da hipotenusa, com o vertice de um lado e o valor do outro.
        cruzou = atravessa(fig, (melhor['cx'], melhor['cy']), centro, melhor['r'])
        if cruzou:
            falhas.append('p%d valor "%s" esta separado do vertice dele por um traco de %.2f w: '
                          'para ligar o numero ao arco o olho tem que atravessar a figura, '
                          'entao o numero esta na regiao errada'
                          % (fig.pagina, tx['txt'], cruzou))

    # (2) o halo do rotulo nao pode comer traco de MARCA nem de CONTORNO
    #
    # O piso e 0,85 e nao 0,6 de proposito: a linha de cota, que sai no peso
    # auxiliar, e interrompida pelo proprio valor por convencao de desenho
    # tecnico, e ali o branco no meio da linha e o certo. O que nunca pode e o
    # halo comer contorno (1,20) ou marca (0,90), que sao o que a figura afirma.
    for h in fig.halos:
        larg, alt = h['x1'] - h['x0'], h['y1'] - h['y0']
        if larg > 60 or alt > 20:   # o retangulo de fundo da figura inteira
            continue
        for t in fig.tracos:
            if t['w'] < 0.85 or contraste(t['cor']) < 2.0:
                continue
            for i in range(len(t['p']) - 1):
                p, q = t['p'][i], t['p'][i + 1]
                if math.hypot(q[0] - p[0], q[1] - p[1]) < 0.05:
                    continue
                if seg_cruza_caixa(p, q, h):
                    falhas.append('p%d o halo em (%.1f %.1f %.1f %.1f) cobre um traco de %.2f w: '
                                  'o branco abre um buraco no contorno'
                                  % (fig.pagina, h['x0'], h['y0'], larg, alt, t['w']))
                    break
            else:
                continue
            break

    # (3) dois rotulos sobrepostos
    for i in range(len(fig.halos)):
        for j in range(i + 1, len(fig.halos)):
            a, b = fig.halos[i], fig.halos[j]
            if (a['x1'] - a['x0']) > 60 or (b['x1'] - b['x0']) > 60:
                continue
            sx = min(a['x1'], b['x1']) - max(a['x0'], b['x0'])
            sy = min(a['y1'], b['y1']) - max(a['y0'], b['y0'])
            if sx > PISO_ENTRE_ROTULOS and sy > PISO_ENTRE_ROTULOS:
                falhas.append('p%d dois rotulos se sobrepoem em %.2f por %.2f pt '
                              '(em %.1f %.1f e %.1f %.1f)'
                              % (fig.pagina, sx, sy, a['x0'], a['y0'], b['x0'], b['y0']))

    # (4) arcos que dividem o mesmo vertice
    for i in range(len(arcos)):
        for j in range(i + 1, len(arcos)):
            a, b = arcos[i], arcos[j]
            if math.hypot(a['cx'] - b['cx'], a['cy'] - b['cy']) > 2:
                continue
            # Duas VOLTAS do mesmo angulo: mesma abertura e mesmo inicio. E a
            # notacao de congruencia por contagem de arcos, e ela pede o passo de
            # grupo (3 pt) e nao a separacao entre angulos diferentes (6 pt).
            mesmo = abs(a['abertura'] - b['abertura']) < 2 and \
                abs(((a['de'] - b['de']) + 180.0) % 360.0 - 180.0) < 2
            # As duas METADES de um angulo bissectado: mesmo raio, mesma abertura,
            # encostadas na semirreta que as separa. Elas TEM que se tocar, porque
            # o raio igual e o que afirma que as duas metades sao iguais, e quem as
            # separa na folha e a propria bissetriz passando entre elas. Afastar
            # uma da outra destruiria a afirmacao.
            pontas = min(math.hypot(p[0] - q[0], p[1] - q[1])
                         for p in (a['pts'][0], a['pts'][-1])
                         for q in (b['pts'][0], b['pts'][-1]))
            if abs(a['r'] - b['r']) < 0.5 and abs(a['abertura'] - b['abertura']) < 2.5 \
               and pontas < 1.0 and not mesmo:
                continue
            piso = PISO_ENTRE_VOLTAS if mesmo else PISO_ENTRE_ARCOS
            vao = min(dist_ao_arco(b, p) for p in a['pts'])
            if vao < piso - 1e-6:
                falhas.append('p%d dois arcos no vertice (%.1f, %.1f) a %.2f pt um do outro '
                              '(%.1f e %.1f graus), piso %.1f: emendados leem como um arco so'
                              % (fig.pagina, a['cx'], a['cy'], vao, a['abertura'],
                                 b['abertura'], piso))

    # (5) traco de fora da figura atravessando o bloco reservado
    #
    # O fundo branco antes de qualquer traco existe para o bloco da figura ficar
    # limpo. Um traco de contraste baixo que corta o bloco so pode ter vindo de
    # depois dele: e a marca d'agua, e ela le como um arco a mais.
    vistos = {}
    for t in fig.tracos:
        if contraste(t['cor']) >= 2.0 or len(t['p']) < 2:
            continue
        chave = '%.0f' % (t['w'] * 100)
        if chave in vistos:
            continue
        vistos[chave] = 1
        falhas.append('p%d traco de %.2f w e %.2f:1 de contraste atravessa o bloco da figura: '
                      'a marca d\'agua entra na faixa reservada e le como mais um arco'
                      % (fig.pagina, t['w'], contraste(t['cor'])))

    # (6) grupos de tracinho e de seta
    for gr in agrupar_marcas(fig):
        piso = PISO_SETA if gr['tipo'] == 'seta' else PISO_TRACINHO
        if gr['menor'] < piso - 1e-6:
            falhas.append('p%d %s: %d marcas do grupo em (%.1f, %.1f) a %.2f pt uma da outra, '
                          'piso %.1f: a fotocopia funde e a CONTAGEM deixa de ser contavel'
                          % (fig.pagina, 'pontas de seta' if gr['tipo'] == 'seta' else
                             'tracinhos de congruencia', gr['n'], gr['x'], gr['y'],
                             gr['menor'], piso))
    return falhas


def agrupar_marcas(fig):
    """Tracinho e um traco reto curto e solitario; seta e uma poligonal de tres
    pontos com o bico no meio. Os dois sao reconhecidos pela FORMA no fluxo, e
    nao por rotulo posto pelo desenhador."""
    itens = []
    for t in fig.tracos:
        if t['curvo'] or t['w'] < 0.7:
            continue
        p = t['p']
        if len(p) == 2:
            c = math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1])
            if 4.0 <= c <= 11.0:
                itens.append({'tipo': 'traco', 'p': ((p[0][0] + p[1][0]) / 2.0,
                                                     (p[0][1] + p[1][1]) / 2.0),
                              'dir': math.atan2(p[1][1] - p[0][1], p[1][0] - p[0][0])})
        elif len(p) == 3:
            b1, ap, b2 = p
            l1 = math.hypot(ap[0] - b1[0], ap[1] - b1[1])
            l2 = math.hypot(b2[0] - ap[0], b2[1] - ap[1])
            if 3.0 <= l1 <= 12.0 and 3.0 <= l2 <= 12.0 and abs(l1 - l2) < 1.0:
                itens.append({'tipo': 'seta', 'p': ap,
                              'dir': math.atan2(b2[1] - b1[1], b2[0] - b1[0])})
    grupos, visto = [], [False] * len(itens)
    for i, it in enumerate(itens):
        if visto[i]:
            continue
        grupo, visto[i] = [it], True
        mudou = True
        while mudou:
            mudou = False
            for j, ot in enumerate(itens):
                if visto[j] or ot['tipo'] != it['tipo']:
                    continue
                for g in grupo:
                    if math.hypot(g['p'][0] - ot['p'][0], g['p'][1] - ot['p'][1]) <= 14 and \
                       abs(((g['dir'] - ot['dir']) + math.pi) % math.pi) < 0.25:
                        grupo.append(ot); visto[j] = True; mudou = True
                        break
        if len(grupo) < 2:
            continue
        menor = min(math.hypot(grupo[a]['p'][0] - grupo[b]['p'][0],
                               grupo[a]['p'][1] - grupo[b]['p'][1])
                    for a in range(len(grupo)) for b in range(a + 1, len(grupo)))
        grupos.append({'tipo': it['tipo'], 'n': len(grupo), 'menor': menor,
                       'x': grupo[0]['p'][0], 'y': grupo[0]['p'][1]})
    return grupos


def blocos_de_figura(fig):
    """Toda figura comeca por um retangulo branco do tamanho do bloco reservado,
    que e a regra de fundo branco antes de qualquer traco. Ele e a fronteira que
    separa o desenho do corpo de texto da folha, e sem ela a palavra "e" do
    paragrafo passa por valor de angulo."""
    saida = []
    for h in fig.halos:
        if (h['x1'] - h['x0']) >= 60 and (h['y1'] - h['y0']) >= 30:
            saida.append(h)
    return saida


def dentro(bl, x, y):
    return bl['x0'] - 1 <= x <= bl['x1'] + 1 and bl['y0'] - 1 <= y <= bl['y1'] + 1


def recortar(fig, bl):
    """A figura vista so dentro de um bloco."""
    novo = Figura(fig.pagina)
    for t in fig.tracos:
        if any(dentro(bl, p[0], p[1]) for p in t['p']):
            novo.tracos.append(t)
    for h in fig.halos:
        if h is bl:
            continue
        if dentro(bl, h['x0'], h['y0']) and dentro(bl, h['x1'], h['y1']):
            novo.halos.append(h)
    for c in fig.cheios:
        if any(dentro(bl, p[0], p[1]) for p in c['p']):
            novo.cheios.append(c)
    for tx in fig.textos:
        if dentro(bl, tx['x'], tx['y']):
            novo.textos.append(tx)
    return novo


def main(argv):
    paginas = None
    arquivos = []
    i = 0
    while i < len(argv):
        if argv[i] == '--paginas':
            paginas = [int(v) for v in argv[i + 1].split(',')]
            i += 2
            continue
        arquivos.append(argv[i])
        i += 1
    total = 0
    for arq in arquivos:
        doc = pymupdf.open(arq)
        achadas, arcos, marcas, quantas = [], 0, 0, 0
        for n in range(len(doc)):
            if paginas and (n + 1) not in paginas:
                continue
            pag = ler_pagina(doc[n], n + 1)
            for bl in blocos_de_figura(pag):
                fig = recortar(pag, bl)
                quantas += 1
                arcos += len(arcos_de(fig))
                marcas += len(agrupar_marcas(fig))
                achadas += auditar(fig)
        nome = arq.replace('\\', '/').split('/')[-1]
        print('%s: %d bloco(s) de figura, %d arco(s), %d grupo(s) de marca, %d defeito(s)'
              % (nome, quantas, arcos, marcas, len(achadas)))
        for f in achadas:
            print('   ! ' + f)
        total += len(achadas)
    return 1 if total else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
