# Dados curados do gerador

## `mencoes_portal.csv`

As 11 menções ao Portal da Matemática que existem **no conteúdo** das páginas de teoria das sete séries, uma por linha, com série, arquivo, página e o trecho em volta (sem acento, sem maiúscula, como o texto vai para o pacote).

Por que a lista existe: a marca d'água escrevia "Portal" atravessado no meio do conteúdo, e o texto do pacote ficava com centenas de pedaços dela. Depois da remoção sobram estas 11, que são menção de verdade ("encontrados no próprio portal", "as próprias vídeo-aulas do portal", "no portal da matemática"). Em vez de olhar o resíduo e aprovar de olho, a lista é curada e versionada: `trava_mencoes_portal`, em `_prova_gerador.py`, reprova qualquer menção fora dela.

Como mexer: se o Portal publicar PDF novo e aparecer menção nova, a prova reprova apontando a página e o trecho. Aí se lê a página, se confirma que é conteúdo e se acrescenta a linha — nunca o contrário.

Conferido em 22/09/2026 sobre os sete pacotes da versão nova (6º, 7º e 8º ano, 9º ano v4, 1ª, 2ª e 3ª série).
