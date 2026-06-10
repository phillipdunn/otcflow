# Phase 16 — Terraform infrastructure skeleton (local notes)

**How phase docs are structured:** **Scope** → **Walkthrough (slow)** → **Diagram** → **Key files** → **Checklist** → **Later** → **Review one-liner**.

---

## Scope (what Phase 16 was)

- Educational **Terraform** layout under **`infra/terraform/`** — illustrates a possible AWS deployment.
- Maps Docker Compose services (web, api, postgres) to **S3 + CloudFront**, **ECS Fargate + ALB**, **RDS PostgreSQL**.
- Files only — **not applied** from this repo; no secrets in committed `.tf` files.
- Renamed **`backend.tf` → `api.tf`** to avoid confusion with Terraform state backend.
- Root **README** § Infrastructure skeleton; **`infra/terraform/README.md`** file guide.
- **Not added:** live `terraform apply`, CI terraform plan, remote state bucket, IAM roles wired end-to-end.

**Builds on:** [phase-10-docker-compose.md](phase-10-docker-compose.md) (Compose as the mental model for services).

---

## What problem this solves

| Before (Phase 10) | After (Phase 16) |
| ----------------- | ---------------- |
| Compose-only mental model | Named cloud building blocks (VPC, ALB, RDS, CDN) |
| No IaC in repo | Reviewable skeleton for a future platform design |
| Unclear where secrets/logs live | `secrets.tf`, `logging.tf` placeholders |

**Boundary:** learning and design review — not production deploy.

---

## Walkthrough (slow)

### 1. Layout

| Terraform file | Cloud role |
| -------------- | ---------- |
| `networking.tf` | VPC, subnets, NAT, security groups |
| `frontend.tf` | S3 + CloudFront (Vite static build) |
| `api.tf` | ECR, ALB, ECS Fargate |
| `database.tf` | RDS PostgreSQL 16 (private subnets) |
| `logging.tf` | CloudWatch log group for API |
| `secrets.tf` | Secrets Manager placeholders |

### 2. Variables and outputs

- **`terraform.tfvars.example`** — copy to gitignored `terraform.tfvars`.
- Key inputs: `aws_region`, `aws_account_id`, optional `api_listener_certificate_arn`.
- Outputs: CDN URL, ALB DNS, RDS endpoint hints, secret ARNs.

### 3. How to explore locally

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# edit aws_account_id, region
terraform init
terraform plan   # requires AWS credentials; review only
```

---

## Diagram

```text
Internet → CloudFront → S3 (web static)
         → ALB :443/:80 → ECS Fargate (api) → RDS (private)
                              ↑ Secrets Manager (DATABASE_URL, CORS)
```

---

## Key files

- `infra/terraform/*.tf`, `README.md`, `terraform.tfvars.example`
- Root `README.md` — Infrastructure skeleton section

---

## Checklist

- [ ] Read `infra/terraform/README.md` file guide
- [ ] Trace Compose service → Terraform resource mapping
- [ ] Understand public vs private subnets (ALB public, API/RDS private)
- [ ] Confirm no real secrets committed

---

## Later

- Remote state (S3 + DynamoDB lock)
- `terraform plan` in CI (read-only)
- Separate ECS service per logical boundary (post Phase 19 extraction)
- WAF, ACM cert, multi-AZ RDS hardening

---

## Review one-liner

**Phase 16** adds an **educational AWS Terraform skeleton** that maps the Compose stack to CDN + Fargate + RDS — files and docs only, not deployed from the repo.
