"""figuras/_audita_receitas_curvas.py

Auditor independente das receitas de curva do receitas.js (circulo, conica,
pidesenrolado). Nao importa uma linha do projeto: abre o PDF pronto com o MuPDF,
recupera os caminhos desenhados e mede na FOLHA:

  isotropia   toda volta fechada de quatro Beziers e amostrada; a caixa
              envolvente tem que ter largura igual a altura (circunferencia)
              e os pontos tem que ficar a distancia constante do centro
  elipse      a volta cujo desvio radial denuncia que nao e circulo: a e b saem
              da caixa, c = raiz(a2 - b2), e os pontos preenchidos pequenos
              (as bolinhas) sobre o eixo maior tem que estar a c do centro
  hiperbole   os dois caminhos longos abertos: a sai do ponto mais proximo do
              centro, os pontos cumprem |PF1 - PF2| = 2a para as bolinhas
              achadas sobre o eixo, e dai c sai medido
  parabola    o caminho longo aberto sem par: p sai de y2 = 2px nos pontos da
              curva, e a bolinha sobre o eixo tem que estar a p/2 do vertice,
              com a reta vertical fina a p/2 do outro lado
  pi          na pagina do pi desenrolado, os cinco tacos verticais curtos
              sobre a regua marcam 0, d, 2d, 3d e pi vezes d

Uso:

    python _audita_receitas_curvas.py <arquivo.pdf> [--pagina N]

Regra da casa: nunca usar travessao.
"""
import math
import sys

import pymupdf

TOL_ISOTROPIA = 0.5     # pt, diferenca entre largura e altura da caixa
TOL_FOCO = 0.5          # pt, erro da posicao do foco
TOL_PI = 0.5            # pt, erro do comprimento do barbante


def bezier(p0, p1, p2, p3, t):
    s = 1.0 - t
    return (
        s * s * s * p0[0] + 3 * s * s * t * p1[0] + 3 * s * t * t * p2[0] + t * t * t * p3[0],
        s * s * s * p0[1] + 3 * s * s * t * p1[1] + 3 * s * t * t * p2[1] + t * t * t * p3[1],
    )


def amostrar(desenho, por_trecho=16):
    """Todos os pontos por onde o caminho passa, dentro de cada Bezier."""
    pts = []
    curvos = 0
    retos = 0
    for item in desenho.get("items", []):
        if item[0] == "c":
            p0, p1, p2, p3 = [(q.x, q.y) for q in item[1:5]]
            curvos += 1
            for i in range(por_trecho + 1):
                pts.append(bezier(p0, p1, p2, p3, i / por_trecho))
        elif item[0] == "l":
            retos += 1
            pts.append((item[1].x, item[1].y))
            pts.append((item[2].x, item[2].y))
        elif item[0] == "re":
            r = item[1]
            retos += 4
            pts += [(r.x0, r.y0), (r.x1, r.y0), (r.x1, r.y1), (r.x0, r.y1)]
    return pts, curvos, retos


def caixa(pts):
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return {
        "x0": min(xs), "y0": min(ys), "x1": max(xs), "y1": max(ys),
        "largura": max(xs) - min(xs), "altura": max(ys) - min(ys),
        "cx": (min(xs) + max(xs)) / 2.0, "cy": (min(ys) + max(ys)) / 2.0,
    }


def dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def classificar(pagina):
    """Separa os caminhos da pagina em circunferencias, elipses, bolinhas,
    curvas longas abertas e segmentos, so pela forma do que foi impresso."""
    circ, elip, bolinhas, longas, segmentos = [], [], [], [], []
    for d in pagina.get_drawings():
        pts, curvos, retos = amostrar(d)
        if not pts:
            continue
        cx = caixa(pts)
        tracado = d.get("color") is not None and d.get("width") is not None
        preenchido = d.get("fill") is not None
        if curvos == 4 and retos == 0:
            if preenchido and cx["largura"] < 8:
                bolinhas.append((cx["cx"], cx["cy"]))
                continue
            if not tracado or cx["largura"] < 20:
                continue
            r = (cx["largura"] + cx["altura"]) / 4.0
            radial = max(abs(dist(p, (cx["cx"], cx["cy"])) - r) for p in pts)
            if radial < 1.0:
                circ.append({"caixa": cx, "raio": r, "radial": radial, "w": d.get("width")})
            else:
                elip.append({"caixa": cx, "pts": pts, "w": d.get("width")})
        elif curvos >= 30 and tracado:
            longas.append({"caixa": cx, "pts": pts, "w": d.get("width")})
        elif curvos == 0 and retos == 1 and tracado:
            it = d["items"][0]
            segmentos.append({"a": (it[1].x, it[1].y), "b": (it[2].x, it[2].y), "w": d.get("width")})
    return circ, elip, bolinhas, longas, segmentos


def auditar(pdf, so_pagina=None):
    doc = pymupdf.open(pdf)
    falhas = 0
    for num, pagina in enumerate(doc, start=1):
        if so_pagina is not None and num != so_pagina:
            continue
        circ, elip, bolinhas, longas, segmentos = classificar(pagina)
        print("pagina %d: %d circunferencia(s), %d elipse(s), %d bolinha(s), %d curva(s) longa(s)" %
              (num, len(circ), len(elip), len(bolinhas), len(longas)))

        # --------------------------------------------------------- isotropia
        for c in circ:
            aniso = abs(c["caixa"]["largura"] - c["caixa"]["altura"])
            veredito = "OK" if aniso < TOL_ISOTROPIA else "FALHA"
            if veredito == "FALHA":
                falhas += 1
            print("  %s  circunferencia raio %.3f pt: caixa %.3f por %.3f, anisotropia %.4f pt, desvio radial %.4f pt" %
                  (veredito, c["raio"], c["caixa"]["largura"], c["caixa"]["altura"], aniso, c["radial"]))

        # --------------------------------------------------------- elipse
        for e in elip:
            cx = e["caixa"]
            a, b = cx["largura"] / 2.0, cx["altura"] / 2.0
            c = math.sqrt(abs(a * a - b * b))
            horizontal = a >= b
            centro = (cx["cx"], cx["cy"])
            if horizontal:
                no_eixo = [p for p in bolinhas if abs(p[1] - centro[1]) < 0.6 and abs(p[0] - centro[0]) > 1]
                dists = [abs(p[0] - centro[0]) for p in no_eixo]
            else:
                no_eixo = [p for p in bolinhas if abs(p[0] - centro[0]) < 0.6 and abs(p[1] - centro[1]) > 1]
                dists = [abs(p[1] - centro[1]) for p in no_eixo]
            F1 = (centro[0] + c, centro[1]) if horizontal else (centro[0], centro[1] + c)
            F2 = (centro[0] - c, centro[1]) if horizontal else (centro[0], centro[1] - c)
            pior = max(abs(dist(p, F1) + dist(p, F2) - 2 * max(a, b)) for p in e["pts"])
            focos = [d for d in dists if abs(d - c) < TOL_FOCO]
            texto = ("  elipse a = %.3f, b = %.3f, c = raiz(a2 - b2) = %.3f pt; PF1 + PF2 - 2a no pior ponto: %.4f pt; "
                     "bolinhas no eixo maior a %s pt do centro" %
                     (a, b, c, pior, ", ".join("%.3f" % d for d in dists) or "nenhuma"))
            if no_eixo:
                veredito = "OK" if len(focos) >= 2 else "FALHA"
                if veredito == "FALHA":
                    falhas += 1
                print("  %s  %s (erro dos focos: %s)" % (veredito, texto.strip(),
                      ", ".join("%.4f" % abs(d - c) for d in dists)))
            else:
                print("  ...  " + texto.strip() + " (sem foco marcado nesta elipse)")

        # --------------------------------------------------------- hiperbole e parabola
        if len(longas) == 2:
            todos = longas[0]["pts"] + longas[1]["pts"]
            cx = caixa(todos)
            centro = (cx["cx"], cx["cy"])
            a = min(abs(p[0] - centro[0]) for p in todos)
            no_eixo = [p for p in bolinhas if abs(p[1] - centro[1]) < 0.6 and abs(p[0] - centro[0]) > a + 1]
            if no_eixo:
                c_med = sum(abs(p[0] - centro[0]) for p in no_eixo) / len(no_eixo)
                F1, F2 = (centro[0] + c_med, centro[1]), (centro[0] - c_med, centro[1])
                pior = max(abs(abs(dist(p, F1) - dist(p, F2)) - 2 * a) for p in todos)
                b = math.sqrt(max(0.0, c_med * c_med - a * a))
                veredito = "OK" if pior < 0.5 else "FALHA"
                if veredito == "FALHA":
                    falhas += 1
                print("  %s  hiperbole a = %.3f pt, focos impressos a %.3f pt do centro (b deduzido %.3f, a/b = %.4f); "
                      "|PF1 - PF2| - 2a no pior ponto: %.4f pt" % (veredito, a, c_med, b, a / b if b else 0, pior))
            else:
                print("  ...  dois ramos sem bolinha sobre o eixo: hiperbole sem foco marcado")
        elif len(longas) == 1:
            pts = longas[0]["pts"]
            V = min(pts, key=lambda p: p[0])
            soma, n = 0.0, 0
            for p in pts:
                x, y = p[0] - V[0], p[1] - V[1]
                if x > 2:
                    soma += y * y / (2 * x)
                    n += 1
            p_lido = soma / n if n else 0.0
            focos = [q for q in bolinhas if abs(q[1] - V[1]) < 0.6 and q[0] > V[0]]
            verticais = [s for s in segmentos if abs(s["a"][0] - s["b"][0]) < 0.05 and abs(s["a"][1] - s["b"][1]) > 20
                         and s["w"] is not None and s["w"] < 0.7 and s["a"][0] < V[0]]
            texto = "parabola p lido da curva = %.3f pt (foco esperado a %.3f do vertice)" % (p_lido, p_lido / 2)
            if focos:
                dF = focos[0][0] - V[0]
                erro = abs(dF - p_lido / 2)
                texto += "; foco impresso a %.3f pt, erro %.4f" % (dF, erro)
                veredito = "OK" if erro < TOL_FOCO else "FALHA"
                if verticais:
                    dD = V[0] - verticais[0]["a"][0]
                    erroD = abs(dD - p_lido / 2)
                    texto += "; diretriz impressa a %.3f pt, erro %.4f" % (dD, erroD)
                    if erroD >= TOL_FOCO:
                        veredito = "FALHA"
                    pior = max(abs(dist(q, focos[0]) - abs(q[0] - verticais[0]["a"][0])) for q in pts)
                    texto += "; PF - Pd no pior ponto %.4f pt" % pior
                if veredito == "FALHA":
                    falhas += 1
                print("  %s  %s" % (veredito, texto))
            else:
                print("  ...  " + texto + " (sem foco marcado)")

        # --------------------------------------------------------- pi desenrolado
        tacos = sorted(s["a"][0] for s in segmentos
                       if abs(s["a"][0] - s["b"][0]) < 0.05 and abs(abs(s["a"][1] - s["b"][1]) - 7) < 0.15)
        if len(tacos) == 5 and circ:
            # A marca d'agua da folha e um circulo de raio 96 e tambem entra na
            # lista: o diametro do barbante e o do circulo mais proximo do
            # primeiro vao entre tacos, e nao o primeiro circulo achado.
            vao = tacos[1] - tacos[0]
            d = min((c["caixa"]["largura"] for c in circ), key=lambda L: abs(L - vao))
            total = tacos[4] - tacos[0]
            erros = [abs(tacos[i] - tacos[0] - i * d) for i in (1, 2, 3)]
            erro_pi = abs(total - math.pi * d)
            veredito = "OK" if erro_pi < TOL_PI and max(erros) < TOL_PI else "FALHA"
            if veredito == "FALHA":
                falhas += 1
            print("  %s  pi desenrolado: d = %.3f pt (diametro impresso), tacos a %s pt, barbante %.3f pt contra pi vezes d = %.3f (erro %.4f); sobra = %.4f d" %
                  (veredito, d, ", ".join("%.3f" % (t - tacos[0]) for t in tacos), total, math.pi * d, erro_pi,
                   (tacos[4] - tacos[3]) / d))
    print("")
    print("falhas: %d" % falhas)
    return falhas


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    pagina = None
    if "--pagina" in sys.argv:
        pagina = int(sys.argv[sys.argv.index("--pagina") + 1])
    sys.exit(1 if auditar(sys.argv[1], pagina) else 0)
