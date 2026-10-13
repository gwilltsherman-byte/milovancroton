# Security

If you find a security problem, please report it privately. Use GitHub's private
vulnerability reporting from the Security tab when available. If that option is
unavailable, open an issue asking me for a private reporting channel without
including vulnerability details.

Please keep workout backups, health information and credentials out of public issues.
For ordinary bugs, describe the steps you took and the result you expected.

## Your workouts and backups

Milo saves workouts in your browser. It has no account system, analytics or cloud
sync. Export a backup before clearing browser data or changing devices. Only
restore backups you trust.

Milo accepts its own supported backup versions and storage keys, with a 2 MB
import limit. It validates each section before restoring data and rolls back
the restore if a save fails. These checks do not replace your own backups.

The published app uses GitHub Pages and does not need a backend or API key.
Its page limits scripts through a content security policy. Hosts that support
`_headers` also apply the framing and MIME protections in that file; GitHub
Pages does not apply `_headers`.

## Repository and fork security

Every branch in this repository blocks force pushes and deletion, including for
administrators. If you maintain a fork, apply equivalent protection and choose
status checks that fit your contribution process.

Use passkeys or hardware security keys for GitHub and hosting accounts, keep
recovery codes offline, and review installed apps and token permissions. Check
usage limits and billing alerts before enabling paid runners, large build
artifacts, Codespaces, LFS or other metered services on a fork.

Keep the app updated and retain backups. These safeguards reduce risk but cannot
prevent every software defect.
