import hashlib
import json
import pathlib
import tempfile
import zipfile

from corrigir_pacote_mirim_c7 import preparar


with tempfile.TemporaryDirectory() as pasta:
    origem = pathlib.Path(pasta) / 'antigo.zip'
    destino = pathlib.Path(pasta) / 'novo.zip'
    itens = b'[{"id":"exemplo"}]'
    listas = b'[{"id":"lista"}]'
    manifest = {'pacote': 'matematica-obmep-mirim-m1', 'versao': 1,
                'gerador': {}, 'contagens': {},
                'arquivos': {'itens.json': 'sha256:' + hashlib.sha256(itens).hexdigest()}}
    with zipfile.ZipFile(origem, 'w') as z:
        z.writestr('manifest.json', json.dumps(manifest))
        z.writestr('itens.json', itens)
        z.writestr('kits.json', listas)
    resultado = preparar(origem, destino)
    with zipfile.ZipFile(destino) as z:
        novo = json.loads(z.read('manifest.json'))
        assert novo['versao'] == 2 and resultado['listas'] == 1
        assert novo['arquivos']['kits.json'] == 'sha256:' + hashlib.sha256(listas).hexdigest()
        assert z.read('itens.json') == itens and z.read('kits.json') == listas
        assert set(z.namelist()) == set(novo['arquivos']) | {'manifest.json'}
    manifest['arquivos']['itens.json'] = 'sha256:incorreto'
    with zipfile.ZipFile(origem, 'w') as z:
        z.writestr('manifest.json', json.dumps(manifest))
        z.writestr('itens.json', itens)
        z.writestr('kits.json', listas)
    try:
        preparar(origem, pathlib.Path(pasta) / 'recusado.zip')
        raise AssertionError('hash incorreto foi aceito')
    except ValueError:
        pass

print('Pacote corrigido e recusa de hash inválido: passou')
