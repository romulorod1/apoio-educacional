# -*- coding: utf-8 -*-
"""
Camada 3: o portao de portugues reprova a si mesmo.

As camadas 1 e 2 sao travas dentro do verificador. Esta bateria nao chama funcao
nenhuma delas: ela monta, numa pasta temporaria, um tema saudavel com fonte e
registro de painel ao lado de um tema envenenado, e roda o CAMINHO REAL, pela
linha de comando, com o mesmo python que a esta executando:

    verificar.py --temas <tmp> --fontes <tmp>/fontes --painel <tmp>/por/_painel
    gerar_banco.py --so portugues --temas <tmp> --saida <tmp>/saida --fontes ... --painel ...

Para cada veneno exige seis coisas: que o verificador reprove o tema envenenado,
que a mensagem seja a do defeito plantado (e nao outra qualquer), que ele aprove
o saudavel na mesma rodada, que o banco gerado NAO traga o envenenado, que traga
o saudavel, e que o gerador diga por que o envenenado ficou de fora.

A diferenca entre isto e o testa_verificador.py e a distancia: la a prova e
sobre a funcao conferir, aqui e sobre o que acontece quando alguem digita o
comando. Uma trava pode estar perfeita e nao estar ligada na linha de comando, e
foi assim que o proprio testa_verificador.py ficou anos fora do portao.

Os seis venenos sao os da secao 2 da especificacao da Fase 3: excerto com uma
palavra trocada, ancora que nao esta no texto, gabarito estreito pelo painel,
codigo BNCC inexistente, autor morto em 1970 e assinatura de painel velha.

A pasta temporaria e apagada no finally, aconteca o que acontecer.
"""
import io
import os
import sys
import json
import shutil
import tempfile
import subprocess

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import verificar
import painel

VERIFICAR = os.path.join(AQUI, 'verificar.py')
GERAR = os.path.join(AQUI, 'gerar_banco.py')

# O ano em que a conta do dominio publico e feita, fixo nos dois comandos. Um
# veneno de dominio escrito com o relogio deixaria de reprovar sozinho no dia em
# que a obra caisse em dominio publico, e a bateria viraria alarme falso.
ANO_DAS_PROVAS = 2026

SAUDAVEL = 'POR07-98'
VENENO = 'POR07-97'

# A fonte que os dois temas citam: dominio publico pela conta, autor morto em
# 1908, com procedencia.
FONTE_CONTO = u"""---
id: machado-de-assis_missa-do-galo
titulo: Missa do galo
autor: Machado de Assis
autor_morte: 1908
obra: Páginas recolhidas
ano: 1899
genero: conto
dominio: publico
licenca: domínio público, Lei 9.610/98 art. 41
procedencia: Wikisource, cópia consultada em 08/09/2026, https://pt.wikisource.org/
integral: nao
---

Nunca pude entender a conversação que tive com uma senhora, há muitos
anos, contava eu dezessete, ela trinta. Era noite de Natal.

Havendo ajustado com um vizinho irmos à missa do galo, preferi não
dormir; combinei que eu iria acordá-lo à meia-noite, e fui bater à
porta dele na hora certa.
"""

# A mesma cinco linhas, com um cabecalho que a colecao reprova: autor morto em
# 1970, ainda protegido em 2026 pela conta da Lei 9.610/98. O corpo e igual de
# proposito, para o veneno do dominio ser uma linha so no tema (a troca do id na
# diretiva) e nao arrastar junto uma diferenca de excerto, de ancora ou de
# numero de linha. Veneno que dispara duas travas nao prova nenhuma das duas.
FONTE_PROTEGIDA = FONTE_CONTO.replace(
    'id: machado-de-assis_missa-do-galo', 'id: autor-recente_conto-protegido').replace(
    'titulo: Missa do galo', 'titulo: Conto ainda protegido').replace(
    'autor: Machado de Assis', 'autor: Autor Recente').replace(
    'autor_morte: 1908', 'autor_morte: 1970')

# A colecao de cada caso. A fonte protegida so entra na pasta do caso que a usa:
# se ela estivesse em todas, o verificador imprimiria REPROVADO para o arquivo
# dela em todas as rodadas, e o caso de controle (o que nao tem veneno nenhum)
# nao teria como afirmar que nada foi reprovado.
FONTES = {'machado-de-assis_missa-do-galo': FONTE_CONTO}
FONTES_COM_PROTEGIDA = dict(FONTES)
FONTES_COM_PROTEGIDA['autor-recente_conto-protegido'] = FONTE_PROTEGIDA

# O tema saudavel: um texto de apoio, duas abertas e uma fechada. Uma fechada so,
# de proposito: com quatro ou mais a trava de letra concentrada entraria em cena
# e a bateria passaria a provar duas coisas ao mesmo tempo.
TEMA = u"""---
id: POR07-98
serie: 07
unidade: leitura
titulo_pt: O narrador que lembra de longe
resumo_pt: Como o intervalo entre o fato e a lembrança muda o que o narrador conta.
prerequisitos: []
topicos: [POR07-T01]
bncc: [EF67LP28]
vestibular: []
duracao_min: 60
dificuldade: 2
---

## PT

### Explicação

O narrador de primeira pessoa conta o que viveu, mas conta *depois*. Entre o
fato e a lembrança há um intervalo, e é nele que mora a dúvida.

### Exercícios

@fonte machado-de-assis_missa-do-galo linhas=1-5
> Nunca pude entender a conversação que tive com uma senhora, há muitos
> anos, contava eu dezessete, ela trinta. Era noite de Natal.
>
> Havendo ajustado com um vizinho irmos à missa do galo, preferi não
> dormir; combinei que eu iria acordá-lo à meia-noite, e fui bater à
> porta dele na hora certa.

1. Explique por que a lembrança do narrador vem acompanhada de dúvida.
2. Na linha 2, a expressão "contava eu dezessete" indica
   a) o valor da conta que o narrador pagou naquela noite.
   b) a idade que o narrador tinha na noite descrita.
   c) o número de convidados que estavam na ceia.
   d) a hora em que a missa do galo começou.
3. Nas linhas 3 a 5, o narrador conta um combinado. Diga qual é.

### Gabarito

1. espera_se: que o aluno perceba que o narrador conta a história muitos anos
   depois, já adulto, e por isso a lembrança vem com dúvida.
   aceita_se:
   - dizer que ele era jovem na época e escreve mais velho
   - apontar a distância de tempo sem falar em idade
   nao_aceita:
   - dizer que a história acontece no presente
   - dizer que o narrador tem trinta anos
   ancora: Nunca pude entender a conversação que tive com uma senhora, há muitos anos
2. b
   ancora: contava eu dezessete, ela trinta
   porque: "contar anos" é ter idade, e a frase compara as duas idades.
3. espera_se: que o aluno diga que os dois combinaram ir juntos à missa do galo
   e que o narrador ficaria acordado para chamar o vizinho na hora.
   aceita_se:
   - dizer que ele iria acordar o vizinho à meia-noite
   - dizer que preferiu não dormir para não perder a hora
   nao_aceita:
   - dizer que o vizinho é que iria acordá-lo
   - dizer que os dois foram dormir cedo
   ancora: Havendo ajustado com um vizinho irmos à missa do galo, preferi não dormir
"""


def _troca(texto, de, para):
    if de not in texto:
        raise SystemExit('a bateria esta desatualizada: nao achei "%s" no tema' % de[:60])
    return texto.replace(de, para)


# ---------------------------------------------------------------- os venenos

def veneno_excerto(texto):
    """1. Uma palavra trocada no excerto: o bloco deixa de ser copia da fonte."""
    return _troca(texto, '> anos, contava eu dezessete, ela trinta. Era noite de Natal.',
                  '> anos, contava eu dezessete, ela trinta. Era noite de festa.')


def veneno_ancora(texto):
    """2. Ancora que nao esta no texto do item."""
    return _troca(texto, '   ancora: Havendo ajustado com um vizinho irmos à missa do galo, '
                         'preferi não dormir',
                  '   ancora: e o vizinho ficou de bater à porta antes da meia-noite')


def veneno_bncc(texto):
    """4. Codigo com a forma certa e que nao existe na tabela da Base."""
    return _troca(texto, 'bncc: [EF67LP28]', 'bncc: [EF67LP99]')


def veneno_dominio(texto):
    """5. O mesmo excerto, agora atribuido a um autor morto em 1970."""
    return _troca(texto, '@fonte machado-de-assis_missa-do-galo linhas=1-5',
                  '@fonte autor-recente_conto-protegido linhas=1-5')


def veneno_virgula(texto):
    """6. Uma virgula a mais no enunciado, depois de o painel ter assinado."""
    return _troca(texto, '3. Nas linhas 3 a 5, o narrador conta um combinado.',
                  '3. Nas linhas 3 a 5, o narrador, conta um combinado.')


def registro_estreito(registro):
    """3. O painel achou o criterio estreito na primeira aberta."""
    registro['questoes'][0]['lente'] = {
        'veredito': 'estreito',
        'resposta': 'que o narrador nao sabe se a conversa foi mesmo daquele jeito',
        'motivo': 'o criterio previu a distancia de tempo e nao a duvida sobre o proprio fato'}
    registro['questoes'][0]['resultado'] = 'estreita'
    registro['resultado']['aprovadas'] = [q['n'] for q in registro['questoes']
                                          if q['resultado'] == 'aprovada']
    registro['resultado']['estreitas'] = [registro['questoes'][0]['n']]
    return registro


# (nome, estraga o texto, estraga o registro, assina antes de estragar, mensagem
#  esperada, colecao de fontes do caso)
VENENOS = [
    ('excerto com uma palavra trocada', veneno_excerto, None, False,
     'nao e copia exata', FONTES),
    ('ancora que nao esta no texto', veneno_ancora, None, False,
     'nao esta no texto do item', FONTES),
    ('gabarito estreito pela lente do painel', None, registro_estreito, False,
     'estreita pela lente adversarial', FONTES),
    ('codigo BNCC inexistente', veneno_bncc, None, False,
     'nao existe na tabela da BNCC', FONTES),
    ('autor morto em 1970', veneno_dominio, None, False,
     'esta reprovada', FONTES_COM_PROTEGIDA),
    ('assinatura: o tema mudou depois de o painel assinar', veneno_virgula, None, True,
     'assinatura difere', FONTES),
]


# ------------------------------------------------------------------- montagem

def _gravar(caminho, texto):
    pasta = os.path.dirname(caminho)
    if not os.path.isdir(pasta):
        os.makedirs(pasta)
    io.open(caminho, 'w', encoding='utf-8', newline=chr(10)).write(texto)
    return caminho


def registro_saudavel(caminho):
    """O registro que um painel sem sobressalto deixaria, assinado pela ferramenta."""
    cab, corpo = verificar.ler_tema(caminho)
    abertas = [q['n'] for q in painel.abertas_do_corpo(corpo)]
    questoes = [
        {'n': n,
         'respostas': [{'leitor': letra, 'resposta': 'o que o leitor %s respondeu' % letra,
                        'veredito': 'espera_se'} for letra in ('A', 'B', 'C')],
         'lente': {'veredito': 'criterio_ok'},
         'resultado': 'aprovada'}
        for n in abertas
    ]
    return {'tema': cab['id'], 'assinatura': painel.assinatura_do_corpo(corpo),
            'data': '2026-09-08', 'modelos': dict(painel.MODELOS),
            'questoes': questoes,
            'resultado': {'aprovadas': abertas, 'ambiguas': [], 'estreitas': []}}


def montar_caso(raiz, estragar_texto, estragar_registro, assinar_antes, fontes=None):
    """Monta <raiz>/ com as fontes, o tema saudavel e o envenenado, e os registros.

    O registro do envenenado e assinado DEPOIS da alteracao do texto, salvo no
    veneno da assinatura, que e exatamente o caso em que o painel assinou uma
    versao e o tema mudou em seguida. Sem essa distincao, todo veneno de texto
    reprovaria tambem por assinatura velha e nenhum deles provaria a sua trava.
    """
    for ident, texto in sorted((fontes or FONTES).items()):
        _gravar(os.path.join(raiz, 'fontes', '%s.md' % ident), texto)

    caminho_bom = _gravar(os.path.join(raiz, 'por', '07', '%s.md' % SAUDAVEL), TEMA)
    painel.gravar_registro(caminho_bom, registro_saudavel(caminho_bom))

    original = _troca(TEMA, 'id: %s' % SAUDAVEL, 'id: %s' % VENENO)
    estragado = estragar_texto(original) if estragar_texto else original
    caminho_mau = os.path.join(raiz, 'por', '07', '%s.md' % VENENO)

    _gravar(caminho_mau, original if assinar_antes else estragado)
    registro = registro_saudavel(caminho_mau)
    if estragar_registro:
        registro = estragar_registro(registro)
    painel.gravar_registro(caminho_mau, registro)
    if assinar_antes:
        _gravar(caminho_mau, estragado)
    return caminho_bom, caminho_mau


def _ambiente():
    """O ambiente do filho, com a saida forcada em utf-8.

    No Windows o python escreve num cano com a codificacao do console (cp1252),
    e a primeira mensagem de erro com acento chegava aqui como byte invalido: a
    leitura da saida morria e o texto vinha VAZIO, entao o exame concluia que o
    portao nao tinha reprovado nada. E a mentira mais perigosa que esta bateria
    poderia contar, porque ela mente na direcao de aprovar.
    """
    ambiente = dict(os.environ)
    ambiente['PYTHONIOENCODING'] = 'utf-8'
    return ambiente


def _rodar(comando):
    """A saida de um comando, com o erro junto: o defeito pode sair pelos dois."""
    saida = subprocess.run(comando, capture_output=True, text=True,
                           encoding='utf-8', errors='replace', env=_ambiente())
    return (saida.stdout or '') + (saida.stderr or '')


def rodar_verificador(raiz):
    return _rodar([sys.executable, VERIFICAR,
                   '--temas', raiz,
                   '--fontes', os.path.join(raiz, 'fontes'),
                   '--painel', os.path.join(raiz, 'por', painel.PASTA_PAINEL),
                   '--ano', str(ANO_DAS_PROVAS)])


def rodar_gerador(raiz):
    return _rodar([sys.executable, GERAR, '--so', 'portugues',
                   '--temas', raiz,
                   '--saida', os.path.join(raiz, 'saida'),
                   '--fontes', os.path.join(raiz, 'fontes'),
                   '--painel', os.path.join(raiz, 'por', painel.PASTA_PAINEL),
                   '--ano', str(ANO_DAS_PROVAS)])


def ids_no_banco(raiz):
    """Os temas que entraram no arquivo da serie 07 do banco gerado."""
    caminho = os.path.join(raiz, 'saida', 'banco', 'portugues', 'serie-07.json')
    if not os.path.isfile(caminho):
        return []
    dados = json.load(io.open(caminho, encoding='utf-8'))
    return sorted(t['id'] for t in dados.get('temas', []))


def _linha_de(saida, comeco):
    for linha in saida.split(chr(10)):
        if linha.startswith(comeco):
            return linha
    return None


def _bloco_do_reprovado(saida, ident):
    """As linhas de erro impressas logo abaixo de "  REPROVADO <ID>.md"."""
    linhas = saida.split(chr(10))
    for i, linha in enumerate(linhas):
        if linha.startswith('  REPROVADO %s.md' % ident):
            bloco = [linha]
            for seguinte in linhas[i + 1:]:
                if not seguinte.startswith('      '):
                    break
                bloco.append(seguinte)
            return chr(10).join(bloco)
    return ''


def conferir_caso(nome, estragar_texto, estragar_registro, assinar_antes, esperado, fontes):
    """Os seis exames de um veneno. Devolve (falhas, quantos exames)."""
    raiz = tempfile.mkdtemp(prefix='portao_')
    try:
        montar_caso(raiz, estragar_texto, estragar_registro, assinar_antes, fontes)
        saida_v = rodar_verificador(raiz)
        saida_g = rodar_gerador(raiz)
        entraram = ids_no_banco(raiz)
        bloco = _bloco_do_reprovado(saida_v, VENENO)

        exames = [
            ('o verificador reprova o veneno', bool(bloco), True),
            ('a mensagem do veneno e a do defeito plantado',
             esperado.lower() in bloco.lower(), True),
            ('o verificador aprova o tema saudavel na mesma rodada',
             bool(_linha_de(saida_v, '  ok        %s.md' % SAUDAVEL)), True),
            ('o veneno nao entra no banco gerado', VENENO in entraram, False),
            ('o saudavel entra no banco gerado', SAUDAVEL in entraram, True),
            ('o gerador diz por que o veneno ficou de fora',
             '%s.md:' % VENENO in saida_g, True),
        ]
        falhas = 0
        for exame, obtido, queria in exames:
            if obtido == queria:
                print('  OK     %s: %s' % (nome, exame))
            else:
                print('  FALHA  %s: %s' % (nome, exame))
                print('         esperava %r, obteve %r' % (queria, obtido))
                if bloco:
                    print('         o verificador disse: %s' % bloco.strip()[:220])
                else:
                    print('         o verificador nao reprovou; entraram no banco: %s' % entraram)
                falhas += 1
        return falhas, len(exames)
    finally:
        shutil.rmtree(raiz, ignore_errors=True)


def conferir_saudavel():
    """Antes dos venenos: o caso sem veneno nenhum tem que passar inteiro.

    Sem esta rodada, uma bateria em que TUDO reprova (uma raiz montada errada,
    por exemplo) marcaria seis venenos pegos e nao teria pegado nada.
    """
    raiz = tempfile.mkdtemp(prefix='portao_')
    try:
        montar_caso(raiz, None, None, False)
        saida_v = rodar_verificador(raiz)
        rodar_gerador(raiz)
        entraram = ids_no_banco(raiz)
        exames = [
            ('sem veneno, o verificador nao reprova nenhum dos dois',
             'REPROVADO' in saida_v, False),
            ('sem veneno, os dois temas entram no banco',
             entraram, [VENENO, SAUDAVEL]),
        ]
        falhas = 0
        for exame, obtido, queria in exames:
            if obtido == queria:
                print('  OK     controle: %s' % exame)
            else:
                print('  FALHA  controle: %s' % exame)
                print('         esperava %r, obteve %r' % (queria, obtido))
                print('         %s' % saida_v.strip()[-400:])
                falhas += 1
        return falhas, len(exames)
    finally:
        shutil.rmtree(raiz, ignore_errors=True)


def rodar():
    falhas = 0
    total = 0

    parciais, quantos = conferir_saudavel()
    falhas += parciais
    total += quantos

    for nome, estragar_texto, estragar_registro, assinar_antes, esperado, fontes in VENENOS:
        parciais, quantos = conferir_caso(nome, estragar_texto, estragar_registro,
                                          assinar_antes, esperado, fontes)
        falhas += parciais
        total += quantos

    print('')
    print('=' * 60)
    if falhas:
        print('%d exame(s) do portao de portugues falharam. Ele deixou passar veneno, ou '
              'reprovou o que estava bom.' % falhas)
    else:
        print('O portao de portugues reprovou os %d venenos pela linha de comando, deixou cada '
              'um fora do banco e manteve o tema saudavel dentro.' % len(VENENOS))
    print('%d passaram, %d falharam.' % (total - falhas, falhas))
    print('=' * 60)
    return 1 if falhas else 0


if __name__ == '__main__':
    sys.exit(rodar())
