---
id: MATEM2-15
serie: em2
unidade: algebra
titulo_pt: Identidades trigonométricas: adição de arcos e arco duplo
titulo_en: Trigonometric identities: angle sum and double angle
resumo_pt: Calcular seno, cosseno e tangente da soma e da diferença de dois arcos, do arco duplo e do arco metade, e usar essas fórmulas para obter valores exatos e resolver equações.
resumo_en: Working out the sine, cosine and tangent of the sum and the difference of two arcs, of the double angle and of the half angle, and using those formulas to obtain exact values and solve equations.
prerequisitos: [MATEM2-02]
duracao_min: 90
dificuldade: 5
---

## PT

### Explicação

#### O seno não distribui

A primeira coisa a aprender neste tema é uma proibição. Seno, cosseno e tangente não se distribuem
sobre a soma: sen(a + b) **não** é sen(a) + sen(b). O contraexemplo é imediato: sen(30° + 60°) é
sen(90°), que vale 1, enquanto sen(30°) + sen(60°) = 1/2 + √3/2, que passa de 1, valor que nenhum
seno alcança. Para lidar com a soma de dois arcos existem fórmulas próprias, e este tema é sobre
elas.

#### O que entra e o que fica de fora

Este tema cobre o que a prova de colégio e o vestibular estadual cobram: seno, cosseno e tangente
da soma e da diferença de dois arcos, o arco duplo e o arco metade. Ficam de fora, de propósito, a
cossecante, a secante e a cotangente, e as fórmulas de arcos múltiplos como sen(3a) e cos(4a),
que aparecem nas provas do IME e do ITA e não neste nível. Quem dominar o que está aqui resolve o
que a escola pede e chega preparado para o resto, se um dia precisar.

#### Seno e cosseno da soma e da diferença

Para dois arcos a e b quaisquer valem as quatro fórmulas:

sen(a + b) = sen(a) · cos(b) + sen(b) · cos(a)

sen(a - b) = sen(a) · cos(b) - sen(b) · cos(a)

cos(a + b) = cos(a) · cos(b) - sen(a) · sen(b)

cos(a - b) = cos(a) · cos(b) + sen(a) · sen(b)

Dois padrões ajudam a guardar. No seno, os fatores se alternam, seno com cosseno, e o sinal do meio
é o mesmo do arco. No cosseno, os fatores se repetem, cosseno com cosseno e seno com seno, e o sinal
do meio é o **contrário** do arco. A fórmula de cos(a - b) vem da distância entre os dois pontos do
ciclo que correspondem aos arcos a e b, e as outras três saem dela trocando b por -b e usando que
o seno é o cosseno do complementar.

**Exemplo 1.** Calcular sen(75°).
Escrevendo 75° = 45° + 30°:
sen(75°) = sen(45°) · cos(30°) + sen(30°) · cos(45°) = (√2/2) · (√3/2) + (1/2) · (√2/2), que dá
√6/4 + √2/4. Logo sen(75°) = (√6 + √2)/4.

**Exemplo 2.** Calcular cos(15°).
Escrevendo 15° = 45° - 30°:
cos(15°) = cos(45°) · cos(30°) + sen(45°) · sen(30°) = (√2/2) · (√3/2) + (√2/2) · (1/2), que dá
(√6 + √2)/4.
O valor é o mesmo de sen(75°), e não é coincidência: 15° e 75° são complementares, e o cosseno de um
arco é o seno do seu complementar.

#### Tangente da soma e da diferença

Dividindo sen(a + b) por cos(a + b) e depois dividindo numerador e denominador por cos(a) · cos(b),
chega-se a

@eq \text{tg}(a + b) = \frac{\text{tg}(a) + \text{tg}(b)}{1 - \text{tg}(a) \cdot \text{tg}(b)}

@eq \text{tg}(a - b) = \frac{\text{tg}(a) - \text{tg}(b)}{1 + \text{tg}(a) \cdot \text{tg}(b)}

As fórmulas só valem quando as tangentes envolvidas existem e o denominador não é zero. Quando
tg(a) · tg(b) = 1, o arco a + b tem cosseno zero, e a tangente dele não existe.

**Exemplo 3.** Calcular tg(75°).
Com tg(45°) = 1 e tg(30°) = √3/3:
tg(75°) = (1 + √3/3)/(1 - √3/3). Multiplicando numerador e denominador por 3, fica
(3 + √3)/(3 - √3). Racionalizando, isto é, multiplicando em cima e embaixo por (3 + √3), chega-se a
(12 + 6√3)/6, que é 2 + √3.

#### Arco duplo

Fazendo b = a nas fórmulas da soma, aparecem as fórmulas do arco duplo:

sen(2a) = 2 · sen(a) · cos(a)

cos(2a) = cos^{2}(a) - sen^{2}(a)

@eq \text{tg}(2a) = \frac{2 \cdot \text{tg}(a)}{1 - \text{tg}^{2}(a)}

O cosseno do arco duplo tem mais duas formas, que saem da relação fundamental
sen^{2}(a) + cos^{2}(a) = 1. Trocando cos^{2}(a) por 1 - sen^{2}(a), ou sen^{2}(a) por
1 - cos^{2}(a):

cos(2a) = 1 - 2 · sen^{2}(a)

cos(2a) = 2 · cos^{2}(a) - 1

As três formas são a mesma igualdade escrita de três jeitos. A escolha depende do que o problema
dá: se dá o seno, use a forma com seno; se dá o cosseno, a forma com cosseno.

**Exemplo 4.** Sabendo que sen(a) = 3/5 e que a está no primeiro quadrante, calcular sen(2a),
cos(2a) e tg(2a).
Pela relação fundamental, cos^{2}(a) = 1 - 9/25 = 16/25, e como a é do primeiro quadrante,
cos(a) = 4/5.
sen(2a) = 2 · (3/5) · (4/5) = 24/25.
cos(2a) = 16/25 - 9/25 = 7/25.
tg(2a) = sen(2a)/cos(2a) = (24/25)/(7/25) = 24/7.

#### Arco metade

As duas últimas formas do cosseno do arco duplo, lidas ao contrário, dão o seno e o cosseno da
metade de um arco. Chamando o arco de x, de modo que 2a = x e a = x/2:

@eq \text{sen}\left(\frac{x}{2}\right) = \pm \sqrt{\frac{1 - \cos(x)}{2}}

@eq \cos\left(\frac{x}{2}\right) = \pm \sqrt{\frac{1 + \cos(x)}{2}}

A raiz dá apenas o valor absoluto. O sinal vem do quadrante em que está x/2, e não do quadrante de
x. Esquecer isso é o erro mais comum do arco metade.

**Exemplo 5.** Calcular sen(15°) pelo arco metade.
Como 15° é a metade de 30° e está no primeiro quadrante, o sinal é positivo:
sen(15°) = √((1 - cos(30°))/2) = √((1 - √3/2)/2) = √((2 - √3)/4) = √(2 - √3)/2.
Pela fórmula da diferença, sen(15°) = sen(45° - 30°) = (√6 - √2)/4. As duas expressões parecem
diferentes e são o mesmo número: elevando ao quadrado, as duas dão (2 - √3)/4, e as duas são
positivas.

#### Equação com arco duplo

Quando a equação mistura o arco x com o arco 2x, o caminho é reescrever o arco duplo em função de
x e fatorar. A armadilha é dividir os dois lados por sen(x) ou por cos(x): isso apaga as soluções
em que esse fator vale zero.

**Exemplo 6.** Resolver sen(2x) = sen(x), com 0 ≤ x < 2π.
Trocando sen(2x) por 2 · sen(x) · cos(x) e passando tudo para um lado:
2 · sen(x) · cos(x) - sen(x) = 0, ou seja, sen(x) · (2 · cos(x) - 1) = 0.
Um produto é zero quando um dos fatores é zero. De sen(x) = 0 vêm x = 0 e x = π. De cos(x) = 1/2
vêm x = π/3 e x = 5π/3. As quatro soluções são 0, π/3, π e 5π/3.

#### Erros comuns

**Distribuir o seno ou o cosseno sobre a soma.** sen(a + b) não é sen(a) + sen(b). Se o resultado
de uma conta passa de 1, foi isso.

**Trocar o sinal na fórmula do cosseno.** Em cos(a + b) o sinal do meio é de menos, o contrário do
sinal do arco.

**Achar que cos(2a) é 2 · cos(a).** O arco dobra, o cosseno não. Basta testar com a = 60°:
cos(120°) é -1/2, e 2 · cos(60°) é 1.

**Esquecer o sinal no arco metade.** A raiz devolve o valor absoluto, e o sinal vem do quadrante de
x/2.

**Dividir a equação por sen(x).** Isso perde as soluções em que sen(x) = 0. Passe tudo para um lado
e fatore.

### Exercícios

**Bloco A. Fundamentos**

1. Calcule sen(75°) escrevendo 75° = 45° + 30°.
2. Calcule cos(15°) escrevendo 15° = 45° - 30°.
3. Sabendo que sen(a) = 3/5 e que a está no primeiro quadrante, calcule sen(2a) e cos(2a).
4. Calcule cos(75°) escrevendo 75° = 45° + 30°, e explique por que o resultado coincide com
   sen(15°).
5. Calcule tg(75°) usando tg(45°) = 1 e tg(30°) = √3/3.

**Bloco B. Consolidação**

6. Sabendo que cos(x) = -5/13 e que x está no segundo quadrante, calcule sen(2x), cos(2x) e tg(2x).
7. Mostre que (sen(x) + cos(x))^{2} = 1 + sen(2x) para todo x real.
8. Calcule o valor exato de cos(22,5°) usando a fórmula do arco metade.
9. Resolva a equação sen(2x) = sen(x), com 0 ≤ x < 2π.
10. Resolva a equação cos(2x) + 3 · sen(x) = 2, com 0 ≤ x < 2π.
11. Mostre que a função f(x) = sen(x) · cos(x) tem período π e valor máximo 1/2.
12. Sabendo que tg(a) = 2 e tg(b) = 3, calcule tg(a + b) e tg(a - b). Sabendo ainda que a e b são
    arcos do primeiro quadrante, determine o valor de a + b.
13. Sabendo que cos(a) = 1/3 e que a está no primeiro quadrante, calcule sen(2a) e cos(2a) e diga
    em que quadrante está o arco 2a.

**Bloco C. Aprofundamento**

14. Sabendo que sen(a) = 4/5 e cos(b) = 12/13, com a e b no primeiro quadrante, calcule sen(a + b)
    e cos(a + b).
15. Mostre que cos^{4}(x) - sen^{4}(x) = cos(2x) para todo x real.
16. Resolva a equação cos(2x) = cos(x), com 0 ≤ x < 2π.
17. Sabendo que cos(x) = 3/5 e que 0 < x < π/2, calcule sen(x/2), cos(x/2) e tg(x/2).
18. Mostre que sen(x) + cos(x) = √2 · sen(x + π/4) para todo x real, e use essa igualdade para
    determinar o valor máximo de sen(x) + cos(x) e o valor de x, com 0 ≤ x < 2π, em que ele ocorre.

### Gabarito

1. sen(75°) = (√6 + √2)/4.
2. cos(15°) = (√6 + √2)/4.
3. sen(2a) = 24/25 e cos(2a) = 7/25. O cosseno de a vale 4/5.
4. cos(75°) = (√6 - √2)/4. Coincide com sen(15°) porque 75° e 15° são complementares, e o cosseno
   de um arco é o seno do seu complementar.
5. tg(75°) = 2 + √3. A fórmula dá (1 + √3/3)/(1 - √3/3), que é (3 + √3)/(3 - √3), e racionalizando
   chega-se a 2 + √3.
6. sen(2x) = -120/169, cos(2x) = -119/169 e tg(2x) = 120/119. No segundo quadrante o seno é
   positivo, então sen(x) = 12/13.
7. Desenvolvendo o quadrado, (sen(x) + cos(x))^{2} = sen^{2}(x) + 2 · sen(x) · cos(x) + cos^{2}(x).
   Pela relação fundamental, sen^{2}(x) + cos^{2}(x) = 1, e pelo arco duplo,
   2 · sen(x) · cos(x) = sen(2x). Logo a expressão vale 1 + sen(2x).
8. cos(22,5°) = √(2 + √2)/2. Como 22,5° é a metade de 45° e está no primeiro quadrante,
   cos(22,5°) = √((1 + √2/2)/2) = √((2 + √2)/4).
9. x = 0, x = π/3, x = π e x = 5π/3. A equação vira sen(x) · (2 · cos(x) - 1) = 0.
10. x = π/6, x = π/2 e x = 5π/6. Trocando cos(2x) por 1 - 2 · sen^{2}(x), a equação vira
    2 · sen^{2}(x) - 3 · sen(x) + 1 = 0, cujas soluções são sen(x) = 1 e sen(x) = 1/2.
11. Pelo arco duplo, f(x) = sen(2x)/2. O período de sen(2x) é 2π/2 = π, e o valor máximo é 1/2, que
    ocorre quando sen(2x) = 1.
12. tg(a + b) = -1 e tg(a - b) = -1/7. Como a e b são do primeiro quadrante, a + b está entre 0 e π,
    e o único arco desse intervalo com tangente -1 é 3π/4, ou seja, 135°.
13. sen(2a) = 4√2/9 e cos(2a) = -7/9. O seno de a vale 2√2/3. Como sen(2a) é positivo e cos(2a) é
    negativo, o arco 2a está no segundo quadrante.
14. sen(a + b) = 63/65 e cos(a + b) = 16/65. Pela relação fundamental, cos(a) = 3/5 e
    sen(b) = 5/13.
15. A diferença de quadrados fatora: cos^{4}(x) - sen^{4}(x) = (cos^{2}(x) - sen^{2}(x)) ·
    (cos^{2}(x) + sen^{2}(x)). O segundo fator vale 1 pela relação fundamental, e o primeiro é
    cos(2x) pelo arco duplo.
16. x = 0, x = 2π/3 e x = 4π/3. Trocando cos(2x) por 2 · cos^{2}(x) - 1, a equação vira
    2 · cos^{2}(x) - cos(x) - 1 = 0, cujas soluções são cos(x) = 1 e cos(x) = -1/2.
17. sen(x/2) = √5/5, cos(x/2) = 2√5/5 e tg(x/2) = 1/2. Como 0 < x < π/2, o arco x/2 está no
    primeiro quadrante e os sinais são positivos: sen(x/2) = √((1 - 3/5)/2) = √(1/5) e
    cos(x/2) = √((1 + 3/5)/2) = √(4/5).
18. Pela fórmula da soma, √2 · sen(x + π/4) = √2 · (sen(x) · √2/2 + cos(x) · √2/2), que é
    sen(x) + cos(x). Como o seno vale no máximo 1, o valor máximo de sen(x) + cos(x) é √2, atingido
    quando sen(x + π/4) = 1, ou seja, quando x + π/4 = π/2, isto é, x = π/4.

## EN

### Explanation

#### The sine does not distribute

The first thing to learn in this topic is a prohibition. Sine, cosine and tangent do not distribute
over a sum: sin(a + b) is **not** sin(a) + sin(b). The counterexample is immediate: sin(30° + 60°)
is sin(90°), which equals 1, while sin(30°) + sin(60°) = 1/2 + √3/2, which is greater than 1, a
value no sine reaches. To deal with the sum of two arcs there are formulas of their own, and this
topic is about them.

#### What is in and what is left out

This topic covers what the school exam and the state entrance exam ask for: sine, cosine and
tangent of the sum and the difference of two arcs, the double angle and the half angle. Left out,
on purpose, are the cosecant, the secant and the cotangent, and the multiple angle formulas such as
sin(3a) and cos(4a), which appear in the IME and ITA exams and not at this level. Whoever masters
what is here solves what school asks and arrives prepared for the rest, should it ever be needed.

#### Sine and cosine of a sum and of a difference

For any two arcs a and b the four formulas hold:

sin(a + b) = sin(a) · cos(b) + sin(b) · cos(a)

sin(a - b) = sin(a) · cos(b) - sin(b) · cos(a)

cos(a + b) = cos(a) · cos(b) - sin(a) · sin(b)

cos(a - b) = cos(a) · cos(b) + sin(a) · sin(b)

Two patterns help you remember them. In the sine, the factors alternate, sine with cosine, and the
sign in the middle is the same as in the arc. In the cosine, the factors repeat, cosine with cosine
and sine with sine, and the sign in the middle is the **opposite** of the one in the arc. The
formula for cos(a - b) comes from the distance between the two points of the circle matching the
arcs a and b, and the other three follow from it by swapping b for -b and using that the sine is
the cosine of the complement.

**Example 1.** Find sin(75°).
Writing 75° = 45° + 30°:
sin(75°) = sin(45°) · cos(30°) + sin(30°) · cos(45°) = (√2/2) · (√3/2) + (1/2) · (√2/2), which
gives √6/4 + √2/4. So sin(75°) = (√6 + √2)/4.

**Example 2.** Find cos(15°).
Writing 15° = 45° - 30°:
cos(15°) = cos(45°) · cos(30°) + sin(45°) · sin(30°) = (√2/2) · (√3/2) + (√2/2) · (1/2), which
gives (√6 + √2)/4.
The value is the same as sin(75°), and that is no coincidence: 15° and 75° are complementary, and
the cosine of an arc is the sine of its complement.

#### Tangent of a sum and of a difference

Dividing sin(a + b) by cos(a + b) and then dividing numerator and denominator by cos(a) · cos(b),
we reach

@eq \tan(a + b) = \frac{\tan(a) + \tan(b)}{1 - \tan(a) \cdot \tan(b)}

@eq \tan(a - b) = \frac{\tan(a) - \tan(b)}{1 + \tan(a) \cdot \tan(b)}

The formulas hold only when the tangents involved exist and the denominator is not zero. When
tan(a) · tan(b) = 1, the arc a + b has cosine zero, and its tangent does not exist.

**Example 3.** Find tan(75°).
With tan(45°) = 1 and tan(30°) = √3/3:
tan(75°) = (1 + √3/3)/(1 - √3/3). Multiplying numerator and denominator by 3, it becomes
(3 + √3)/(3 - √3). Rationalising, that is, multiplying top and bottom by (3 + √3), we reach
(12 + 6√3)/6, which is 2 + √3.

#### Double angle

Setting b = a in the sum formulas, the double angle formulas appear:

sin(2a) = 2 · sin(a) · cos(a)

cos(2a) = cos^{2}(a) - sin^{2}(a)

@eq \tan(2a) = \frac{2 \cdot \tan(a)}{1 - \tan^{2}(a)}

The cosine of the double angle has two more forms, which come from the fundamental relation
sin^{2}(a) + cos^{2}(a) = 1. Replacing cos^{2}(a) by 1 - sin^{2}(a), or sin^{2}(a) by
1 - cos^{2}(a):

cos(2a) = 1 - 2 · sin^{2}(a)

cos(2a) = 2 · cos^{2}(a) - 1

The three forms are the same equality written in three ways. The choice depends on what the problem
gives: if it gives the sine, use the form with the sine; if it gives the cosine, the form with the
cosine.

**Example 4.** Knowing that sin(a) = 3/5 and that a is in the first quadrant, find sin(2a), cos(2a)
and tan(2a).
By the fundamental relation, cos^{2}(a) = 1 - 9/25 = 16/25, and since a is in the first quadrant,
cos(a) = 4/5.
sin(2a) = 2 · (3/5) · (4/5) = 24/25.
cos(2a) = 16/25 - 9/25 = 7/25.
tan(2a) = sin(2a)/cos(2a) = (24/25)/(7/25) = 24/7.

#### Half angle

The last two forms of the cosine of the double angle, read backwards, give the sine and the cosine
of half an arc. Calling the arc x, so that 2a = x and a = x/2:

@eq \sin\left(\frac{x}{2}\right) = \pm \sqrt{\frac{1 - \cos(x)}{2}}

@eq \cos\left(\frac{x}{2}\right) = \pm \sqrt{\frac{1 + \cos(x)}{2}}

The root gives only the absolute value. The sign comes from the quadrant where x/2 sits, not from
the quadrant of x. Forgetting that is the most common mistake with the half angle.

**Example 5.** Find sin(15°) by the half angle.
Since 15° is half of 30° and sits in the first quadrant, the sign is positive:
sin(15°) = √((1 - cos(30°))/2) = √((1 - √3/2)/2) = √((2 - √3)/4) = √(2 - √3)/2.
By the difference formula, sin(15°) = sin(45° - 30°) = (√6 - √2)/4. The two expressions look
different and are the same number: squaring, both give (2 - √3)/4, and both are positive.

#### Equation with a double angle

When the equation mixes the arc x with the arc 2x, the route is to rewrite the double angle in terms
of x and factor. The trap is dividing both sides by sin(x) or by cos(x): that wipes out the
solutions where that factor is zero.

**Example 6.** Solve sin(2x) = sin(x), with 0 ≤ x < 2π.
Replacing sin(2x) by 2 · sin(x) · cos(x) and moving everything to one side:
2 · sin(x) · cos(x) - sin(x) = 0, that is, sin(x) · (2 · cos(x) - 1) = 0.
A product is zero when one of the factors is zero. From sin(x) = 0 come x = 0 and x = π. From
cos(x) = 1/2 come x = π/3 and x = 5π/3. The four solutions are 0, π/3, π and 5π/3.

#### Common mistakes

**Distributing the sine or the cosine over a sum.** sin(a + b) is not sin(a) + sin(b). If the result
of a calculation goes above 1, that was it.

**Swapping the sign in the cosine formula.** In cos(a + b) the sign in the middle is a minus, the
opposite of the sign in the arc.

**Thinking that cos(2a) is 2 · cos(a).** The arc doubles, the cosine does not. Just test with
a = 60°: cos(120°) is -1/2, and 2 · cos(60°) is 1.

**Forgetting the sign in the half angle.** The root returns the absolute value, and the sign comes
from the quadrant of x/2.

**Dividing the equation by sin(x).** That loses the solutions where sin(x) = 0. Move everything to
one side and factor.

### Exercises

**Block A. Fundamentals**

1. Find sin(75°) by writing 75° = 45° + 30°.
2. Find cos(15°) by writing 15° = 45° - 30°.
3. Knowing that sin(a) = 3/5 and that a is in the first quadrant, find sin(2a) and cos(2a).
4. Find cos(75°) by writing 75° = 45° + 30°, and explain why the result coincides with sin(15°).
5. Find tan(75°) using tan(45°) = 1 and tan(30°) = √3/3.

**Block B. Building up**

6. Knowing that cos(x) = -5/13 and that x is in the second quadrant, find sin(2x), cos(2x) and
   tan(2x).
7. Show that (sin(x) + cos(x))^{2} = 1 + sin(2x) for every real x.
8. Find the exact value of cos(22.5°) using the half angle formula.
9. Solve the equation sin(2x) = sin(x), with 0 ≤ x < 2π.
10. Solve the equation cos(2x) + 3 · sin(x) = 2, with 0 ≤ x < 2π.
11. Show that the function f(x) = sin(x) · cos(x) has period π and maximum value 1/2.
12. Knowing that tan(a) = 2 and tan(b) = 3, find tan(a + b) and tan(a - b). Knowing also that a and
    b are arcs in the first quadrant, find the value of a + b.
13. Knowing that cos(a) = 1/3 and that a is in the first quadrant, find sin(2a) and cos(2a) and say
    in which quadrant the arc 2a sits.

**Block C. Going further**

14. Knowing that sin(a) = 4/5 and cos(b) = 12/13, with a and b in the first quadrant, find
    sin(a + b) and cos(a + b).
15. Show that cos^{4}(x) - sin^{4}(x) = cos(2x) for every real x.
16. Solve the equation cos(2x) = cos(x), with 0 ≤ x < 2π.
17. Knowing that cos(x) = 3/5 and that 0 < x < π/2, find sin(x/2), cos(x/2) and tan(x/2).
18. Show that sin(x) + cos(x) = √2 · sin(x + π/4) for every real x, and use that equality to find
    the maximum value of sin(x) + cos(x) and the value of x, with 0 ≤ x < 2π, at which it happens.

### Answer key

1. sin(75°) = (√6 + √2)/4.
2. cos(15°) = (√6 + √2)/4.
3. sin(2a) = 24/25 and cos(2a) = 7/25. The cosine of a is 4/5.
4. cos(75°) = (√6 - √2)/4. It coincides with sin(15°) because 75° and 15° are complementary, and the
   cosine of an arc is the sine of its complement.
5. tan(75°) = 2 + √3. The formula gives (1 + √3/3)/(1 - √3/3), which is (3 + √3)/(3 - √3), and
   rationalising leads to 2 + √3.
6. sin(2x) = -120/169, cos(2x) = -119/169 and tan(2x) = 120/119. In the second quadrant the sine is
   positive, so sin(x) = 12/13.
7. Expanding the square, (sin(x) + cos(x))^{2} = sin^{2}(x) + 2 · sin(x) · cos(x) + cos^{2}(x). By
   the fundamental relation, sin^{2}(x) + cos^{2}(x) = 1, and by the double angle,
   2 · sin(x) · cos(x) = sin(2x). So the expression equals 1 + sin(2x).
8. cos(22.5°) = √(2 + √2)/2. Since 22.5° is half of 45° and sits in the first quadrant,
   cos(22.5°) = √((1 + √2/2)/2) = √((2 + √2)/4).
9. x = 0, x = π/3, x = π and x = 5π/3. The equation becomes sin(x) · (2 · cos(x) - 1) = 0.
10. x = π/6, x = π/2 and x = 5π/6. Replacing cos(2x) by 1 - 2 · sin^{2}(x), the equation becomes
    2 · sin^{2}(x) - 3 · sin(x) + 1 = 0, whose solutions are sin(x) = 1 and sin(x) = 1/2.
11. By the double angle, f(x) = sin(2x)/2. The period of sin(2x) is 2π/2 = π, and the maximum value
    is 1/2, reached when sin(2x) = 1.
12. tan(a + b) = -1 and tan(a - b) = -1/7. Since a and b are in the first quadrant, a + b lies
    between 0 and π, and the only arc in that interval with tangent -1 is 3π/4, that is, 135°.
13. sin(2a) = 4√2/9 and cos(2a) = -7/9. The sine of a is 2√2/3. Since sin(2a) is positive and
    cos(2a) is negative, the arc 2a sits in the second quadrant.
14. sin(a + b) = 63/65 and cos(a + b) = 16/65. By the fundamental relation, cos(a) = 3/5 and
    sin(b) = 5/13.
15. The difference of squares factors: cos^{4}(x) - sin^{4}(x) = (cos^{2}(x) - sin^{2}(x)) ·
    (cos^{2}(x) + sin^{2}(x)). The second factor equals 1 by the fundamental relation, and the first
    is cos(2x) by the double angle.
16. x = 0, x = 2π/3 and x = 4π/3. Replacing cos(2x) by 2 · cos^{2}(x) - 1, the equation becomes
    2 · cos^{2}(x) - cos(x) - 1 = 0, whose solutions are cos(x) = 1 and cos(x) = -1/2.
17. sin(x/2) = √5/5, cos(x/2) = 2√5/5 and tan(x/2) = 1/2. Since 0 < x < π/2, the arc x/2 sits in the
    first quadrant and the signs are positive: sin(x/2) = √((1 - 3/5)/2) = √(1/5) and
    cos(x/2) = √((1 + 3/5)/2) = √(4/5).
18. By the sum formula, √2 · sin(x + π/4) = √2 · (sin(x) · √2/2 + cos(x) · √2/2), which is
    sin(x) + cos(x). Since the sine is at most 1, the maximum value of sin(x) + cos(x) is √2,
    reached when sin(x + π/4) = 1, that is, when x + π/4 = π/2, which means x = π/4.

## VERIFICACAO

```python
# figura: na seção "Seno e cosseno da soma e da diferença", ciclo trigonométrico com os pontos dos arcos a e b marcados e a corda entre eles, de onde sai cos(a - b)
# figura: na seção "Equação com arco duplo", gráficos de sen(x) e de sen(2x) sobrepostos em [0, 2π], com os quatro cruzamentos marcados
X0: sin(pi/6 + pi/3) == 1 and sin(pi/6) + sin(pi/3) > 1
X1: simplify(sin(5*pi/12) - (sqrt(6) + sqrt(2))/4) == 0 and simplify(sin(pi/4)*cos(pi/6) + sin(pi/6)*cos(pi/4) - (sqrt(6) + sqrt(2))/4) == 0
X2: simplify(cos(pi/12) - (sqrt(6) + sqrt(2))/4) == 0 and simplify(cos(pi/4)*cos(pi/6) + sin(pi/4)*sin(pi/6) - (sqrt(6) + sqrt(2))/4) == 0 and 15 + 75 == 90
X3: simplify(tan(5*pi/12) - (2 + sqrt(3))) == 0 and simplify((1 + sqrt(3)/3)/(1 - sqrt(3)/3) - (2 + sqrt(3))) == 0 and expand((3 + sqrt(3))**2) == 12 + 6*sqrt(3) and expand((3 + sqrt(3))*(3 - sqrt(3))) == 6 and simplify((12 + 6*sqrt(3))/6 - (2 + sqrt(3))) == 0
X4: sqrt(1 - Rational(9, 25)) == Rational(4, 5) and 2*Rational(3, 5)*Rational(4, 5) == Rational(24, 25) and Rational(4, 5)**2 - Rational(3, 5)**2 == Rational(7, 25) and Rational(24, 25)/Rational(7, 25) == Rational(24, 7)
X5: simplify(sqrt((1 - cos(pi/6))/2) - sqrt(2 - sqrt(3))/2) == 0 and simplify(sin(pi/12) - sqrt(2 - sqrt(3))/2) == 0 and expand((sqrt(2 - sqrt(3))/2)**2) == expand(((sqrt(6) - sqrt(2))/4)**2) and sqrt(6) > sqrt(2)
X6: solveset(Eq(sin(2*x), sin(x)), x, Interval.Ropen(0, 2*pi)) == FiniteSet(0, pi/3, pi, 5*pi/3)
E1: simplify(sin(5*pi/12) - (sqrt(6) + sqrt(2))/4) == 0 and simplify(sin(pi/4)*cos(pi/6) + sin(pi/6)*cos(pi/4) - (sqrt(6) + sqrt(2))/4) == 0
E2: simplify(cos(pi/12) - (sqrt(6) + sqrt(2))/4) == 0 and simplify(cos(pi/4)*cos(pi/6) + sin(pi/4)*sin(pi/6) - (sqrt(6) + sqrt(2))/4) == 0
E3: sqrt(1 - Rational(9, 25)) == Rational(4, 5) and 2*Rational(3, 5)*Rational(4, 5) == Rational(24, 25) and Rational(4, 5)**2 - Rational(3, 5)**2 == Rational(7, 25)
E4: simplify(cos(5*pi/12) - (sqrt(6) - sqrt(2))/4) == 0 and simplify(sin(pi/12) - (sqrt(6) - sqrt(2))/4) == 0 and 75 + 15 == 90
E5: simplify(tan(5*pi/12) - (2 + sqrt(3))) == 0 and simplify((1 + sqrt(3)/3)/(1 - sqrt(3)/3) - (2 + sqrt(3))) == 0
E6: sqrt(1 - Rational(25, 169)) == Rational(12, 13) and 2*Rational(12, 13)*Rational(-5, 13) == Rational(-120, 169) and Rational(-5, 13)**2 - Rational(12, 13)**2 == Rational(-119, 169) and Rational(-120, 169)/Rational(-119, 169) == Rational(120, 119)
E7: trigsimp(expand((sin(x) + cos(x))**2) - (1 + sin(2*x))) == 0
E8: simplify(cos(pi/8) - sqrt(2 + sqrt(2))/2) == 0 and simplify(sqrt((1 + cos(pi/4))/2) - sqrt(2 + sqrt(2))/2) == 0
E9: solveset(Eq(sin(2*x), sin(x)), x, Interval.Ropen(0, 2*pi)) == FiniteSet(0, pi/3, pi, 5*pi/3)
E10: solveset(Eq(cos(2*x) + 3*sin(x), 2), x, Interval.Ropen(0, 2*pi)) == FiniteSet(pi/6, pi/2, 5*pi/6) and sorted(solve(Eq(2*u**2 - 3*u + 1, 0), u)) == [Rational(1, 2), 1]
E11: trigsimp(sin(x)*cos(x) - sin(2*x)/2) == 0 and 2*pi/2 == pi and sin(2*(pi/4))/2 == Rational(1, 2) and simplify(sin(x + pi)*cos(x + pi) - sin(x)*cos(x)) == 0
E12: Rational(2 + 3, 1 - 2*3) == -1 and Rational(2 - 3, 1 + 2*3) == Rational(-1, 7) and abs(N(atan(2) + atan(3) - 3*pi/4)) < 1e-12 and solveset(Eq(tan(x), -1), x, Interval.open(0, pi)) == FiniteSet(3*pi/4) and Rational(3*180, 4) == 135
E13: simplify(sqrt(1 - Rational(1, 9)) - 2*sqrt(2)/3) == 0 and simplify(2*(2*sqrt(2)/3)*Rational(1, 3) - 4*sqrt(2)/9) == 0 and 2*Rational(1, 9) - 1 == Rational(-7, 9) and 4*sqrt(2)/9 > 0 and Rational(-7, 9) < 0
E14: sqrt(1 - Rational(16, 25)) == Rational(3, 5) and sqrt(1 - Rational(144, 169)) == Rational(5, 13) and Rational(4, 5)*Rational(12, 13) + Rational(5, 13)*Rational(3, 5) == Rational(63, 65) and Rational(3, 5)*Rational(12, 13) - Rational(4, 5)*Rational(5, 13) == Rational(16, 65)
E15: trigsimp(cos(x)**4 - sin(x)**4 - cos(2*x)) == 0 and factor(cos(x)**4 - sin(x)**4) == (cos(x) - sin(x))*(cos(x) + sin(x))*(sin(x)**2 + cos(x)**2)
E16: solveset(Eq(cos(2*x), cos(x)), x, Interval.Ropen(0, 2*pi)) == FiniteSet(0, 2*pi/3, 4*pi/3) and sorted(solve(Eq(2*u**2 - u - 1, 0), u)) == [Rational(-1, 2), 1]
E17: simplify(sqrt((1 - Rational(3, 5))/2) - sqrt(5)/5) == 0 and simplify(sqrt((1 + Rational(3, 5))/2) - 2*sqrt(5)/5) == 0 and simplify((sqrt(5)/5)/(2*sqrt(5)/5) - Rational(1, 2)) == 0
E18: simplify(sqrt(2)*(sin(x)*cos(pi/4) + sin(pi/4)*cos(x)) - (sin(x) + cos(x))) == 0 and trigsimp(sqrt(2)*sin(x + pi/4) - (sin(x) + cos(x))) == 0 and sin(pi/4) + cos(pi/4) == sqrt(2) and solveset(Eq(sin(x + pi/4), 1), x, Interval.Ropen(0, 2*pi)) == FiniteSet(pi/4)
```
