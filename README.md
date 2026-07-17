# Vehicle Inspection AI

A presentation-ready Hack Day application that turns vehicle photos into an
editable first-look inspection report. It runs without third-party packages and
defaults to a safe Demo Mode; an optional Anthropic API key enables live photo
analysis.

> **Demonstration only:** Results are preliminary observations, not final
> appraisals, repair authorizations, vehicle-safety determinations, claim
> decisions, or coverage decisions. A qualified human must review all output.

## Features

- Responsive guided vehicle/photo/report workflow
- Drag-and-drop previews for up to eight JPG, PNG, or WebP images
- Automatic Demo Mode when no API key is configured
- Optional server-side Anthropic integration (the key never reaches the browser)
- Editable/manual findings, cost-range summary, JSON export, and print/PDF view
- Health endpoint, payload limit, safe static paths, caching, and security headers
- No runtime npm dependencies
- GitHub Actions and GitLab CI syntax checks

## Quick start

Requirements: [Node.js](https://nodejs.org/) 18 or newer and Git.

```powershell
git clone <repository-url>
cd vehicle-inspection-ai
node server.js
```

Open <http://localhost:3000>. Select **Load completed demo** to present the app
without uploading photos or configuring an API key.

On macOS/Linux, the same commands work in a terminal. You can also run
`npm start`; there is no `npm install` step because the app uses Node's built-ins.

## Optional live AI mode

1. Copy `.env.example` to `.env`.
2. Add an authorized Anthropic API key to `.env`.
3. Confirm that sending vehicle images to the provider complies with your
   employer's data-handling and AI-use policies.
4. Restart the server. The status badge should read **Live AI mode**.

```powershell
Copy-Item .env.example .env
node server.js
```

Do not commit `.env`; it is intentionally ignored by Git. The configured model
name may change over time, so set `ANTHROPIC_MODEL` to a model currently enabled
for your provider account.

## Configuration

| Variable | Required | Default | Purpose |
|---|---:|---|---|
| `ANTHROPIC_API_KEY` | No | none | Enables live analysis; otherwise Demo Mode |
| `ANTHROPIC_MODEL` | Live only | `claude-3-5-sonnet-latest` | Provider model identifier |
| `PORT` | No | `3000` | Local HTTP port |
| `MAX_REQUEST_BYTES` | No | `10485760` | Maximum JSON request size in bytes |

Health check: `GET /health` returns status and `demo`/`live` mode, but no secret.

## Validate before submitting

```powershell
npm run check
```

Then manually verify Demo Mode, photo selection/removal, report editing, JSON
download, and Print / Save PDF. The included CI files run the syntax check on
GitHub and GitLab.

## Publish to GitHub and job GitLab

Create empty repositories in both services first. Do not initialize either with
a README, license, or `.gitignore`, because those files already exist here.
Replace the placeholders below with the HTTPS or SSH URLs shown by each service.

### First publication

```powershell
git init
git add .
git commit -m "Initial vehicle inspection app"
git branch -M main
git remote add github <GITHUB_REPOSITORY_URL>
git remote add gitlab <JOB_GITLAB_REPOSITORY_URL>
git push -u github main
git push -u gitlab main
```

If company GitLab requires VPN, SSO, a personal access token, a specific group,
or a protected default branch, follow the job-provided instructions. Never place
tokens directly in a remote URL that will be saved or shared.

### Normal updates to both remotes

```powershell
git add .
git commit -m "Describe the update"
git push github main
git push gitlab main
```

Check the setup at any time with `git remote -v`. If GitLab requires a branch
other than `main`, push explicitly, for example `git push gitlab main:required-branch`.

### Optional: one remote with two push destinations

The two named remotes above are clearer for a first submission. Advanced users
can instead configure multiple push URLs, but should keep separate remotes when
access rules or branch names differ.

## Repository layout

```text
.
├── .github/workflows/ci.yml  # GitHub validation
├── .env.example              # Safe configuration template
├── .gitlab-ci.yml            # GitLab validation
├── app.js                    # Browser behavior and report editor
├── index.html                # Application interface
├── server.js                 # Static server and AI proxy
├── styles.css                # Responsive and print styling
├── CONTRIBUTING.md
├── LICENSE
└── SECURITY.md
```

## Privacy, branding, and licensing

- Use synthetic, authorized, or consented photos only. Avoid license plates,
  people, documents, claim identifiers, VINs, and other personal information.
- No company name, trademark, logo, endorsement, or affiliation is claimed by
  this repository. Obtain approval before adding employer branding.
- Source code is offered under the [MIT License](LICENSE). Confirm that an
  open-source license and public GitHub publication are permitted by your job.
  If the work is confidential or employer-owned, keep both repositories private
  and replace the license only with authorized legal guidance.
- See [SECURITY.md](SECURITY.md) before using live mode or reporting a problem.

## Production limitations

This is a Hack Day prototype, not a production service. It has no authentication,
database, persistent audit trail, malware scanning, image redaction, rate limiter,
TLS termination, or formal model evaluation. Do not expose it directly to the
public internet or use it for real claims without an approved architecture,
privacy/security review, accessibility testing, monitoring, and human-oversight
process.
