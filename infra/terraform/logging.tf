# Centralised logs — CloudWatch Logs for the API container.
# Local equivalent: docker compose logs / structured JSON on stdout (Phase 15 observability).

resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${local.name_prefix}/api"
  retention_in_days = var.api_log_retention_days

  tags = {
    Name = "${local.name_prefix}-api-logs"
  }
}

# Optional extensions (not implemented):
# - Log metric filters on "level":"error" for alarms
# - Subscription filter → OpenSearch / third-party SIEM
# - X-Ray sidecar on the ECS task for distributed traces
# Frontend static assets do not emit app logs to this group (browser console only).
