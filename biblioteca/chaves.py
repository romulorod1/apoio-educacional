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
com UMA candidata ainda livre:
  1. o mesmo título normalizado (sem acento, sem caixa, sem espaço duplo);
  2. o par da tabela de herança (meta.heranca_titulos): o título antigo da
     entrada velha e o título novo da entrada nova;
  3. o mesmo começo (página no PDF; capítulo e âncora no EPUB) E título
     parecido (semelhança das palavras de pelo menos SEMELHANCA_MINIMA) ou o
     par da herança. O mesmo começo sozinho NÃO basta: um capítulo trocado
     que começa na mesma página ganha chave nova.
Sem candidata, chave nova. A chave nova é curta e determinística (o mesmo
livro e a mesma entrada dão a mesma chave), e nunca repete uma do registro.

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
    relatório do publicador os lista para a orquestradora conferir)."""
    antigas = [dict(a) for a in ((registro_antigo or {}).get('entradas') or []) if a.get('chave')]
    usadas = {a['chave'] for a in antigas}
    livres = list(antigas)
    pares = pares_da_heranca(heranca)
    saida = [dict(e) for e in mapa or []]
    sem = list(range(len(saida)))

    def tomar(i, a):
        saida[i]['chave'] = a['chave']
        livres.remove(a)

    def passo(criterio):
        for i in list(sem):
            e = saida[i]
            cands = [a for a in livres if criterio(a, e)]
            if len(cands) == 1:
                tomar(i, cands[0])
                sem.remove(i)

    herda = lambda a, e: (titulo_normalizado(a.get('titulo')), titulo_normalizado(e.get('titulo'))) in pares
    passo(lambda a, e: titulo_normalizado(a.get('titulo')) == titulo_normalizado(e.get('titulo')))
    passo(herda)
    passo(lambda a, e: comeco(a) is not None and comeco(a) == comeco(e) and
          (semelhanca(a.get('titulo'), e.get('titulo')) >= SEMELHANCA_MINIMA or herda(a, e)))
    novas = []
    for i in sem:
        c = chave_nova(livro_id, saida[i], usadas)
        usadas.add(c)
        saida[i]['chave'] = c
        if antigas:
            novas.append(saida[i].get('titulo'))
    registro = {'livro': livro_id, 'entradas': [
        {k: e.get(k) for k in ('chave', 'titulo', 'pagina', 'capitulo', 'ancora') if e.get(k) is not None} for e in saida]}
    return saida, registro, novas
