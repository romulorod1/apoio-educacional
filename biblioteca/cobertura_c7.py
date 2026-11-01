"""Mede vínculos diretos entre assuntos de matemática e listas dos pacotes.

Uso: python biblioteca/cobertura_c7.py CAMINHO_DOS_PACOTES
Lê somente o índice de assuntos e os metadados dos zips. Não copia exercícios.
"""

import collections
import json
import pathlib
import sys
import unicodedata
import zipfile


RAIZ = pathlib.Path(__file__).resolve().parent.parent
INDICE = RAIZ / "banco" / "topicos" / "matematica.json"


def normalizar(texto):
    return "".join(
        c for c in unicodedata.normalize("NFD", texto.casefold())
        if unicodedata.category(c) != "Mn" and c.isalnum()
    )


def pacotes_atuais(pasta):
    por_nome = {}
    for caminho in pasta.glob("matematica-obmep-*.zip"):
        with zipfile.ZipFile(caminho) as z:
            manifest = json.loads(z.read("manifest.json"))
            nome, versao = manifest["pacote"], manifest["versao"]
            if nome not in por_nome or versao > por_nome[nome][0]:
                por_nome[nome] = (versao, caminho)
    return [caminho for _, caminho in por_nome.values()]


def medir(pasta):
    assuntos = json.loads(INDICE.read_text(encoding="utf-8"))["temas"]
    titulos = collections.defaultdict(list)
    por_modulo = collections.defaultdict(list)
    for assunto in assuntos:
        titulos[normalizar(assunto["pt"]["titulo"])].append(assunto["id"])
        if assunto.get("modulo"):
            por_modulo[assunto["modulo"]].append(assunto["id"])
    listas = collections.defaultdict(set)
    exercicios = collections.Counter()
    sem_kit = set()
    modulos = 0
    for caminho in pacotes_atuais(pasta):
        with zipfile.ZipFile(caminho) as z:
            manifest = json.loads(z.read("manifest.json"))
            itens = json.loads(z.read("itens.json"))
            kits = json.loads(z.read("kits.json")) if "kits.json" in z.namelist() else []
            por_item = {}
            for it in itens:
                por_item[it["id"]] = it.get("tema_app")
                if it.get("tema_app"):
                    exercicios[it["tema_app"]] += 1
            for k in kits:
                if k.get("nivel") != 1 or not k.get("degraus"):
                    continue
                modulos += 1
                vinculos = {por_item.get(d["item"]) for d in k["degraus"]}
                vinculos.discard(None)
                vinculos |= set(titulos[normalizar(k["titulo"])])
                if k.get("modulo"):
                    vinculos |= set(por_modulo.get(k["modulo"], []))
                for assunto_id in vinculos:
                    listas[assunto_id].add((manifest["pacote"], k["id"]))
            if not kits:
                sem_kit.add(manifest["pacote"])
    return {
        "assuntos": len(assuntos),
        "assuntos_com_exercicio_id_explicito": len(exercicios),
        "assuntos_com_lista_diretamente_vinculada": len(listas),
        "modulos_com_lista_base": modulos,
        "pacotes_sem_kits": sorted(sem_kit),
        "sem_lista_direta": [a["id"] for a in assuntos if a["id"] not in listas],
        "exercicios_por_assunto": dict(sorted(exercicios.items())),
    }


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("uso: python biblioteca/cobertura_c7.py CAMINHO_DOS_PACOTES")
    print(json.dumps(medir(pathlib.Path(sys.argv[1])), ensure_ascii=False, indent=2))
