# Branching Strategy

## Protected Branches

- `main`
- `develop`

## Working Branches

- `feature/<short-name>`
- `bugfix/<short-name>`
- `hotfix/<short-name>`

## Merge Flow

- Merge feature work into `develop`
- Validate through CI before merging
- Merge `develop` into `main` for releases
- Keep API interface changes aligned with `docs/contracts/CONTRACTS.md`
