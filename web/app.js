// Entry point for hosting panels using Phusion Passenger (e.g. Plesk).
// Run `npm ci` and `npm run build` in this directory before starting.
const http = require("node:http");
const next = require("next");

const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  http.createServer((req, res) => {
    Promise.resolve(handle(req, res)).catch((error) => {
      console.error("Request failed", error);
      if (!res.headersSent) res.writeHead(500);
      res.end("Internal Server Error");
    });
  }).listen(Number(process.env.PORT) || 3000, () => {
    console.log("Next.js server is ready");
  });
}).catch((error) => {
  console.error("Next.js failed to start; run npm run build first", error);
  process.exit(1);
});
