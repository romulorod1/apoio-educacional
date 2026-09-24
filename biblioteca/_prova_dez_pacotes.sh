#!/bin/sh
# Prova que a mudanca da B9 no gerador nao mexeu em nenhum dos dez pacotes
# gravados. Regera cada um SEM --kits, na mesma versao do que esta no Drive, e
# compara arquivo a arquivo pelo sha256 do conteudo.
#
#   sh biblioteca/_prova_dez_pacotes.sh <pasta de trabalho> <arquivo de saida>
#
# A regra da B2 diz que mudanca no codigo do gerador nao entra sem os pacotes
# provados identicos, e ela nao abre excecao porque a mudanca e opcional: o
# argumento "sem --kits sai como saia antes" so vale medido.
#
# Uma serie de cada vez, e a pasta de trabalho de cada uma sai do disco assim
# que a comparacao termina: dez pastas soltas passariam de 1,5 GB.
set -e
TRAB="${1:?pasta de trabalho}"
SAIDA="${2:?arquivo de saida}"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
NATH="J:/Meu Drive/Vida Pessoal/Família/Material pra Nath"
PDFS="$NATH/Aplicativo/Livros/PDF/matematica"
CUR="$NATH/Aplicativo/Biblioteca/curadoria"
PACOTES="$NATH/Aplicativo/Biblioteca/pacotes"

mkdir -p "$TRAB"
: > "$SAIDA"
echo "prova dos dez pacotes, commit $(git -C "$REPO" rev-parse --short HEAD)" >> "$SAIDA"
echo "" >> "$SAIDA"

falhou=0

compara() {
  nome="$1"; versao="$2"
  echo "=== $nome v$versao ===" >> "$SAIDA"
  if python "$REPO/biblioteca/_compara_pacotes.py" \
      "$PACOTES/$nome-v$versao.zip" "$TRAB/saida/$nome-v$versao.zip" \
      --rotulo "$nome v$versao: gravado no Drive contra regerado sem --kits" >> "$SAIDA" 2>&1; then
    echo "  IGUAL" >> "$SAIDA"
  else
    echo "  DIFERENTE" >> "$SAIDA"
    falhou=1
  fi
  echo "" >> "$SAIDA"
  rm -rf "$TRAB/trabalho" "$TRAB/saida/$nome-v$versao.zip"
}

serie() {
  s="$1"; v="$2"
  echo "gerando $s v$v ..." >&2
  python "$REPO/biblioteca/gerar_pacote.py" --pdfs "$PDFS/obmep-portal/$s" --serie "$s" --versao "$v" \
    --saida "$TRAB/saida" --curadoria "$CUR" --trabalho "$TRAB/trabalho" \
    --gerado-em "2026-01-01T00:00:00-03:00" --commit b9prova > /dev/null
  compara "matematica-obmep-$s" "$v"
}

banco() {
  n="$1"; v="$2"
  echo "gerando banco n$n v$v ..." >&2
  python "$REPO/biblioteca/banco.py" --pdfs "$PDFS" --nivel "$n" --versao "$v" \
    --saida "$TRAB/saida" --curadoria "$CUR" --trabalho "$TRAB/trabalho" \
    --gerado-em "2026-01-01T00:00:00-03:00" --commit b9prova > /dev/null
  compara "matematica-obmep-banco-n$n" "$v"
}

serie 6ano 2
serie 7ano 2
serie 8ano 2
serie 9ano 4
serie 1em 2
serie 2em 2
serie 3em 2
banco 1 1
banco 2 1
banco 3 1

echo "" >> "$SAIDA"
if [ "$falhou" = "0" ]; then
  echo "OS DEZ PACOTES SAEM IDENTICOS AO QUE ESTA NO DRIVE" >> "$SAIDA"
else
  echo "ALGUM PACOTE SAIU DIFERENTE: leia acima" >> "$SAIDA"
fi
rm -rf "$TRAB/saida"
exit "$falhou"
