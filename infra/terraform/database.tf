# Managed PostgreSQL (RDS).
# Local equivalent: postgres service in docker-compose.yml (postgres:16-alpine volume).

resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${local.name_prefix}-db-subnets"
  }
}

resource "aws_db_instance" "main" {
  identifier = "${local.name_prefix}-postgres"

  engine         = "postgres"
  engine_version = "16"
  instance_class = var.db_instance_class

  db_name  = var.db_name
  username = var.db_username

  # Master password managed by RDS + Secrets Manager — never put a password in .tf or tfvars.
  manage_master_user_password = true

  allocated_storage     = var.db_allocated_storage_gb
  storage_type          = "gp3"
  storage_encrypted     = true
  backup_retention_period = var.db_backup_retention_days

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.database.id]

  publicly_accessible = false
  skip_final_snapshot = true
  deletion_protection = false

  # Single-AZ skeleton; Multi-AZ and read replicas are intentionally omitted.

  tags = {
    Name = "${local.name_prefix}-rds"
  }
}

# After apply: compose DATABASE_URL from RDS endpoint + secret from manage_master_user_password
# and store the full connection string in aws_secretsmanager_secret.database_url (manual or script).
# Prisma migrate deploy runs at container start (see apps/api/docker-entrypoint.sh) — same as Compose.
