# Security policy

## Reporting

Do not open a public issue for a suspected vulnerability or exposed secret.
Report it through your employer's approved private security channel or contact
the repository owner privately. Include reproduction steps without real
customer data.

## Data and secrets

- Never commit `.env`, API keys, customer information, claim numbers, VINs, or
  real inspection photos.
- Use only authorized, synthetic, or consented images.
- The browser sends selected photos to this local server; live mode forwards
  them to the configured AI provider. Review employer policy before use.
- Rotate a credential immediately if it is accidentally committed. Removing it
  in a later commit does not remove it from Git history.
- This demo is not a production appraisal, safety inspection, or coverage
  decision system. Human review is required.

## Supported versions

This demonstration repository supports only its latest default branch.
