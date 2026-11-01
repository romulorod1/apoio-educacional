"""Prepara nova versão dos pacotes Mirim com as listas declaradas no manifest."""
import argparse
import hashlib
import json
import pathlib
import re
import zipfile


def ler_exclusoes(relatorio, pacote):
    texto = pathlib.Path(relatorio).read_text(encoding='utf-8-sig')
    cabecalho = '## ' + pacote + ', versão 1'
    if cabecalho not in texto:
        raise ValueError('Relatório do pacote não encontrado')
    secao = texto.split(cabecalho, 1)[1].split('\n## ', 1)[0]
    linhas = re.findall(r'^\| `([^`]+)` \| (.+?) \|\s*$', secao, re.MULTILINE)
    return sorted(({'id': i, 'motivo': motivo} for i, motivo in linhas), key=lambda x: x['id'])


def preparar(origem, destino, relatorio):
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
        excluidos = ler_exclusoes(relatorio, manifest['pacote'])
        ids = [e['id'] for e in excluidos]
        if len(ids) != manifest['contagens']['itens_excluidos'] or len(set(ids)) != len(ids):
            raise ValueError('Relatório de exclusões incompleto ou com IDs repetidos')
        itens = json.loads(arquivos['itens.json'])
        if set(ids) & {i['id'] for i in itens}:
            raise ValueError('Exclusão também consta nos itens')
        arquivos['exclusoes.json'] = (json.dumps(excluidos, ensure_ascii=False, indent=1) + '\n').encode('utf-8')
        manifest['versao'] = 2
        manifest['arquivos']['kits.json'] = 'sha256:' + hashlib.sha256(arquivos['kits.json']).hexdigest()
        manifest['arquivos']['exclusoes.json'] = 'sha256:' + hashlib.sha256(arquivos['exclusoes.json']).hexdigest()
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
    parser.add_argument('relatorio', type=pathlib.Path)
    args = parser.parse_args()
    if args.origem.resolve() == args.destino.resolve() or args.destino.exists():
        raise SystemExit('Escolha destino novo, diferente da origem')
    print(json.dumps(preparar(args.origem, args.destino, args.relatorio), ensure_ascii=False))
