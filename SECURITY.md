# Security

Report vulnerabilities privately through GitHub’s Security tab when available. Otherwise, request a private reporting channel in an issue without posting exploit details. Keep backups, health information and credentials out of public reports.

## Local data

Milo saves training in browser storage. It has no account system, analytics or cloud synchronization. Browser eviction, clearing site data or losing a device can lose workouts. Keep independent backups.

A complete backup includes the supported trainer states and Together’s conditioning data. Outcome goals are stored with Muscle or Strength. CSV exports contain workout sets and are not complete backups.

Settings can encrypt a backup with a passphrase. Encryption uses PBKDF2-SHA256 with a random salt and AES-GCM with a random nonce. The passphrase is required to decrypt; Milo cannot recover it.

Only restore files you trust. JSON validation limits each supported backup to 2 MB and bounds structure complexity. CSV import has separate limits. Restore validates before replacement and attempts rollback if storage fails. These safeguards do not remove browser storage limits.

Erase everything in Settings removes Milo’s local records and preferences after confirmation. Save a backup first when you need to retain them. Erasing the browser copy does not delete files already exported elsewhere.

## Hosting and code

The published app uses GitHub Pages without a backend or API key. Hash-based content security policy and script integrity checks restrict executable content. Inline handlers and third-party scripts are blocked.

Hosts supporting `_headers` can apply its framing and MIME protections. GitHub Pages does not apply that file. Other applications on the same origin can share its storage boundary; a dedicated origin is stronger isolation.

After changing app assets, regenerate integrity metadata and run all checks. Keep hosting credentials private, review access regularly, and use strong account authentication. Tests reduce risk but do not prove the absence of defects.
