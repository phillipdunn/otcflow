# OTCFlow — Terraform infrastructure skeleton (Phase 16)

Educational **infrastructure-as-code** layout showing how OTCFlow *could* run on AWS. This is **not** wired to CI, **not** validated against a live account in this repo, and **must not** be applied blindly (it creates billable resources).

**Do not** put passwords, API keys, or real connection strings in `.tf` files or committed `terraform.tfvars`.

## What this is for

- Learn how Docker Compose services map to managed cloud building blocks
- Review naming, networking, and security group boundaries before a real platform design
- See where secrets, logs, and entry points would live

## File guide

| File | Purpose |
|------|---------|
| `versions.tf` | Terraform and AWS provider version constraints |
| `main.tf` | AWS provider, shared `locals` and tags |
| `variables.tf` | All inputs (region, sizing, CORS placeholder, optional cert ARN) — **no secrets** |
| `outputs.tf` | URLs and ARNs for post-deploy steps (S3 sync, secret population, web build args) |
| `networking.tf` | VPC, public/private subnets, NAT gateway, security groups (ALB / API / DB) |
| `frontend.tf` | S3 bucket + CloudFront CDN for the Vite static build |
| `api.tf` | ECR, Application Load Balancer, ECS Fargate service (API container) |
| `database.tf` | RDS PostgreSQL 16 (private subnets, encrypted storage) |
| `logging.tf` | CloudWatch log group for API container logs |
| `secrets.tf` | Secrets Manager **containers only** — values added outside Terraform |
| `terraform.tfvars.example` | Example variable values (copy to `terraform.tfvars`, gitignored) |
| `.gitignore` | Ignores state, `.terraform/`, and local `*.tfvars` |

## Variables you must set

| Variable | Required | Notes |
|----------|----------|-------|
| `aws_region` | Yes | Any region you choose; not hardcoded in resources |
| `aws_account_id` | Yes | Used in S3 bucket name and ECR image URI placeholder |
| `api_listener_certificate_arn` | No | Empty = ALB listens on HTTP :80 (sandbox). Set for HTTPS :443. |
| `cors_allowed_origin` | For secret content | Usually `https://<cloudfront-domain>` after CDN exists |
| Others | No | Sensible defaults (`project_name`, `db_name`, Fargate size, etc.) |

See `terraform.tfvars.example`.

## What would be created (high level)

If you ran `terraform apply` with valid AWS credentials:

1. **Network** — VPC, 2 AZs, public subnets (ALB), private subnets (API + RDS), NAT gateway
2. **Frontend** — Private S3 bucket, CloudFront distribution (HTTPS to viewers)
3. **API** — ECR repository, internet-facing ALB, ECS Fargate tasks in private subnets
4. **Database** — RDS PostgreSQL 16, reachable only from API security group
5. **Logging** — CloudWatch log group `/ecs/<prefix>/api`
6. **Secrets** — Empty Secrets Manager secrets for `DATABASE_URL` and `CORS_ORIGIN`

Estimated monthly cost if left running: non-trivial (NAT gateway, ALB, Fargate, RDS). **Use `terraform plan` only** unless you intend to pay for a sandbox.

## Intentionally incomplete

| Gap | Why |
|-----|-----|
| Remote state backend | Comment template in `versions.tf` — add S3 + DynamoDB lock before team use |
| ACM + custom domains | `frontend_domain_name` variable exists; DNS/validation not automated |
| Secret **values** | Populated via AWS CLI/Console after RDS exists |
| CI/CD pipeline | No GitHub Action to build/push ECR or `s3 sync` |
| WebSocket ALB tuning | Sticky sessions, idle timeout, WSS termination notes only |
| WAF, Shield, GuardDuty | Security hardening deferred |
| Multi-AZ RDS, autoscaling | Single-AZ / fixed `desired_count` skeleton |
| IAM task role for app | Only execution role + Secrets read sketched |
| GraphQL path routing | Same ALB could forward `/graphql`; not split here |
| Prometheus `/metrics` | Logs only; metrics export to observability stack not defined |
| `manage_master_user_password` → app URL | Script to copy RDS secret into app `DATABASE_URL` secret |

## Local commands (read-only exploration)

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars — still do not add secrets

terraform init    # downloads provider; no AWS changes
terraform validate
terraform plan    # shows proposed resources; requires AWS credentials
```

**Do not run `terraform apply`** unless you own a sandbox account and accept cost + cleanup.

## Map: Docker Compose → this skeleton

| `docker-compose.yml` service | Local role | Cloud sketch |
|-----------------------------|------------|--------------|
| **web** | nginx serves `apps/web/dist` on host `:5173` | S3 + CloudFront; build with `VITE_API_URL` / `VITE_WS_URL` pointing at public API URL |
| **api** | Express + WS on `:3000`, `DATABASE_URL` env | ECS Fargate behind ALB; same env vars from Secrets Manager; image from `apps/api/Dockerfile` via ECR |
| **postgres** | `postgres:16-alpine` volume on `:5433` | RDS PostgreSQL 16 in private subnets; no host port published |

| Compose concept | Cloud sketch |
|-----------------|--------------|
| Compose network `default` | VPC + security groups (API ↔ DB only on 5432) |
| `POSTGRES_PASSWORD` in `.env` | RDS managed password + Secrets Manager (not in git) |
| `docker compose logs api` | CloudWatch Logs log group |
| Browser → `localhost:5173` / `localhost:3000` | Browser → CloudFront (web) and ALB DNS (API / WSS) |
| `prisma migrate deploy` on api start | Same entrypoint in container; run against RDS endpoint |

### Request flow (simplified)

```
Browser
  ├─ HTTPS → CloudFront → S3 (static React/Vite app)
  └─ HTTP(S) → ALB → ECS Fargate (Express + /ws/deals WebSocket)
                      └─ PostgreSQL (RDS, private subnet)
```

## Post-deploy checklist (manual, not automated)

1. Build and push API image to `api_ecr_repository_url` output
2. `aws s3 sync` Vite `dist/` to `frontend_bucket_name`; invalidate CloudFront
3. Put full `DATABASE_URL` in `database_url_secret_arn` (after RDS is up)
4. Put `frontend_cdn_url` (or custom domain) in `cors_origin_secret_arn`
5. Force new ECS deployment so tasks pick up secrets
6. Rebuild web with `VITE_API_URL` / `VITE_WS_URL` from `api_url` output
7. Run seed/migrate as you do locally (`docker-entrypoint.sh` handles migrate on start)

## Provider note

Resources use the **HashiCorp AWS provider** as a widely taught example. The same logical diagram (CDN + container + managed SQL + LB + logs + secrets) maps to other clouds with different resource names.
