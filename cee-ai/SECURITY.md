# Security Policy

## Supported Versions

Only the active release line is supported for security updates:

| Version | Supported |
| ------- | --------- |
| v1.0.x  | Yes       |
| < v1.0  | No        |

## Reporting a Vulnerability

We take the security of community microgrids seriously. If you discover a vulnerability, please report it privately:

1. Email your findings to `security@cee-ai.org` (or contact RWA platform administration).
2. Do not open a public GitHub issue for security bugs.
3. Allow up to 48 hours for our team to acknowledge and coordinate a patch.

## Critical Invariants

The following components are subject to strict security audits:
- **Ledger Netting**: All credits must follow the zero-sum ledger accounting logic in `src/app/api/v1/ledger`.
- **Emergency Override**: Deterministic medical load-shedding overrides must function independently of AI scheduling failures.
- **OEM Integrations**: Encrypted hybrid inverter auth credentials stored in database tables must use AES-256-GCM.
