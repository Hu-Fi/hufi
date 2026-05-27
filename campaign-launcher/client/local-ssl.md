1. install `mkcert` and `caddy`
2. mkcert -install
3. create certs
```
mkdir -p ./.certs && mkcert \
  -cert-file ./.certs/dev-local.pem \
  -key-file ./.certs/dev-local-key.pem \
  ui.hufi.local
```
4. Add `127.0.0.1       ui.hufi.local` to `/etc/hosts` file
5. caddy run
