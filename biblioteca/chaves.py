"""A chave estável de cada capítulo do mapa (fase 1b da biblioteca na nuvem).

A correção da Nathália no mapa (db.ajustes.mapaDosLivros, no aplicativo) segue
o capítulo pela `chave` (biblioteca.js, resolverCorrecoes, passo 1), e só
quando o título bate (normalizado) ou quando o par título antigo e título novo
está na tabela de herança do livro (e ainda pede um assunto em comum). Por
isso a chave daqui só passa de uma geração para a outra pelos MESMOS
critérios que o aplicativo confere; um caminho que o aplicativo não confere
seria uma chave herdada que move a correção dela calada.

Registro por livro, guardado pelo publicador em Livros/mapa/_chaves/<id>.json:
    {"livro": "<id>", "entradas": [{"chave", "titulo", "pagina", "capitulo", "ancora"}]}

A entrada nova herda a chave de uma entrada antiga, nesta ordem, cada passo só
quando a candidata é ÚNICA dos dois lados (uma antiga e uma nova):
  1. o mesmo título normalizado (sem acento, sem caixa, sem espaço duplo) E o
     mesmo começo (página no PDF; capítulo e âncora no EPUB), em grupos do
     mesmo tamanho dos dois lados, casados em ordem: o título repetido no
     mesmo começo, ou sem começo, fica estável de uma rodada para a outra;
  2. o mesmo título normalizado, só quando ele é ÚNICO no mapa antigo E no
     novo: um segundo "Exercícios" que nasce em outra página não leva a chave
     do primeiro, que mudaria de capítulo a correção dela;
  3. o par da tabela de herança (meta.heranca_titulos): o título antigo da
     entrada velha e o título novo da entrada nova;
  4. o mesmo começo E título parecido (semelhança das palavras de pelo menos
     SEMELHANCA_MINIMA) ou o par da herança. O mesmo começo sozinho NÃO
     basta: um capítulo trocado que começa na mesma página ganha chave nova.
     (Limite conhecido: no limite de 0,50, "Unidade 3: Frações" e "Unidade 3:
     Geometria" herdam; o aplicativo só segue a chave com o título igual ou
     com o par da herança, então ali a correção vira sugestão.)
Sem candidata, chave nova, listada no relatório. A chave nova é curta e
determinística (o mesmo livro e a mesma entrada dão a mesma chave), e nunca
repete uma do registro.

Nada aqui lê ou grava arquivo: quem lê e grava o registro é o publicador.
"""
import hashlib
import re
import unicodedata

SEMELHANCA_MINIMA = 0.5
PALAVRAS_VAZIAS = {'de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'as', 'os', 'em', 'na', 'no', 'nas', 'nos',
                   'um', 'uma', 'com', 'por', 'para', 'ao', 'aos', 'the', 'of', 'and'}


def titulo_normalizado(t):
    """O mesmo critério de biblioteca.js (tituloNormalizado)."""
    s = unicodedata.normalize('NFD', str(t or ''))
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'\s+', ' ', s.lower()).strip()


def palavras(t):
    return {p for p in re.split(r'[^a-z0-9]+', titulo_normalizado(t)) if len(p) > 2 and p not in PALAVRAS_VAZIAS}


def semelhanca(a, b):
    pa, pb = palavras(a), palavras(b)
    if not pa or not pb:
        return 0.0
    return 2.0 * len(pa & pb) / (len(pa) + len(pb))


def comeco(e):
    """O começo da entrada: a página (PDF) ou o capítulo e a âncora (EPUB)."""
    if e.get('pagina') is not None:
        return ('p', e.get('pagina'))
    if e.get('capitulo') is not None:
        return ('c', e.get('capitulo'), e.get('ancora') or None)
    return None


def pares_da_heranca(heranca):
    return {(titulo_normalizado(h.get('titulo_antigo')), titulo_normalizado(h.get('titulo_novo')))
            for h in heranca or [] if h and h.get('titulo_antigo') and h.get('titulo_novo')}


def chave_nova(livro_id, entrada, usadas):
    base = '%s|%s|%s' % (livro_id, titulo_normalizado(entrada.get('titulo')), comeco(entrada))
    for i in range(1000):
        c = 'c' + hashlib.sha256(('%s|%d' % (base, i)).encode('utf-8')).hexdigest()[:6]
        if c not in usadas:
            return c
    raise ValueError('não achei chave livre para ' + livro_id)


def estabilizar(livro_id, mapa, registro_antigo=None, heranca=None):
    """Dá a `chave` a cada entrada do mapa (uma cópia; o mapa de entrada não
    muda). Devolve (mapa_com_chave, registro_novo, novas): `novas` são os
    títulos que ganharam chave nova num livro que já tinha registro (o
    relatório do publicador os lista para a orquestradora conferir).

    Os passos, cada um só quando a candidata é ÚNICA dos dois lados (uma
    entrada antiga e uma nova; com mais de uma, o passo não decide):
      1. o mesmo título E o mesmo começo: as entradas de cada par (título,
         começo) se casam em ordem, quando o antigo e o novo têm o mesmo
         número delas (o título repetido no mesmo começo, ou sem começo, fica
         estável de uma rodada para a outra);
      2. o mesmo título, quando ele é único no mapa antigo E no novo (um
         segundo "Exercícios" que nasce em outra página não leva a chave do
         primeiro);
      3. o par da tabela de herança;
      4. o mesmo começo com título parecido (ou o par da herança).
    O que sobra ganha chave nova, determinística, e é listado."""
    antigas = [dict(a) for a in ((registro_antigo or {}).get('entradas') or []) if a.get('chave')]
    usadas = {a['chave'] for a in antigas}
    pares = pares_da_heranca(heranca)
    saida = [dict(e) for e in mapa or []]
    tn = lambda x: titulo_normalizado(x.get('titulo'))
    livres = list(range(len(antigas)))     # índices das antigas ainda sem dono
    sem = list(range(len(saida)))          # índices das novas ainda sem chave

    def tomar(i, j):
        saida[i]['chave'] = antigas[j]['chave']
        livres.remove(j)
        sem.remove(i)

    # 1. o mesmo título e o mesmo começo, em grupos do mesmo tamanho, em ordem
    grupos_n, grupos_a = {}, {}
    for i in sem:
        grupos_n.setdefault((tn(saida[i]), comeco(saida[i])), []).append(i)
    for j in livres:
        grupos_a.setdefault((tn(antigas[j]), comeco(antigas[j])), []).append(j)
    for k, novos in grupos_n.items():
        velhos = grupos_a.get(k) or []
        if velhos and len(velhos) == len(novos):
            for i, j in zip(list(novos), list(velhos)):
                tomar(i, j)

    def passo(criterio):
        for i in list(sem):
            cands = [j for j in livres if criterio(antigas[j], saida[i])]
            if len(cands) != 1:
                continue
            j = cands[0]
            # e a antiga também só serve a esta nova
            if sum(1 for i2 in sem if criterio(antigas[j], saida[i2])) != 1:
                continue
            tomar(i, j)

    conta_a, conta_n = {}, {}
    for a in antigas:
        conta_a[tn(a)] = conta_a.get(tn(a), 0) + 1
    for e in saida:
        conta_n[tn(e)] = conta_n.get(tn(e), 0) + 1
    herda = lambda a, e: (tn(a), tn(e)) in pares
    # 2. o mesmo título, único no antigo e no novo
    passo(lambda a, e: tn(a) == tn(e) and conta_a.get(tn(a)) == 1 and conta_n.get(tn(e)) == 1)
    # 3. o par da herança
    passo(herda)
    # 4. o mesmo começo, com título parecido ou o par da herança
    passo(lambda a, e: comeco(a) is not None and comeco(a) == comeco(e) and
          (semelhanca(a.get('titulo'), e.get('titulo')) >= SEMELHANCA_MINIMA or herda(a, e)))
    novas = []
    for i in sorted(sem):
        c = chave_nova(livro_id, saida[i], usadas)
        usadas.add(c)
        saida[i]['chave'] = c
        if antigas:
            novas.append(saida[i].get('titulo'))
    registro = {'livro': livro_id, 'entradas': [
        {k: e.get(k) for k in ('chave', 'titulo', 'pagina', 'capitulo', 'ancora') if e.get(k) is not None} for e in saida]}
    return saida, registro, novas
