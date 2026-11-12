# Current-site migration — 2026-11-12

The existing deployed revision aad57d8a38bda95c77500ef9e064daef076e6272 is hosted at https://gguiomar.org on ubuntu-eu-central (172.104.244.173).

The local mockup and uncommitted work were not deployed. Existing .html URLs remain unchanged; clean URLs belong to the later redesign.

## Server

- Public release: /var/www/gguiomar/releases/aad57d8
- Active symlink: /var/www/gguiomar/current
- nginx config: /etc/nginx/sites-available/zz-gguiomar.conf (enabled by symlink)
- TLS certificate and private key: /etc/ssl/gguiomar/origin.pem and origin.key. Private key stays on the server, mode 600, in a mode 700 directory.
- Cloudflare Origin CA certificate covers gguiomar.org and www.gguiomar.org, expires 2041-11-08. Replace before expiry.
- Both DNS A records are proxied to 172.104.244.173; SSL mode Full (strict). Keep proxy enabled: origin certificate is trusted by Cloudflare, not directly by browsers.
- HTTP and www redirect permanently to https://gguiomar.org, preserving request path and query.
- Existing vst nginx site and Cog Schema application on port 5002 are unchanged.

The migration includes only public site content. It excludes local untracked files, mockup, Git metadata, Python generators, and maintenance Markdown.

## GitHub Pages

CNAME declares the new canonical domain for the legacy GitHub Pages site. DNS routes the custom domain to the new server, not GitHub. The migration branch can be used as Pages source while this PR is reviewed. Check the GitHub-hosted address for permanent redirects after its build finishes.

## Rollback

First remove the GitHub Pages custom domain and restore its source to main / using repository Pages settings, then confirm https://gguiomar.github.io works. Its original content is retained in Git history and main. Revert Cloudflare records only after choosing and testing the fallback destination; never point Cloudflare to an unready server.

To disable only the new server virtual host, unlink /etc/nginx/sites-enabled/zz-gguiomar.conf, run nginx -t, and reload nginx. Leave vst unchanged. Keep release files and TLS keys for recovery.

For future releases, upload public files to a new release directory and atomically replace the current symlink; retain the previous release to roll back. Automated releases and restricted deployment credentials are not configured by this migration.

## Validation results

All 56 exported public files were downloaded through Cloudflare and matched their local release SHA-256 hashes. HTTP and www redirects return 301 and preserve path/query. The legacy GitHub Pages address returns 301 to http://gguiomar.org, which immediately returns 301 to HTTPS; the final deep link returns 200. GitHub rejected enabling direct HTTPS forwarding because it has no custom-domain certificate. The Cloudflare public HTTPS certificate and origin TLS are working. This extra legacy redirect hop remains.

The initial Python urllib checker received 403 responses; repeating the complete byte-integrity check with curl passed for all files. nginx -t passes, cog-schema is active, and the original IP endpoint still returns its existing /introduction redirect.

A DNS save was initially blocked by automatic approval review while the origin was staged with 503. No record was saved at that point. After installing and verifying the origin certificate and public content, both DNS saves succeeded.
