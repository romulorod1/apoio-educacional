import hashlib
import json
import pathlib
import tempfile
import zipfile

import cobertura_c7


with tempfile.TemporaryDirectory() as pasta:
    pasta = pathlib.Path(pasta)
    indice = pasta / 'indice.json'
    indice.write_text(json.dumps({'temas': [
        {'id': 'MAT01', 'modulo': '7ano:correto'},
        {'id': 'MAT02', 'modulo': None},
    ]}), encoding='utf-8')
    cobertura_c7.INDICE = indice
    itens = json.dumps([{'id': 'i1', 'serie': '7ano', 'modulo': {'slug': 'correto'},
                         'tema_app': 'MAT02'}]).encode()
    kits = json.dumps([{'id': 'k1', 'modulo': '7ano:correto', 'nivel': 1,
                        'degraus': [{'item': 'i1'}]}]).encode()
    manifest = {'pacote': 'matematica-obmep-teste', 'versao': 1, 'arquivos': {
        'itens.json': 'sha256:' + hashlib.sha256(itens).hexdigest(),
        'kits.json': 'sha256:' + hashlib.sha256(kits).hexdigest()}}
    caminho = pasta / 'matematica-obmep-teste-v1.zip'
    def gravar(extra=False):
        with zipfile.ZipFile(caminho, 'w') as z:
            z.writestr('manifest.json', json.dumps(manifest))
            z.writestr('itens.json', itens)
            z.writestr('kits.json', kits)
            if extra:
                z.writestr('extra.json', '{}')
    gravar()
    resultado = cobertura_c7.medir(pasta)
    assert resultado['assuntos_com_lista_diretamente_vinculada'] == 1
    assert resultado['sem_lista_direta'] == ['MAT02']
    gravar(extra=True)
    resultado = cobertura_c7.medir(pasta)
    assert resultado['assuntos_com_lista_diretamente_vinculada'] == 0
    assert resultado['pacotes_invalidos'] == ['matematica-obmep-teste']

print('2 passaram, 0 falharam.')
