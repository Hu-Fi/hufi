1. Install [`mkcert`](https://github.com/FiloSottile/mkcert#installation)
2. Run `mkcert -install` (you need it just once after installation)
3. Create certs
```
mkdir -p ./.certs && mkcert \
  -cert-file ./.certs/dev-local.pem \
  -key-file ./.certs/dev-local-key.pem \
  ui.hufi.local localhost 127.0.0.1 ::1
```
4. Add `ui.hufi.local` to `/etc/hosts`
5. Install [`caddy`](https://caddyserver.com/docs/install)
6. `caddy run`
7. Start your app as usual (w/o ssl)
