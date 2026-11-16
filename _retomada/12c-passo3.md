# Item 12c, passo 3: estado no checkpoint de 16/11/2026

Este ramo só guarda o estado. O trabalho do passo 3 não mora no repositório: ele está nos mapas de capítulos do Drive da dona (pasta `Livros\mapa`).

## Feito
- A planilha das ligações entre matérias foi conferida pela orquestradora. A 1ª leva são as 42 ligações "alta, alta" (propositor e confirmador cego concordantes).
- As 42 foram gravadas nos mapas de Física (33) e de Química (9), no formato do #197: `{"id": "<assunto>", "confianca": "alta"}` no fim da lista `assuntos` do capítulo. Só houve acréscimo de linhas.
- Há cópia de segurança dos dois mapas, de antes da gravação, em `Livros\mapa\_backup_12c_2026-11-16\`.
- O `--ensaio` do publicador, a partir da main c8bc1e6, deu só "meta trocado" em 10 livros de Física e Química. Não há chave nova, livro novo, pacote mudado nem arquivo a enviar.

## Falta
1. A orquestradora decidir sobre o aparelho antigo `ap91fd` (tablet Chrome na 1.42.47, abaixo da 1.42.98). Lá o Corrigir antigo derruba a ligação ao salvar uma correção.
2. A ordem da orquestradora e a aprovação EXPLÍCITA do dono para o `--publicar`, rodado pelo dono com `!`.
3. Depois de publicar: conferir no tablet que "Nos livros" mostra "livro de Química" e "livro de Física" nos assuntos de Matemática.
4. A 2ª leva (as 42 "média") fica para depois de a Nathália ver as primeiras.

Os scripts (o wrapper do publicador, os 18 manifests já refeitos com as ligações e o `aplica.py`) estão no Drive, em `retomada\scripts\romul-88\`. O roteiro completo está em `retomada\RETOMADA_romul-88.md`.
