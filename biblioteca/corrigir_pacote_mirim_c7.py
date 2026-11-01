"""Prepara nova versão dos pacotes Mirim com as listas declaradas no manifest."""
import argparse
import hashlib
import json
import pathlib
import zipfile


def preparar(origem, destino):
    with zipfile.ZipFile(origem) as antigo:
        nomes = antigo.namelist()
        if len(nomes) != len(set(nomes)) or 'kits.json' not in nomes:
            raise ValueError('Pacote sem listas ou com nomes repetidos')
        manifest = json.loads(antigo.read('manifest.json'))
        if manifest.get('versao') != 1 or not manifest.get('pacote', '').startswith('matematica-obmep-mirim-'):
            raise ValueError('Esperado pacote Mirim de versão 1')
        arquivos = {n: antigo.read(n) for n in nomes if n != 'manifest.json' and not n.endswith('/')}
        declarados = manifest['arquivos']
        if set(arquivos) - set(declarados) != {'kits.json'} or set(declarados) - set(arquivos):
            raise ValueError('Diferença inesperada entre ZIP e manifest')
        for nome, esperado in declarados.items():
            if 'sha256:' + hashlib.sha256(arquivos[nome]).hexdigest() != esperado:
                raise ValueError('Hash não confere: ' + nome)
        listas = json.loads(arquivos['kits.json'])
        if not isinstance(listas, list) or not listas:
            raise ValueError('Arquivo de listas vazio ou inválido')
        manifest['versao'] = 2
        manifest['arquivos']['kits.json'] = 'sha256:' + hashlib.sha256(arquivos['kits.json']).hexdigest()
        manifest['contagens']['kits'] = len(listas)
        manifest['gerador']['ajuste_c7'] = 'listas declaradas e versão elevada'
        texto = (json.dumps(manifest, ensure_ascii=False, indent=1) + '\n').encode('utf-8')
        with zipfile.ZipFile(destino, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as novo:
            novo.writestr('manifest.json', texto)
            for nome in sorted(arquivos):
                novo.writestr(nome, arquivos[nome])
    return {'pacote': manifest['pacote'], 'versao': 2, 'listas': len(listas),
            'sha_manifest': hashlib.sha256(texto).hexdigest()}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('origem', type=pathlib.Path)
    parser.add_argument('destino', type=pathlib.Path)
    args = parser.parse_args()
    if args.origem.resolve() == args.destino.resolve() or args.destino.exists():
        raise SystemExit('Escolha destino novo, diferente da origem')
    print(json.dumps(preparar(args.origem, args.destino), ensure_ascii=False))
