# Submission checklist

## Before publishing

- [ ] Confirm the GitHub repository may be public; otherwise set it to private.
- [ ] Confirm the job GitLab group/project and required branch name.
- [ ] Confirm employer approval for the MIT license or replace it as directed.
- [ ] Search the full Git history for API keys and private/customer information.
- [ ] Keep `.env`, real vehicle photos, tokens, VINs, plates, and claim data out.
- [ ] Run `npm run check` and complete the manual checks in `README.md`.

## After publishing

- [ ] Confirm both remotes with `git remote -v`.
- [ ] Confirm the `main` branch and all expected files appear on both services.
- [ ] Confirm GitHub Actions and GitLab CI complete successfully.
- [ ] Add the required reviewers or job collaborators.
- [ ] Apply branch protection if the repository will be maintained.
- [ ] Submit the exact GitHub and GitLab links requested by the event/job.

## Presentation

- [ ] Start the server before the demo and verify `/health`.
- [ ] Prefer **Load completed demo** for predictable presentation output.
- [ ] State that the output is preliminary and requires human review.
- [ ] Keep a saved PDF or screenshots as a fallback if local networking fails.
