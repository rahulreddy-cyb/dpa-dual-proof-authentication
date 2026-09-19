# Security Policy

This repository is a research prototype. Do not use it as a production identity
provider without an independent security review.

Report vulnerabilities privately to the repository owner rather than opening a
public issue when the report contains exploitable details.

Important deployment requirements:
- HTTPS/TLS
- secure cookies
- CSRF protection appropriate to the chosen frontend architecture
- secrets encrypted at rest
- hardened database access
- strong account recovery controls
- monitoring and alerting
- dependency updates
- independent penetration testing
