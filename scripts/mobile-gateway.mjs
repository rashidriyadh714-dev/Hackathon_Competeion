import http from 'http';

const GATEWAY_PORT = process.env.GATEWAY_PORT || 8082;
const API_PORT = process.env.API_PORT || 5001;
const WEB_PORT = process.env.WEB_PORT || 8081;

const server = http.createServer((req, res) => {
  const isApi = req.url.startsWith('/api') || req.url.startsWith('/healthz');
  const targetPort = isApi ? API_PORT : WEB_PORT;

  const proxyReq = http.request(
    {
      hostname: '127.0.0.1',
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `127.0.0.1:${targetPort}`,
        'x-forwarded-host': req.headers.host || '',
        'x-forwarded-proto': 'https',
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    console.error(`[Gateway] Error forwarding to port ${targetPort} (${req.url}):`, err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: `Backend service on port ${targetPort} unavailable` } }));
  });

  req.pipe(proxyReq);
});

// Proxy WebSocket upgrades (required for Metro hot-reload and Expo bundler)
server.on('upgrade', (req, socket, head) => {
  const isApi = req.url.startsWith('/api') || req.url.startsWith('/healthz');
  const targetPort = isApi ? API_PORT : WEB_PORT;

  const proxyReq = http.request({
    hostname: '127.0.0.1',
    port: targetPort,
    path: req.url,
    method: req.method,
    headers: req.headers,
  });

  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    socket.write(
      `HTTP/1.1 101 Switching Protocols\r\n` +
        Object.keys(proxyRes.headers)
          .map((h) => `${h}: ${proxyRes.headers[h]}`)
          .join('\r\n') +
        '\r\n\r\n'
    );
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });

  proxyReq.on('error', (err) => {
    socket.destroy();
  });

  proxyReq.end();
});

server.listen(GATEWAY_PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`ActionLayer Unified Mobile Gateway running on port ${GATEWAY_PORT}`);
  console.log(`- Web & Assets: Forwarding to Metro (Port ${WEB_PORT})`);
  console.log(`- API Routes:  Forwarding to Express API (Port ${API_PORT})`);
  console.log(`======================================================\n`);
});
