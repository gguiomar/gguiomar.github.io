# Website deployment

Production: https://gguiomar.org. The mockup is separate and is never included automatically.

## Publish

Push or merge into `main`. `.github/workflows/deploy.yml` runs receiver security tests, builds the allowlisted public files, uploads an artifact, deploys to the origin, checks HTTPS, then publishes legacy redirect pages to GitHub Pages. Pull requests only build and test; they cannot use the production key.

`deployment/public-files.json` is the explicit public-file list. Add new production assets here when ready to publish them. Local/untracked files, mockup, Git metadata, deployment tooling, and credentials are excluded. Only Git-tracked files are accepted. Build locally with `python3 deployment/build.py`; output is in ignored `build/`.

GitHub's `production` environment permits only the `main` branch and holds `WEBSITE_DEPLOY_KEY`. The pinned server host key is in the workflow. Rotate the dedicated deployment key by replacing its server authorized key and GitHub environment secret; do not commit private keys.

## Origin and security

- SSH alias: ubuntu-eu-central, address 172.104.244.173.
- Restricted account: website-deploy, no sudo privileges. Its root-owned authorized_keys forces `/usr/local/bin/website-release`; SSH forwarding and PTY are disabled.
- Root-owned receiver source: `deployment/receive.py`. Updating this file in Git does not install it automatically; an administrator must install it on the server after review.
- Account can update `/var/www/gguiomar`, not nginx, TLS keys, or the existing application.
- Releases: `/var/www/gguiomar/releases/<commit>`. `current` is switched atomically only after archive path/type/size checks and file-digest verification. `previous` records the preceding target. Existing releases are retained; monitor disk use and prune old inactive releases manually.
- Original release `aad57d8` is preserved. `652a85a` was used to test deployment, rollback, and idempotent redeployment with identical content.
- nginx: `/etc/nginx/sites-available/zz-gguiomar.conf`, enabled by symlink. Configuration in `deployment/nginx.conf`.
- TLS: `/etc/ssl/gguiomar/origin.pem` and `origin.key`. Private key remains on server, mode 600, directory mode 700.
- Origin CA certificate covers root and www and expires 2041-11-08; replace before expiry.
- Both Cloudflare A records are proxied to 172.104.244.173, using Full (strict). Keep the proxy enabled: the origin certificate is trusted by Cloudflare, not directly by browsers.
- HTTP and www permanently redirect to HTTPS root, preserving path and query.
- Existing vst nginx config and Cog Schema service on port 5002 remain unchanged.

## Rollback

Open Actions → Deploy website → Run workflow, choose main, and set `rollback_release` to an existing release ID (for example `aad57d8`). This atomically switches current to that release; no upload or nginx restart is needed. Leave the field blank to deploy the selected main commit. Re-running an already deployed commit is safe if the release contents match.

An administrator can inspect `readlink /var/www/gguiomar/current` and `readlink /var/www/gguiomar/previous`. Retained release IDs are directory names under releases. Rollback is manual if the public post-deploy check fails.

## Legacy GitHub Pages address

GitHub Pages uses Actions and has no custom domain configured. Its artifact contains redirect HTML for existing HTML paths plus a 404 fallback, not the production site. JavaScript sends visitors directly to the same path/query/fragment on https://gguiomar.org. Meta refresh and a visible link provide a fallback without JavaScript, but do not preserve dynamic query/fragment values.

These are browser-side redirects, not HTTP 301 responses. GitHub Pages cannot configure arbitrary HTTP redirects; removing its old custom-domain forwarding removes the intermediate HTTP hop. Direct non-HTML downloads through the old address receive the redirect fallback; update download links to the new domain. Existing `.html` production URLs remain unchanged until the redesign is ready.

To restore the historical GitHub-hosted site, switch Pages to branch deployment from the original revision on a recovery branch and remove any custom domain. Do not change Cloudflare DNS until the fallback is tested.

## Validation

The initial migration verified all 56 public files byte for byte through Cloudflare, HTTP/www redirects, nginx configuration, and the existing app. Automated receiver tests reject traversal and link entries and bad hashes, and test atomic activation/rollback. Production deployment and rollback were exercised using the restricted account; arbitrary commands were rejected.
