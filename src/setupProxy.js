// https://www.npmjs.com/package/http-proxy-middleware
const _ = require("lodash");
const { createProxyMiddleware } = require("http-proxy-middleware");
const filter = function(pathname, req) {
  return !(
    pathname === "/" ||
    _.startsWith(pathname, "/static") ||
    _.startsWith(pathname, "/manifest.json")
  );
};
module.exports = function(app) {
  app.use(
    createProxyMiddleware(filter, {
      target: process.env.BACKEND_URL,
      changeOrigin: true
    })
  );
};
