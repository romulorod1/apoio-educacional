# Notação matemática nos temas

Este documento é o contrato entre o banco de temas e o gerador de PDF. Ele existe porque o banco
foi escrito descrevendo equação por extenso, e isso não serve como material de matemática:

> o montante é C vezes (1 mais i) elevado a t

precisa ser

> M = C · (1 + i)^{t}

---

## 1. O que pode ser escrito direto

Estes caracteres o PDF desenha hoje, sem nenhuma mudança no gerador:

```
=  +  -  ×  ÷  ·  (  )  [  ]  <  >  %  ,  .  :  ;  /  |
°  ±  ²  ³  ½  ¼  ¾  µ  ª  º
```

E toda a acentuação do português.

## 2. O que precisa de marcação

O PDF não tem esses glifos na fonte de texto. Escreva com a marcação abaixo, e o gerador resolve.

| Para escrever | Use | Exemplo |
| expoente | `^{...}` | `(1 + i)^{t}`, `2^{n+1}`, `10^{-3}` |
| índice | `_{...}` | `a_{1}`, `S_{n}`, `x_{máx}` |

A chave é obrigatória mesmo com um caractere só: `x^{2}`, e não `x^2`. Sem a chave o gerador não
sabe onde o expoente termina.

**Não existe marcação dentro de marcação.** `2^{3^{2}}` não funciona: o gerador desenha um pedaço
literal no meio da fórmula, sem avisar. Potência de potência precisa ser escrita de outro jeito, em
prosa ou em duas etapas. O `verificar.py` reprova chave mal fechada e chave aninhada, porque os dois
passavam por todas as outras travas e chegavam calados na folha.

## 3. O que vem da fonte de símbolos

Escreva o caractere de verdade. O gerador troca de fonte sozinho para desenhá-lo.

```
π   √   ≥   ≤   ≠   ∞   Δ   Σ   α   β   θ
```

Quem manda no repertório é o `pdf.js`: a lista `SIMBOLOS` dele é a única fonte, e o
`verificar.py` pergunta a ele em vez de manter cópia. Para acrescentar um símbolo novo, basta
mexer no `pdf.js`, com o código na fonte Symbol e a largura do glifo.

Os códigos na fonte Symbol (base-14, não precisa embutir):
`π` 0x70, `√` 0xD6, `≥` 0xB3, `≤` 0xA3, `≠` 0xB9, `∞` 0xA5, `Δ` 0x44, `Σ` 0x53,
`α` 0x61, `β` 0x62, `θ` 0x71.

Raiz com radicando longo fica ilegível sem a barra horizontal. Nesses casos escreva
`√(b^{2} - 4·a·c)` com o parêntese, que é inequívoco.

## 4. Como escrever uma fórmula

**Toda fórmula tem um nome do lado esquerdo e um sinal de igual.** Não existe fórmula em prosa.

Errado:

> o montante é C vezes (1 mais i) elevado a t

Certo:

> M = C · (1 + i)^{t}
>
> onde M é o montante, C o capital, i a taxa por período e t o número de períodos.

A lista de significados vem depois da fórmula, em prosa, uma vez só.

## 5. Multiplicação

- Entre números escritos: `3 × 4`
- Envolvendo letra ou parêntese: `2 · x`, `C · (1 + i)`, `m · c · (Tf - Ti)`
- Justaposição também vale quando não gera ambiguidade: `2x`, `ab`

Nunca `*`.

## 6. O que NÃO deve ser trocado

Esta é a parte que exige julgamento, e é onde uma troca automática estraga o texto.

**Prosa continua prosa.** Estas palavras são português, não operador:

- "às vezes", "muitas vezes", "duas vezes por semana", "quantas vezes a categoria apareceu"
- "o dobro é o mesmo somado duas vezes"
- "cada aresta foi contada duas vezes"

**Tema que ensina a notação mantém as duas formas.** Quando o assunto do tema é justamente
apresentar a potência, o texto precisa dizer a notação e a leitura:

> Escrevemos `2^{5}` e lemos "dois elevado a cinco".

Aqui "elevado a cinco" está certo e não sai.

**Frases que descrevem uma propriedade em palavras podem continuar em palavras:**

> Qualquer número diferente de zero elevado a 0 dá 1.

Isso é uma afirmação sobre potências, não uma conta a resolver. Pode virar
`a^{0} = 1, para a ≠ 0` se ficar mais claro, mas não é obrigatório.

**Anos iniciais falam como se fala.** Do 2º ao 6º ano, `6 vezes 5 dá 30` está certo para a idade.
Nessas séries só troque o que é inequivocamente uma expressão a resolver, e mantenha a leitura em
voz alta onde ela ajuda.

## 7. O que nunca muda

- **Nenhum número.** Nem um dígito, nem uma vírgula decimal.
- **Nenhum resultado.** A resposta do exercício é a mesma antes e depois.
- **O bloco `## VERIFICACAO`.** Ele confere as contas com sympy. Se a reescrita quebrar o bloco,
  a reescrita está errada, não o bloco.
- **A correspondência entre PT e EN.** As duas línguas usam os mesmos números e chegam às mesmas
  respostas, e o verificador confere isso. Toda mudança de notação vale para as duas.

## 8. A trava

`verificar.py` reprova qualquer tema que use caractere que o PDF não sabe desenhar. Rode
`python temas/_ferramentas/verificar.py` antes de dar um tema por pronto.
