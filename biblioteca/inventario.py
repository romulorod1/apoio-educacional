"""Inventario de uma serie do Portal da OBMEP: modulos, aulas, pareamento, paginas.

    python biblioteca/inventario.py <pasta da serie> <serie> <saida.json>

So le os PDFs; nao recorta nada. A contagem de itens vem do mesmo detector do
gerador, para o inventario e o pacote nunca discordarem.
"""
import io
import json
import os
import sys

import pymupdf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import portal  # noqa: E402


def inventariar(pasta, serie, detector=None):
    arquivos = portal.listar(pasta)
    modulos = {}
    for a in arquivos:
        doc = pymupdf.open(os.path.join(pasta, a['arquivo']))
        m = modulos.setdefault(a['modulo'], {'slug': a['modulo'], 'titulo': None, 'teorias': [], 'listas': []})
        paginas = [{'n': i + 1, 'largura_pt': round(p.rect.width, 1), 'altura_pt': round(p.rect.height, 1)}
                   for i, p in enumerate(doc)]
        tamanhos = sorted(set((p['largura_pt'], p['altura_pt']) for p in paginas))
        if a['tipo'] == 'teoria':
            capa = portal.capa_da_teoria(doc)
            m['teorias'].append({'aula': a['aula'], 'arquivo': a['arquivo'], 'paginas': doc.page_count,
                                 'tamanho_pt': tamanhos, 'capa': capa})
            if capa.get('modulo') and not m['titulo']:
                m['titulo'] = capa['modulo']
        else:
            capa = portal.capa_da_lista(doc)
            lista = {'aula': a['aula'], 'arquivo': a['arquivo'], 'paginas': doc.page_count,
                     'tamanho_pt': tamanhos, 'capa': capa}
            if detector:
                lista.update(detector(doc))
            m['listas'].append(lista)
            if capa.get('modulo'):
                m['titulo'] = capa['modulo']
    for m in modulos.values():
        for t in m['teorias']:
            t['exercicios_pareados'] = [l['aula'] for l in m['listas'] if portal.casa(t['aula'], l['aula'], t['capa'].get('titulo'), l['capa'].get('titulo'))]
        for l in m['listas']:
            l['teorias_pareadas'] = [t['aula'] for t in m['teorias'] if portal.casa(t['aula'], l['aula'], t['capa'].get('titulo'), l['capa'].get('titulo'))]
    lista_mod = [modulos[k] for k in sorted(modulos)]
    return {
        'serie': serie,
        'pasta': pasta.replace('\\', '/').split('/Aplicativo/')[-1],
        'pymupdf': portal.versao_pymupdf(),
        'contagens': {
            'arquivos': len(arquivos),
            'modulos': len(lista_mod),
            'aulas_teoria': sum(len(m['teorias']) for m in lista_mod),
            'paginas_teoria': sum(t['paginas'] for m in lista_mod for t in m['teorias']),
            'aulas_exercicios': sum(len(m['listas']) for m in lista_mod),
            'paginas_exercicios': sum(l['paginas'] for m in lista_mod for l in m['listas']),
            'teorias_sem_lista': sum(1 for m in lista_mod for t in m['teorias'] if not t['exercicios_pareados']),
            'listas_sem_teoria': sum(1 for m in lista_mod for l in m['listas'] if not l['teorias_pareadas']),
        },
        'modulos': lista_mod,
    }


if __name__ == '__main__':
    pasta, serie, saida = sys.argv[1:4]
    import gerar_pacote
    inv = inventariar(pasta, serie, gerar_pacote.resumo_de_lista)
    inv['contagens']['itens_enunciado'] = sum(l['itens_enunciado'] for m in inv['modulos'] for l in m['listas'])
    inv['contagens']['itens_solucao'] = sum(l['itens_solucao'] for m in inv['modulos'] for l in m['listas'])
    io.open(saida, 'w', encoding='utf-8', newline='').write(json.dumps(inv, ensure_ascii=False, indent=1) + '\n')
    print(json.dumps(inv['contagens'], ensure_ascii=False))
