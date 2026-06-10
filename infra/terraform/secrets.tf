# Secrets placeholders — names and IAM wiring only; values live outside Terraform.
# Local equivalent: POSTGRES_PASSWORD and DATABASE_URL in docker-compose / apps/api/.env (never committed).

resource "aws_secretsmanager_secret" "database_url" {
  name        = "${local.name_prefix}/database-url"
  description = "Full PostgreSQL connection string for Prisma (DATABASE_URL). Populate after RDS is created."

  tags = {
    Name = "${local.name_prefix}-database-url"
  }
}

resource "aws_secretsmanager_secret" "cors_origin" {
  name        = "${local.name_prefix}/cors-origin"
  description = "API CORS_ORIGIN — typically the CloudFront HTTPS URL for the web app."

  tags = {
    Name = "${local.name_prefix}-cors-origin"
  }
}

# Do NOT use terraform apply to set secret values in version control.
# Example (run locally with real credentials, never commit output):
#   aws secretsmanager put-secret-value \
#     --secret-id <database-url-secret-arn> \
#     --secret-string 'postgresql://...'
#
# RDS manage_master_user_password creates a separate AWS-managed secret for the master user;
# the application secret above should use an app user + least privilege in a production pass.
