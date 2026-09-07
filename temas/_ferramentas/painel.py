# -*- coding: utf-8 -*-
"""
O painel cego das questoes abertas (camada 2 do portao de portugues).

Toda questao ABERTA de tema com catalogo passa por um painel antes de o tema
entrar no banco: tres leitores leem como aluno da serie, um juiz classifica cada
resposta pelo criterio do gabarito e uma lente adversarial procura resposta
defensavel que o criterio deixaria de fora. O portao nao le como aluno: ele
guarda o registro do que o painel viu e confere que ele existe, que e do texto de
hoje e que todas as abertas foram aprovadas.

Quatro verbos:

    python painel.py exportar  <ID>   grava o pacote cego (o que os leitores veem)
    python painel.py criterios <ID>   grava os criterios (o que o juiz e a lente veem)
    python painel.py montar    <ID> --leitores A.json B.json C.json --juiz j.json --lente l.json
    python painel.py conferir  <ID>   a mesma conferencia do portao, sozinha

Opcoes de raiz, iguais as do verificador:

    --temas DIR    outra raiz de temas
    --fontes DIR   outra raiz para a colecao de textos
    --painel DIR   outra raiz para os registros (por padrao temas/<pasta>/_painel)
    --saida DIR    onde exportar e criterios gravam (por padrao uma pasta temporaria)

O pacote cego NAO pode conter gabarito. A ferramenta reprova a si mesma (sai 2)
se a palavra espera_se, aceita_se, nao_aceita ou ancora aparecer nele: um leitor
que enxerga o criterio nao esta lendo como aluno, e o painel inteiro passaria a
nao provar nada.

O registro e dado que fica no repositorio, com as respostas escritas por
extenso: e o que a Nathalia e o Romulo leem para saber o que um aluno modelo
respondeu, e e o que permite reabrir a discussao de um item meses depois.
"""
import io
import os
import sys
import json
import hashlib
import datetime
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import verificar

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# A pasta dos registros fica AO LADO das pastas de serie, em temas/<pasta>/, e
# nao dentro de uma delas: o registro e do tema, e nao da serie. O verificador
# nao pode confundi-la com serie, e por isso arquivos_de_temas ignora pasta que
# comeca por sublinhado.
PASTA_PAINEL = '_painel'

# Os quatro vereditos do juiz. Os dois primeiros sao alcance do criterio; os
# dois ultimos denunciam o item, cada um do seu jeito: `nao_aceita` diz que um
# bom leitor caiu no erro previsto, `fora` diz que o criterio nao alcanca a
# resposta nem para aceitar nem para recusar.
VEREDITOS = ('espera_se', 'aceita_se', 'nao_aceita', 'fora')
VEREDITOS_BONS = ('espera_se', 'aceita_se')
VEREDITOS_DA_LENTE = ('criterio_ok', 'estreito')

# Os modelos do protocolo (PAINEL.md). Ficam gravados no registro para se saber,
# meses depois, quem leu.
MODELOS = {'leitores': 'sonnet', 'juiz': 'sonnet', 'lente': 'fable'}

# O que nunca pode viajar no pacote cego.
PALAVRAS_DE_GABARITO = ('espera_se', 'aceita_se', 'nao_aceita', 'ancora')


class Problema(Exception):
    pass


# ------------------------------------------------------------------ assinatura

def assinatura_do_corpo(corpo):
    """sha256 do que o painel julgou: a lista e o gabarito da secao PT.

    A explicacao e o cabecalho ficam de fora de proposito. O painel le questao,
    e so questao: mudar uma virgula da explicacao nao muda o que o leitor viu,
    e obrigar um painel novo a cada ajuste de texto didatico faria a trava ser
    contornada. Mudar uma virgula do enunciado ou do criterio muda, e ai o
    registro fica velho e o tema volta a nao entrar.
    """
    nomes = verificar.SECOES['pt']
    parte = verificar.secao(corpo, nomes['secao'])
    exerc = verificar.subsecao(parte, nomes['exercicios']) or ''
    gabarito = verificar.subsecao(parte, nomes['gabarito']) or ''
    texto = exerc.strip() + chr(10) + gabarito.strip()
    return hashlib.sha256(texto.encode('utf-8')).hexdigest()


def assinatura_do_tema(caminho):
    """A assinatura de um tema no disco. E esta funcao que o verificador usa."""
    cab, corpo = verificar.ler_tema(caminho)
    return assinatura_do_corpo(corpo)


# --------------------------------------------------------------- as questoes

def questoes_do_corpo(corpo):
    """Toda questao da lista, com o gabarito pareado e o texto que ela usa.

    Le pelo mesmo parser do gerador (verificar.itens_estruturados), para o
    painel julgar exatamente o item que vai para o banco, e nao uma leitura
    parecida.
    """
    nomes = verificar.SECOES['pt']
    parte = verificar.secao(corpo, nomes['secao'])
    eventos = verificar.itens_estruturados(verificar.subsecao(parte, nomes['exercicios']), True)
    eventos_gab = verificar.itens_estruturados(verificar.subsecao(parte, nomes['gabarito']), True)
    itens_gab = [e for e in eventos_gab if e['tipo'] == 'item']

    saida = []
    vigente = None
    posicao = 0
    for evento in eventos:
        if evento['tipo'] == 'texto':
            vigente = evento
            continue
        if evento['tipo'] != 'item':
            continue
        ex = verificar.ler_exercicio(evento['linhas'])
        gab = verificar.ler_gabarito(itens_gab[posicao]['linhas']) if posicao < len(itens_gab) else {}
        posicao += 1
        saida.append({'n': evento['n'], 'enunciado': ex['enunciado'],
                      'alternativas': ex['alternativas'], 'trecho': ex['trecho'],
                      'apoio': vigente, 'gabarito': gab})
    return saida


def abertas_do_corpo(corpo):
    """So as ABERTAS, pela inferencia do gerador: item sem alternativas e aberto.

    A inferencia e uma so no repositorio inteiro. Se o painel usasse outra (a
    presenca de espera_se, por exemplo), um item com gabarito quebrado sairia da
    lista do painel e entraria no banco sem ninguem ter lido.
    """
    return [q for q in questoes_do_corpo(corpo) if not q['alternativas']]


# ------------------------------------------------------------- o pacote cego

def linhas_numeradas(bloco):
    """As linhas do trecho como a folha as imprime: "12| verso".

    O numero e o da fonte, contando so as linhas com texto, e comeca no `a` da
    diretiva. A linha em branco viaja vazia e sem numero, do mesmo jeito que no
    JSON do tablet. E por este numero que o enunciado cita ("linha 12"), entao o
    leitor precisa ve-lo para responder.
    """
    saida = []
    numero = bloco['linhas'][0]
    for linha in bloco['conteudo']:
        if linha.strip() == '':
            saida.append('')
        else:
            saida.append('%d| %s' % (numero, linha))
            numero += 1
    return saida


def _fonte(ident, raiz_fontes=None):
    lida = verificar.fonte_do_catalogo(ident, raiz_fontes)
    if lida is None:
        raise Problema('o tema cita a fonte "%s", que nao existe em fontes/%s.md; '
                       'rode o verificador antes do painel' % (ident, ident))
    return lida[0]


def _credito(ident, raiz_fontes=None):
    """O credito impresso, sem os asteriscos de italico.

    Quem monta o credito e o gerador, e nao esta ferramenta: duas regras de
    citacao em dois arquivos divergiriam. O asterisco sai porque o leitor recebe
    texto puro, e `*Missa do galo*` num prompt e ruido.
    """
    import gerar_banco
    return gerar_banco.credito_da_fonte(_fonte(ident, raiz_fontes)).replace('*', '')


def pacote_cego(caminho, raiz_fontes=None):
    """O que cada leitor recebe: enunciado e texto, nunca o gabarito."""
    cab, corpo = verificar.ler_tema(caminho)
    questoes = []
    for q in abertas_do_corpo(corpo):
        saida = {'n': q['n'], 'enunciado': q['enunciado']}
        if q['apoio']:
            ident = q['apoio']['fonte']
            saida['texto_de_apoio'] = {
                'titulo': _fonte(ident, raiz_fontes)['titulo'],
                'credito': _credito(ident, raiz_fontes),
                'linhas': linhas_numeradas(q['apoio']),
            }
        if q['trecho']:
            ident = q['trecho']['fonte']
            saida['trecho_proprio'] = {
                'credito': _credito(ident, raiz_fontes),
                'linhas': linhas_numeradas(q['trecho']),
            }
        questoes.append(saida)
    return {'tema': cab['id'], 'serie': cab['serie'],
            'assinatura': assinatura_do_corpo(corpo), 'questoes': questoes}


def vazamento_no_pacote(pacote):
    """As palavras de gabarito que apareceram no pacote cego. Vazio e o certo."""
    bruto = json.dumps(pacote, ensure_ascii=False)
    return [palavra for palavra in PALAVRAS_DE_GABARITO if palavra in bruto]


def criterios(caminho):
    """O que o juiz e a lente recebem: o criterio de cada aberta."""
    cab, corpo = verificar.ler_tema(caminho)
    questoes = []
    for q in abertas_do_corpo(corpo):
        gab = q['gabarito']
        questoes.append({'n': q['n'], 'enunciado': q['enunciado'],
                         'espera_se': gab.get('espera_se', ''),
                         'aceita_se': gab.get('aceita_se', []),
                         'nao_aceita': gab.get('nao_aceita', []),
                         'ancora': gab.get('ancora', '')})
    return {'tema': cab['id'], 'assinatura': assinatura_do_corpo(corpo), 'questoes': questoes}


# ---------------------------------------------------------------- o registro

def raiz_do_painel(caminho_do_tema, raiz_painel=None):
    """A pasta dos registros: a dada, ou temas/<pasta>/_painel ao lado das series."""
    if raiz_painel:
        return os.path.abspath(raiz_painel)
    pasta_da_materia = os.path.dirname(os.path.dirname(os.path.abspath(caminho_do_tema)))
    return os.path.join(pasta_da_materia, PASTA_PAINEL)


def caminho_do_registro(caminho_do_tema, raiz_painel=None):
    ident = os.path.splitext(os.path.basename(caminho_do_tema))[0]
    return os.path.join(raiz_do_painel(caminho_do_tema, raiz_painel), '%s.json' % ident)


def _nome_mostrado(caminho_do_tema):
    """temas/por/_painel/POR07-01.json: o caminho como quem le a mensagem o escreve.

    Nao e o caminho absoluto de proposito. A mensagem tem que dizer onde o
    arquivo mora no repositorio, e nao onde a pasta temporaria de uma prova
    estava naquele segundo.
    """
    materia = verificar.materia_do_caminho(caminho_do_tema)
    ident = os.path.splitext(os.path.basename(caminho_do_tema))[0]
    return 'temas/%s/%s/%s.json' % (materia['temas']['pasta'], PASTA_PAINEL, ident)


def problemas_no_registro(registro, corpo, abertas):
    """As conferencias da secao 1.4, sobre um registro ja lido.

    Confere as questoes uma a uma E o resumo. Sao as duas coisas de proposito:
    um registro que so dissesse "aprovadas: [1, 2]" seria uma afirmacao sobre si
    mesmo, e um registro cujas questoes estao boas mas cujo resumo marca uma
    ambigua tambem tem que reprovar, porque alguem escreveu um dos dois errado.
    """
    erros = []
    if registro.get('assinatura') != assinatura_do_corpo(corpo):
        erros.append('o registro do painel e de outra versao do tema (assinatura difere): '
                     'rode o painel de novo')

    por_numero = {}
    for questao in (registro.get('questoes') or []):
        por_numero[questao.get('n')] = questao

    for n in abertas:
        questao = por_numero.get(n)
        if questao is None:
            erros.append('a questao %d nao esta no registro do painel' % n)
            continue
        respostas = questao.get('respostas') or []
        if len(respostas) != 3:
            erros.append('a questao %d tem %d respostas no painel, sao 3' % (n, len(respostas)))
        leitores = [r.get('leitor') for r in respostas]
        if len(set(leitores)) != len(leitores):
            erros.append('a questao %d tem o mesmo leitor duas vezes no painel: %s'
                         % (n, ', '.join(str(l) for l in leitores)))
        for resposta in respostas:
            veredito = resposta.get('veredito')
            if veredito not in VEREDITOS:
                erros.append('a questao %d tem veredito invalido no painel (leitor %s: %s); os '
                             'vereditos sao %s'
                             % (n, resposta.get('leitor'), veredito, ', '.join(VEREDITOS)))
            elif veredito not in VEREDITOS_BONS:
                erros.append('a questao %d esta ambigua no painel (leitor %s: %s)'
                             % (n, resposta.get('leitor'), veredito))
            if not (resposta.get('resposta') or '').strip():
                erros.append('a questao %d tem resposta vazia no painel (leitor %s): o registro '
                             'guarda o que o leitor escreveu' % (n, resposta.get('leitor')))
        lente = questao.get('lente')
        if not isinstance(lente, dict) or lente.get('veredito') not in VEREDITOS_DA_LENTE:
            erros.append('a questao %d nao tem a lente adversarial no painel: ela diz %s'
                         % (n, ' ou '.join(VEREDITOS_DA_LENTE)))
        elif lente.get('veredito') == 'estreito':
            erros.append('a questao %d esta estreita pela lente adversarial' % n)

    resultado = registro.get('resultado') or {}
    for chave in ('ambiguas', 'estreitas'):
        marcadas = sorted(resultado.get(chave) or [])
        if marcadas:
            erros.append('o painel marcou a(s) questao(oes) %s como %s: o tema so entra no banco '
                         'com todas as abertas aprovadas'
                         % (', '.join(str(m) for m in marcadas), chave))
    aprovadas = sorted(resultado.get('aprovadas') or [])
    if aprovadas != sorted(abertas):
        erros.append('o painel aprovou %s e as abertas do tema sao %s'
                     % (aprovadas or 'nenhuma questao', sorted(abertas)))
    return erros


def conferir_registro(caminho_do_tema, raiz_painel=None):
    """A conferencia do portao: [] quando o tema pode entrar no banco.

    E esta funcao que o verificar.py chama, e e a mesma que o verbo `conferir`
    roda sozinho. Uma so, para nao existirem duas conferencias que possam
    discordar.
    """
    materia = verificar.materia_do_caminho(caminho_do_tema)
    if not materia.get('topicos'):
        return []
    cab, corpo = verificar.ler_tema(caminho_do_tema)
    abertas = [q['n'] for q in abertas_do_corpo(corpo)]
    if not abertas:
        return []

    caminho = caminho_do_registro(caminho_do_tema, raiz_painel)
    if not os.path.isfile(caminho):
        return ['falta o registro do painel cego: %s (rode painel.py)'
                % _nome_mostrado(caminho_do_tema)]
    try:
        registro = json.load(io.open(caminho, encoding='utf-8'))
    except ValueError as e:
        return ['o registro do painel nao e JSON valido: %s | %s'
                % (_nome_mostrado(caminho_do_tema), e)]
    if not isinstance(registro, dict):
        return ['o registro do painel nao e um objeto: %s' % _nome_mostrado(caminho_do_tema)]
    return problemas_no_registro(registro, corpo, abertas)


# ----------------------------------------------------------------- montagem

def _ler_json(caminho):
    try:
        return json.load(io.open(caminho, encoding='utf-8'))
    except IOError:
        raise Problema('nao consegui abrir %s' % caminho)
    except ValueError as e:
        raise Problema('%s nao e JSON valido: %s' % (caminho, e))


def ler_leitor(caminho, ident_do_tema):
    """(nome do leitor, {n: resposta}) de um arquivo de leitor.

    Duas formas valem: a de varios temas, com o bloco "temas" mapeando cada
    identificador para a sua lista de respostas, que e o que um agente devolve
    quando leu mais de um tema, e a de um tema so, com a lista direto em
    "respostas". Cada entrada da lista e {"n": numero, "resposta": texto}. As
    duas formas existem porque o fan-out pode ser por tema ou por leitor, e
    obrigar uma delas so faria alguem reescrever o arquivo a mao.
    """
    dados = _ler_json(caminho)
    nome = (dados.get('leitor') or '').strip()
    if not nome:
        raise Problema('%s nao diz quem e o leitor (campo "leitor")' % caminho)
    if 'temas' in dados:
        lista = (dados.get('temas') or {}).get(ident_do_tema)
        if lista is None:
            raise Problema('%s nao tem o tema %s' % (caminho, ident_do_tema))
    else:
        lista = dados.get('respostas')
        if lista is None:
            raise Problema('%s nao tem nem "temas" nem "respostas"' % caminho)
    respostas = {}
    for entrada in lista:
        numero = entrada.get('n')
        if not isinstance(numero, int):
            raise Problema('%s tem uma resposta sem o numero da questao' % caminho)
        if numero in respostas:
            raise Problema('%s responde a questao %d duas vezes' % (caminho, numero))
        respostas[numero] = (entrada.get('resposta') or '').strip()
    return nome, respostas


def ler_juiz(caminho, ident_do_tema):
    """{(n, leitor): (veredito, motivo)} do arquivo do juiz."""
    dados = _ler_json(caminho)
    if 'vereditos' not in dados:
        raise Problema('%s nao tem a lista "vereditos"' % caminho)
    saida = {}
    for entrada in dados['vereditos']:
        if entrada.get('tema') and entrada['tema'] != ident_do_tema:
            continue
        chave = (entrada.get('n'), (entrada.get('leitor') or '').strip())
        saida[chave] = ((entrada.get('veredito') or '').strip(),
                        (entrada.get('motivo') or '').strip())
    return saida


def ler_lente(caminho, ident_do_tema):
    """{n: {veredito, resposta, motivo}} do arquivo da lente adversarial."""
    dados = _ler_json(caminho)
    if 'questoes' not in dados:
        raise Problema('%s nao tem a lista "questoes"' % caminho)
    saida = {}
    for entrada in dados['questoes']:
        if entrada.get('tema') and entrada['tema'] != ident_do_tema:
            continue
        registro = {'veredito': (entrada.get('veredito') or '').strip()}
        for campo in ('resposta', 'motivo'):
            if (entrada.get(campo) or '').strip():
                registro[campo] = entrada[campo].strip()
        saida[entrada.get('n')] = registro
    return saida


def resultado_da_questao(respostas, lente):
    """(resultado, motivo) pela tabela 1.2 da especificacao.

    A ambiguidade vem antes do estreitamento quando as duas aparecem: leitura de
    aluno que cai fora do criterio e a evidencia mais forte sobre o item, e e ela
    que a mensagem tem que mostrar primeiro. As duas barram o tema do mesmo
    jeito, entao a ordem so decide o que se le.
    """
    ruins = [r for r in respostas if r['veredito'] not in VEREDITOS_BONS]
    if ruins:
        return 'ambigua', 'leitor %s: %s' % (ruins[0]['leitor'], ruins[0]['veredito'])
    if lente.get('veredito') == 'estreito':
        return 'estreita', ''
    return 'aprovada', ''


def montar(caminho_do_tema, arquivos_de_leitores, arquivo_do_juiz, arquivo_da_lente, data=None):
    """Valida os arquivos do painel, calcula os resultados e devolve o registro."""
    cab, corpo = verificar.ler_tema(caminho_do_tema)
    ident = cab['id']
    abertas = abertas_do_corpo(corpo)
    if not abertas:
        raise Problema('o tema %s nao tem questao aberta: nao ha painel a montar' % ident)

    if len(arquivos_de_leitores) != 3:
        raise Problema('o painel tem tres leitores, e vieram %d arquivos'
                       % len(arquivos_de_leitores))
    leituras = []
    for caminho in arquivos_de_leitores:
        leituras.append(ler_leitor(caminho, ident))
    nomes = [nome for nome, _ in leituras]
    if len(set(nomes)) != 3:
        raise Problema('os tres leitores tem que ser distintos, e vieram: %s'
                       % ', '.join(nomes))

    vereditos = ler_juiz(arquivo_do_juiz, ident)
    lentes = ler_lente(arquivo_da_lente, ident)

    questoes = []
    for aberta in abertas:
        n = aberta['n']
        respostas = []
        for nome, ditas in leituras:
            if n not in ditas:
                raise Problema('o leitor %s nao respondeu a questao %d' % (nome, n))
            if not ditas[n]:
                raise Problema('o leitor %s deixou a questao %d em branco' % (nome, n))
            if (n, nome) not in vereditos:
                raise Problema('o juiz nao classificou a resposta do leitor %s na questao %d'
                               % (nome, n))
            veredito, motivo = vereditos[(n, nome)]
            if veredito not in VEREDITOS:
                raise Problema('o juiz deu o veredito "%s" na questao %d (leitor %s); os '
                               'vereditos sao %s' % (veredito, n, nome, ', '.join(VEREDITOS)))
            registro = {'leitor': nome, 'resposta': ditas[n], 'veredito': veredito}
            if motivo:
                registro['motivo'] = motivo
            respostas.append(registro)
        if n not in lentes:
            raise Problema('a lente adversarial nao olhou a questao %d' % n)
        lente = lentes[n]
        if lente['veredito'] not in VEREDITOS_DA_LENTE:
            raise Problema('a lente deu o veredito "%s" na questao %d; ela diz %s'
                           % (lente['veredito'], n, ' ou '.join(VEREDITOS_DA_LENTE)))
        resultado, motivo = resultado_da_questao(respostas, lente)
        questoes.append({'n': n, 'respostas': respostas, 'lente': lente,
                         'resultado': resultado, 'motivo': motivo})

    registro = {
        'tema': ident,
        'assinatura': assinatura_do_corpo(corpo),
        'data': data or datetime.date.today().isoformat(),
        'modelos': dict(MODELOS),
        'questoes': [{'n': q['n'], 'respostas': q['respostas'], 'lente': q['lente'],
                      'resultado': q['resultado']} for q in questoes],
        'resultado': {
            'aprovadas': [q['n'] for q in questoes if q['resultado'] == 'aprovada'],
            'ambiguas': [q['n'] for q in questoes if q['resultado'] == 'ambigua'],
            'estreitas': [q['n'] for q in questoes if q['resultado'] == 'estreita'],
        },
    }
    return registro, questoes


def gravar_registro(caminho_do_tema, registro, raiz_painel=None):
    """Grava temas/<pasta>/_painel/<ID>.json, com recuo: e dado que se le."""
    caminho = caminho_do_registro(caminho_do_tema, raiz_painel)
    pasta = os.path.dirname(caminho)
    if not os.path.isdir(pasta):
        os.makedirs(pasta)
    io.open(caminho, 'w', encoding='utf-8', newline=chr(10)).write(
        json.dumps(registro, ensure_ascii=False, indent=2) + chr(10))
    return caminho


# ------------------------------------------------------------- linha de comando

def _tirar_opcao(args, nome):
    """O valor que segue --nome, retirado da lista; None quando nao veio."""
    if nome not in args:
        return None
    i = args.index(nome)
    valor = args[i + 1] if i + 1 < len(args) else None
    del args[i:i + 2]
    return valor


def _tirar_lista(args, nome):
    """Os valores que seguem --nome ate a proxima opcao, retirados da lista."""
    if nome not in args:
        return []
    i = args.index(nome)
    j = i + 1
    while j < len(args) and not args[j].startswith('--'):
        j += 1
    valores = args[i + 1:j]
    del args[i:j]
    return valores


def achar_tema(ident, raiz=None):
    """O caminho do tema com aquele identificador, em qualquer materia com tema."""
    for caminho in verificar.arquivos_de_temas(raiz):
        if os.path.splitext(os.path.basename(caminho))[0] == ident:
            return caminho
    raise Problema('nao achei o tema %s em %s' % (ident, raiz or RAIZ))


def _gravar_pacote(pasta, ident, sufixo, dados):
    if not os.path.isdir(pasta):
        os.makedirs(pasta)
    caminho = os.path.join(pasta, '%s.%s.json' % (ident, sufixo))
    io.open(caminho, 'w', encoding='utf-8', newline=chr(10)).write(
        json.dumps(dados, ensure_ascii=False, indent=2) + chr(10))
    return caminho


def main():
    args = sys.argv[1:]
    raiz = _tirar_opcao(args, '--temas')
    raiz = os.path.abspath(raiz) if raiz else None
    fontes = _tirar_opcao(args, '--fontes')
    if fontes:
        verificar.RAIZ_FONTES = os.path.abspath(fontes)
    raiz_painel = _tirar_opcao(args, '--painel')
    saida = _tirar_opcao(args, '--saida')
    data = _tirar_opcao(args, '--data')
    leitores = _tirar_lista(args, '--leitores')
    juiz = _tirar_opcao(args, '--juiz')
    lente = _tirar_opcao(args, '--lente')

    if len(args) < 2 or args[0] not in ('exportar', 'criterios', 'montar', 'conferir'):
        print(__doc__.strip())
        return 2
    verbo, ident = args[0], args[1]

    try:
        caminho = achar_tema(ident, raiz)
    except (Problema, verificar.Problema) as e:
        print('%s' % e)
        return 2

    try:
        if verbo == 'exportar':
            pacote = pacote_cego(caminho, verificar.RAIZ_FONTES)
            vazou = vazamento_no_pacote(pacote)
            if vazou:
                print('o pacote cego de %s traz palavra de gabarito: %s. O leitor nao pode ver o '
                      'criterio, senao o painel nao prova nada.' % (ident, ', '.join(vazou)))
                return 2
            pasta = saida or tempfile.mkdtemp(prefix='painel_')
            destino = _gravar_pacote(pasta, ident, 'pacote', pacote)
            print('pacote cego de %s: %d questao(oes) aberta(s)' % (ident, len(pacote['questoes'])))
            print('  %s' % destino)
            print('  sem gabarito: nenhuma das palavras %s aparece nele'
                  % ', '.join(PALAVRAS_DE_GABARITO))
            return 0

        if verbo == 'criterios':
            dados = criterios(caminho)
            pasta = saida or tempfile.mkdtemp(prefix='painel_')
            destino = _gravar_pacote(pasta, ident, 'criterios', dados)
            print('criterios de %s: %d questao(oes) aberta(s)' % (ident, len(dados['questoes'])))
            print('  %s' % destino)
            return 0

        if verbo == 'montar':
            if not leitores or not juiz or not lente:
                print('montar precisa de --leitores A.json B.json C.json --juiz j.json '
                      '--lente l.json')
                return 2
            registro, questoes = montar(caminho, leitores, juiz, lente, data)
            destino = gravar_registro(caminho, registro, raiz_painel)
            for questao in questoes:
                if questao['motivo']:
                    print('  %d: %s (%s)' % (questao['n'], questao['resultado'], questao['motivo']))
                else:
                    print('  %d: %s' % (questao['n'], questao['resultado']))
            contas = registro['resultado']
            print('%d aprovadas, %d ambiguas, %d estreitas.'
                  % (len(contas['aprovadas']), len(contas['ambiguas']), len(contas['estreitas'])))
            print('registro em %s' % destino)
            return 0 if not contas['ambiguas'] and not contas['estreitas'] else 1

        erros = conferir_registro(caminho, raiz_painel)
        if erros:
            print('REPROVADO %s' % ident)
            for erro in erros:
                print('    %s' % erro)
            return 1
        print('ok        %s: o painel cego aprovou todas as abertas' % ident)
        return 0
    except (Problema, verificar.Problema) as e:
        print('%s' % e)
        return 2


if __name__ == '__main__':
    sys.exit(main())
