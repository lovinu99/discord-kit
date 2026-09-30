# Security Policy

## Reporting a vulnerability

Please do not open a public issue for a security vulnerability. Use GitHub's
private security advisory flow for this repository, or contact the maintainer
through a private channel.

Include the affected version, reproduction steps, impact, and a minimal proof
of concept. Do not include real webhook URLs, tokens, or personal data.

## Webhook security

Discord webhook URLs are credentials. Never commit them to source control,
issues, pull requests, logs, screenshots, or package artifacts. Load them from
environment variables or a secret manager. If a webhook is exposed, revoke or
regenerate it immediately in Discord.

This package does not read `.env` files and does not log webhook URLs.