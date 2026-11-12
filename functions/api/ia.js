/* Endpoint de IA do aplicativo: POST https://apoio-educacional.pages.dev/api/ia
 *
 * Pages Function do Cloudflare. Só liga o núcleo (servidor/ia.mjs) ao mundo:
 * o SDK oficial da Anthropic, o fetch do Firebase e o log. Toda regra (login,
 * lista de uids, limites, modelo, tradução de erro) está no núcleo, que tem
 * prova própria (_teste/testa_ia_endpoint.js).
 *
 * Segredos do projeto Pages (ambiente de produção), nunca no repositório:
 *   ANTHROPIC_API_KEY  a chave da API (colada pelo dono no painel do Cloudflare)
 *   IA_UIDS            uids do Firebase que podem usar, separados por vírgula
 * Sem a chave (prévias de ramo), o endpoint responde "indisponivel".
 *
 * Esta pasta (functions/) e a servidor/ não sobem como arquivo estático: o
 * .github/monta_site.sh as pula, e o testa_publica_cloudflare prova isso.
 */
import Anthropic from '@anthropic-ai/sdk';
import { atender, verificarTokenFirebase, classificarErroDaApi } from '../../servidor/ia.mjs';

// Memória da instância: a janela de frequência e o cache dos logins conferidos.
const taxa = new Map();
const logins = new Map();

export async function onRequest(context) {
  const { request, env } = context;
  // O corpo só é lido pelo núcleo DEPOIS do login e da lista de uids.
  const r = await atender(
    {
      metodo: request.method,
      autorizacao: request.headers.get('Authorization') || '',
      tamanhoDeclarado: request.headers.get('Content-Length'),
      lerCorpo: () => request.text()
    },
    {
      env,
      taxa,
      agora: () => Date.now(),
      registrar: o => console.log(JSON.stringify({ ia: o })),
      verificarToken: (t, permitidos) => verificarTokenFirebase(t, fetch, logins, Date.now(), permitidos),
      chamarModelo: params => {
        // Sem nova tentativa automática: uma chamada que venceu o prazo pode
        // ter sido cobrada, e repetir cobraria duas vezes. O aparelho decide.
        const cliente = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: 120000 });
        return cliente.beta.messages.create(params);
      },
      classificar: e => classificarErroDaApi(e, Anthropic)
    }
  );
  return new Response(JSON.stringify(r.corpo), {
    status: r.status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}
