/**
 * Proxy dev Angular → backends locaux.
 *
 * Connexion : POST /api/auth/login est relayée vers NEPHRO (http://localhost:8089).
 * Si vous voyez ERR_CONNECTION_REFUSED / status 0 : démarrez NEPHRO sur 8089, puis `ng serve` depuis ce dossier.
 *
 * Transmet explicitement Authorization vers les backends (évite des 401/500 bizarres avec le proxy).
 * @type {import('http-proxy-middleware').Options}
 */
function forwardAuth(proxyReq, req) {
  const auth = req.headers.authorization || req.headers.Authorization;
  if (auth) {
    proxyReq.setHeader('Authorization', auth);
  }
}

function withAuth(opts) {
  return {
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
    ...opts,
    onProxyReq: forwardAuth,
  };
}

module.exports = {
  // =======================
  // HuggingFace — classification image (proxy obligatoire pour éviter CORS)
  // =======================
  '/hf': {
    target: 'https://api-inference.huggingface.co',
    changeOrigin: true,
    secure: false,
    pathRewrite: { '^/hf': '' },
  },

  // =======================
  // OpenFoodFacts — valeurs nutritionnelles
  // =======================
  '/openfoodfacts': {
    target: 'https://world.openfoodfacts.org',
    changeOrigin: true,
    secure: false,
    pathRewrite: { '^/openfoodfacts': '' },
  },

  // =======================
  // Nutrition_Service (8088)
  // =======================
  '/api/nutrition/suggestions': withAuth({
    target: 'http://localhost:8088',
    timeout: 30000,
  }),
  '/api/nutrition/lab': withAuth({
    target: 'http://localhost:8088',
    timeout: 30000,
  }),
  '/api/nutrition/lab/**': withAuth({
    target: 'http://localhost:8088',
    timeout: 30000,
  }),
  '/api/nutrition/menus-semaine': withAuth({
    target: 'http://localhost:8088',
    timeout: 60000,
  }),
  '/api/nutrition/menus-semaine/**': withAuth({
    target: 'http://localhost:8088',
    timeout: 60000,
  }),
  '/api/nutrition/stats': withAuth({
    target: 'http://localhost:8088',
    timeout: 60000,
  }),
  '/api/nutrition/stats/**': withAuth({
    target: 'http://localhost:8088',
    timeout: 60000,
  }),
  '/api/aliments': withAuth({
    target: 'http://localhost:8088',
    timeout: 30000,
  }),
  '/api/aliments/**': withAuth({
    target: 'http://localhost:8088',
    timeout: 30000,
  }),
  '/api/besoins-nutritionnels': withAuth({
    target: 'http://localhost:8088',
    timeout: 30000,
  }),
  '/api/besoins-nutritionnels/**': withAuth({
    target: 'http://localhost:8088',
    timeout: 30000,
  }),
  '/api/restrictions-alimentaires': withAuth({
    target: 'http://localhost:8088',
    timeout: 30000,
  }),
  '/api/restrictions-alimentaires/**': withAuth({
    target: 'http://localhost:8088',
    timeout: 30000,
  }),
  '/api/alertes-nutrition': withAuth({
    target: 'http://localhost:8088',
    timeout: 30000,
  }),
  '/api/alertes-nutrition/**': withAuth({
    target: 'http://localhost:8088',
    timeout: 30000,
  }),
  // SockJS/STOMP (NEPHRO) : endpoint /ws (HTTP + upgrade ws si nécessaire)
  '/ws': withAuth({
    target: 'http://localhost:8089',
    timeout: 30000,
    ws: true,
  }),
  '/ws/**': withAuth({
    target: 'http://localhost:8089',
    timeout: 30000,
    ws: true,
  }),
  /** Auth Keycloak (NEPHRO) — explicite pour éviter toute ambiguïté avec les autres /api. */
  '/api/auth': withAuth({
    target: 'http://localhost:8089',
    timeout: 30000,
  }),
  '/api/auth/**': withAuth({
    target: 'http://localhost:8089',
    timeout: 30000,
  }),
  '/api': withAuth({
    target: 'http://localhost:8089',
    timeout: 30000,
  }),
  '/suivis': withAuth({ target: 'http://localhost:8089', timeout: 30000 }),
  '/suivis/**': withAuth({ target: 'http://localhost:8089', timeout: 30000 }),
  '/uploads': withAuth({ target: 'http://localhost:8089' }),
  '/uploads/**': withAuth({ target: 'http://localhost:8089' }),
  '/projet': withAuth({ target: 'http://localhost:8081', timeout: 30000 }),
  '/projet/**': withAuth({ target: 'http://localhost:8081', timeout: 30000 }),
  '/prescription': withAuth({
    target: 'http://localhost:8086',
    timeout: 30000,
    pathRewrite: { '^/prescription': '' },
  }),
  '/prescription/**': withAuth({
    target: 'http://localhost:8086',
    timeout: 30000,
    pathRewrite: { '^/prescription': '' },
  }),
  '/vital': withAuth({
    target: 'http://localhost:8082',
    timeout: 30000,
    pathRewrite: { '^/vital': '' },
  }),
  '/vital/**': withAuth({
    target: 'http://localhost:8082',
    timeout: 30000,
    pathRewrite: { '^/vital': '' },
  }),
  '/graft-api': withAuth({
    target: 'http://localhost:8096',
    timeout: 30000,
    pathRewrite: { '^/graft-api': '' },
  }),
  '/graft-api/**': withAuth({
    target: 'http://localhost:8096',
    timeout: 30000,
    pathRewrite: { '^/graft-api': '' },
  }),
};
