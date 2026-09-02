"""figuras/_prova_receitas_auditor.py

Auditor independente das figuras do receitas.js. Nao importa uma linha do
projeto: abre o PDF pronto com o MuPDF, recupera os caminhos desenhados e os
rotulos com as caixas deles, e mede o angulo interno de cada vertice na FOLHA.
E o contrario do que a receita faz, e de proposito: a receita parte do valor
para o desenho, o auditor parte do desenho para o valor.

Uso:

    python _prova_receitas_auditor.py <arquivo.pdf> [--pagina N] [--json]

Sai com uma linha por poligono fechado achado, com os angulos internos, e uma
linha por rotulo, dizendo em que vertice ele pousou e quanto esse vertice mede.

Regra da casa: nunca usar travessao.
"""
import json
import math
import sys

import pymupdf

# O contorno da figura sai em 1,2 pt na tinta do texto; a ceviana, a guia e o
# fio de chamada saem mais finos. Filtrar por espessura separa a forma das
# marcas sem precisar saber nada da receita.
ESPESSURA_MINIMA = 1.0


def pontos_do_caminho(desenho):
    """Os vertices de um caminho, na ordem em que o PDF os emitiu."""
    pts = []
    for item in desenho.get("items", []):
        if item[0] == "l":
            a, b = item[1], item[2]
            if not pts:
                pts.append((a.x, a.y))
            pts.append((b.x, b.y))
        elif item[0] == "re":
            r = item[1]
            return [(r.x0, r.y0), (r.x1, r.y0), (r.x1, r.y1), (r.x0, r.y1)]
        else:
            return []
    # caminho fechado escrito com o ultimo ponto repetido
    if len(pts) > 2 and abs(pts[0][0] - pts[-1][0]) < 0.05 and abs(pts[0][1] - pts[-1][1]) < 0.05:
        pts = pts[:-1]
    return pts


def angulo_em(p, a, b):
    a1 = math.atan2(a[1] - p[1], a[0] - p[0])
    a2 = math.atan2(b[1] - p[1], b[0] - p[0])
    d = abs(a1 - a2) * 180.0 / math.pi
    return 360.0 - d if d > 180.0 else d


def angulos_internos(pts):
    n = len(pts)
    return [round(angulo_em(pts[i], pts[(i + 1) % n], pts[(i + n - 1) % n]), 2) for i in range(n)]


def juntar_segmentos(segmentos, tol=0.6):
    """Fecha poligonos a partir de segmentos soltos.

    A figura chega como caminho unico ("m l l l h S") quando quem desenha tem o
    poligono() a mao, e como linhas independentes no caminho de recuo. O auditor
    nao pode depender disso: junta ponta com ponta e so aceita o que fecha.
    """
    livres = list(segmentos)
    saida = []
    while livres:
        a, b = livres.pop(0)
        cadeia = [a, b]
        andou = True
        while andou:
            andou = False
            for i, (c, d) in enumerate(livres):
                for ponta, outra in ((c, d), (d, c)):
                    if math.dist(cadeia[-1], ponta) <= tol:
                        cadeia.append(outra)
                        livres.pop(i)
                        andou = True
                        break
                if andou:
                    break
        if len(cadeia) >= 4 and math.dist(cadeia[0], cadeia[-1]) <= tol:
            saida.append(cadeia[:-1])
    return saida


def poligonos_da_pagina(pagina, lados=None):
    saida = []
    soltos = []
    for des in pagina.get_drawings():
        if des.get("type") not in ("s", "sf", "fs"):
            continue
        if (des.get("width") or 0) < ESPESSURA_MINIMA:
            continue
        pts = pontos_do_caminho(des)
        if len(pts) == 2:
            soltos.append((pts[0], pts[1]))
            continue
        if len(pts) < 3:
            continue
        saida.append({"pontos": pts, "angulos": angulos_internos(pts),
                      "closePath": bool(des.get("closePath"))})
    for pts in juntar_segmentos(soltos):
        saida.append({"pontos": pts, "angulos": angulos_internos(pts), "closePath": True})
    if lados is not None:
        saida = [p for p in saida if len(p["pontos"]) == lados]
    return saida


def rotulos_da_pagina(pagina):
    saida = []
    bruto = pagina.get_text("dict")
    for bloco in bruto.get("blocks", []):
        for linha in bloco.get("lines", []):
            for trecho in linha.get("spans", []):
                texto = trecho.get("text", "").strip()
                if not texto:
                    continue
                x0, y0, x1, y1 = trecho["bbox"]
                saida.append({"texto": texto, "centro": ((x0 + x1) / 2.0, (y0 + y1) / 2.0),
                              "bbox": [x0, y0, x1, y1], "tam": round(trecho.get("size", 0), 2)})
    return saida


def encostar(poligonos, rotulos, limite=46.0):
    """Cada rotulo curto pousa no vertice mais proximo, com o angulo dele."""
    achados = []
    for r in rotulos:
        if len(r["texto"]) > 12:
            continue
        melhor = None
        for ip, pol in enumerate(poligonos):
            for iv, v in enumerate(pol["pontos"]):
                d = math.hypot(v[0] - r["centro"][0], v[1] - r["centro"][1])
                if melhor is None or d < melhor["dist"]:
                    melhor = {"dist": d, "poligono": ip, "vertice": iv,
                              "angulo": pol["angulos"][iv]}
        if melhor and melhor["dist"] <= limite:
            achados.append({"texto": r["texto"], "dist": round(melhor["dist"], 2),
                            "poligono": melhor["poligono"], "vertice": melhor["vertice"],
                            "angulo": melhor["angulo"]})
    return achados


def lados(pts):
    n = len(pts)
    return [round(math.dist(pts[i], pts[(i + 1) % n]), 2) for i in range(n)]


def auditar(caminho, pagina_pedida=None):
    doc = pymupdf.open(caminho)
    paginas = []
    for i, pag in enumerate(doc):
        if pagina_pedida is not None and i + 1 != pagina_pedida:
            continue
        pols = poligonos_da_pagina(pag)
        rots = rotulos_da_pagina(pag)
        paginas.append({
            "pagina": i + 1,
            "poligonos": [{"angulos": p["angulos"], "lados": lados(p["pontos"]),
                           "pontos": [[round(c, 2) for c in v] for v in p["pontos"]]} for p in pols],
            "rotulos": encostar(pols, rots)
        })
    return paginas


# O que tem que sair em cada pagina do _prova_receitas.pdf. Os numeros sao
# conta de lapis e nao saida de codigo: no exercicio 15, 3x+10 mais 2x+20 igual
# a 180 da x igual a 30, entao o vertice do 3x+10 mede 100 e o do 2x+20 mede 80.
# A pagina 3 e o conserto DESLIGADO e tem que falhar: um teste que so olha a
# versao consertada nao prova nada.
ESPERADO = {
    1: {"rotulos": {"3x+10": 100.0, "2x+20": 80.0}},
    2: {"rotulos": {"2x+20": 80.0, "3x+10": 100.0}},
    3: {"rotulos": {"3x+10": 100.0, "2x+20": 80.0}, "deve_falhar": True},
    4: {"rotulos": {"65°": 65.0}},
    5: {"rotulos": {"65°": 65.0, "x": 115.0}},
    6: {"angulos": [52.0, 76.0, 104.0, 128.0], "pernas_diferentes": 0.10},
    7: {"angulos": [72.0, 72.0, 108.0, 108.0], "pernas_iguais": 0.01},
    8: {"rotulos": {"2x": 40.0, "3x": 60.0, "4x": 80.0}},
    9: {"rotulos": {"40°": 40.0, "x": 70.0}},
    10: {"rotulos": {"96.89°": 96.89, "114.17°": 114.17,
                     "72.99°": 72.99, "75.95°": 75.95}},
}


def conferir(dados):
    """Cobra o ESPERADO pagina a pagina. Devolve o numero de paginas erradas."""
    erradas = 0
    for p in dados:
        esp = ESPERADO.get(p["pagina"])
        if not esp:
            continue
        falhas = []
        for texto, alvo in esp.get("rotulos", {}).items():
            achados = [r for r in p["rotulos"] if r["texto"] == texto]
            if not achados:
                falhas.append("o rotulo %s nao pousou em vertice nenhum" % texto)
                continue
            for r in achados:
                if abs(r["angulo"] - alvo) > 0.5:
                    falhas.append("o rotulo %s pousou num vertice de %.2f e tinha que valer %.2f"
                                  % (texto, r["angulo"], alvo))
        if esp.get("angulos") and p["poligonos"]:
            visto = sorted(p["poligonos"][0]["angulos"])
            quer = sorted(esp["angulos"])
            if any(abs(a - b) > 0.5 for a, b in zip(visto, quer)):
                falhas.append("os angulos %s nao sao %s" % (visto, quer))
        if p["poligonos"] and ("pernas_diferentes" in esp or "pernas_iguais" in esp):
            lad = p["poligonos"][0]["lados"]
            # no trapezio da volta A, B, C, D as pernas sao os lados 1 e 3
            perna1, perna2 = lad[1], lad[3]
            razao = abs(perna1 - perna2) / max(perna1, perna2)
            if "pernas_diferentes" in esp and razao < esp["pernas_diferentes"]:
                falhas.append("as duas pernas saem com %.1f por cento de diferenca, e o trapezio "
                              "generico esta desenhado simetrico" % (razao * 100))
            if "pernas_iguais" in esp and razao > esp["pernas_iguais"]:
                falhas.append("as duas pernas do isosceles saem diferentes (%.1f por cento)"
                              % (razao * 100))
        deve = esp.get("deve_falhar", False)
        if falhas and not deve:
            erradas += 1
            print("FALHA pagina %d" % p["pagina"])
            for f in falhas:
                print("      " + f)
        elif falhas and deve:
            print("OK    pagina %d acusada como tinha que ser (conserto desligado)" % p["pagina"])
            for f in falhas:
                print("      " + f)
        elif deve:
            erradas += 1
            print("FALHA pagina %d era para ser acusada e passou: o auditor nao esta vendo nada"
                  % p["pagina"])
        else:
            print("OK    pagina %d" % p["pagina"])
    return erradas


def main():
    args = [a for a in sys.argv[1:]]
    if not args:
        print(__doc__)
        return 2
    caminho = args[0]
    pagina = None
    if "--pagina" in args:
        pagina = int(args[args.index("--pagina") + 1])
    dados = auditar(caminho, pagina)
    if "--json" in args:
        print(json.dumps(dados, ensure_ascii=False))
        return 0
    if "--conferir" in args:
        erradas = conferir(dados)
        print("\n%d pagina(s) fora do esperado." % erradas)
        return 1 if erradas else 0
    for p in dados:
        if not p["poligonos"]:
            continue
        print("pagina %d" % p["pagina"])
        for i, pol in enumerate(p["poligonos"]):
            print("  poligono %d  angulos %s  lados %s" % (i, pol["angulos"], pol["lados"]))
        for r in p["rotulos"]:
            print("  rotulo %-8s no poligono %d vertice %d, que mede %.2f  (a %.1f pt)"
                  % (r["texto"], r["poligono"], r["vertice"], r["angulo"], r["dist"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
