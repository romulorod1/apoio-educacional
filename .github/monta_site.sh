#!/bin/sh
# Monta em _site/ o que o Cloudflare Pages publica (B4).
#
#   sh .github/monta_site.sh [pasta]                     padrao: _site (o endereco novo, Cloudflare)
#   sh .github/monta_site.sh pasta --endereco-antigo     o GitHub Pages (romulorod1.github.io), com o
#                                                        icone de sempre
#
# Os DOIS enderecos recebem a mesma montagem (13f): desde que VERSAO e CACHE
# sao gerados na publicacao, o GitHub Pages deixou de servir o repositorio cru
# (com o sw.js fixo, o tablet que abrisse o endereco antigo nunca atualizaria).
# Ele e publicado pelo publica-cloudflare.yml, depois do portao verde, como o novo.
#
# Sai do `git ls-files`, e nao da pasta: nada que nao esta no commit (perfil de
# Chrome esquecido, node_modules, rascunho) sobe. E fica de fora o que so serve a
# quem trabalha no repositorio, que o GitHub Pages publicava junto: as provas
# (_teste/), os geradores da biblioteca (biblioteca/), os workflows (.github/),
# o README e todo caminho com um pedaco que comeca por "_" ou ponto
# (banco/topicos/_ids.json, rascunhos). Sem as paginas de _teste/ na origem, nenhuma
# delas roda ao lado do IndexedDB das criancas.
#
# Tambem ficam de fora functions/ e servidor/: o endpoint de IA (Pages Function)
# e o nucleo dele. O wrangler os empacota como codigo do servidor a partir da
# raiz do repositorio; como arquivo estatico, o codigo do servidor nao sobe.
#
# O que o aplicativo pede tem que estar aqui: a prova e o
# _teste/testa_publica_cloudflare.js, que confere toda entrada do ARQUIVOS do
# sw.js e os assuntos do banco/topicos dentro da pasta montada.
#
# A regra de quem sobe mora em _teste/versao_publicada.js (ehDoSite), e nao
# aqui: a mesma regra decide quando o contador da publicacao sobe (13f). Duas
# copias da regra deixariam um arquivo subir ao site sem subir o CACHE.
# As novidades (novidades/*.txt) nao sobem como arquivo: vao dentro do app.js.
#
# Depois de copiar, a VERSAO do app.js, o CACHE do sw.js e as NOVIDADES de
# novidades/ sao escritos no site pelo versao_publicada.js --montar, a partir
# do git (precisa da historia inteira: fetch-depth 0). No repositorio os dois
# ficam fixos no valor de desenvolvimento. Se a geracao falhar, o site NAO e
# montado: publicar o sw.js com o nome de cache ja publicado deixaria o tablet
# com o codigo velho, calado.
set -e
cd "$(dirname "$0")/.."
destino="${1:-_site}"
antigo=0
if [ "${2:-}" = "--endereco-antigo" ]; then antigo=1; elif [ -n "${2:-}" ]; then printf 'monta_site: opcao desconhecida: %s\n' "$2" >&2; exit 2; fi
rm -rf "$destino"
mkdir -p "$destino"
lista=$(node _teste/versao_publicada.js --arquivos-do-site)
[ -n "$lista" ] || { printf 'monta_site: a lista de arquivos do site saiu vazia\n' >&2; exit 1; }
printf '%s\n' "$lista" | while IFS= read -r f; do
  mkdir -p "$destino/$(dirname "$f")"
  cp "$f" "$destino/$f"
done
# O icone do endereco NOVO e outro (pedido do dono, 08/11): NW navy sobre
# dourado, com um livro aberto, para ela distinguir os dois apps na tela
# inicial enquanto o antigo (GitHub Pages) continua no ar com o NW navy de
# sempre. Os arquivos novos moram em icons/pages-dev/ e, so no site do
# Cloudflare, vao por cima dos de icons/ com os MESMOS nomes: o index.html, o
# manifest e o ARQUIVOS do sw.js ficam iguais nos dois enderecos (a
# conferencia-no-ar compara o index.html com o commit). O apple-touch-icon do
# index.html aponta para icons/icon-192.png, que aqui ja e o novo. A pasta
# icons/pages-dev/ nao sobe.
# No endereco antigo o icone fica o de sempre, e a pasta pages-dev so sai.
if [ "$antigo" = "1" ]; then
  rm -rf "$destino/icons/pages-dev"
elif [ -d "$destino/icons/pages-dev" ]; then
  for f in icon-192.png icon-512.png icon-maskable-512.png favicon.png; do
    cp "$destino/icons/pages-dev/$f" "$destino/icons/$f"
  done
  cp "$destino/icons/pages-dev/apple-touch-icon.png" "$destino/icons/apple-touch-icon.png"
  rm -rf "$destino/icons/pages-dev"
fi
# Sem um 404.html na raiz, o Cloudflare Pages trata o site como aplicacao de
# pagina unica e responde 200 com o index.html para QUALQUER caminho que nao
# existe (medido no preview do B4: _teste/confere_tudo.sh voltava 200). Ai um
# arquivo esquecido no ARQUIVOS entraria no cache do worker como index.html,
# calado, e a conferencia-no-ar leria 200. Com ele, caminho que nao existe e 404.
printf '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Apoio Educacional</title><p>Endereço não encontrado. <a href="./">Abrir o aplicativo</a></p></html>\n' > "$destino/404.html"
node _teste/versao_publicada.js --montar "$destino"
printf 'site montado em %s: %s arquivos\n' "$destino" "$(find "$destino" -type f | wc -l | tr -d ' ')"
