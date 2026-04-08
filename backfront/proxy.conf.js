/**
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
  '/api/nutrition/edamam': withAuth({
    target: 'http://localhost:8084',
    timeout: 60000,
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
    target: 'http://localhost:8095',
    timeout: 30000,
    pathRewrite: { '^/graft-api': '' },
  }),
  '/graft-api/**': withAuth({
    target: 'http://localhost:8095',
    timeout: 30000,
    pathRewrite: { '^/graft-api': '' },
  }),
};
