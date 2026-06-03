# ==========================================
# HyperPush — Makefile
# ==========================================
# 常用命令快捷方式
# ==========================================

# ─────────────────────────────────────────
# 开发环境（热更新）
# ─────────────────────────────────────────

# 启动所有服务（开发模式）
dev-up:
	docker compose -f compose.yml -f compose.dev.yml up -d --build

# 查看日志
dev-logs:
	docker compose -f compose.yml -f compose.dev.yml logs -f

# 停止所有服务
dev-down:
	docker compose -f compose.yml -f compose.dev.yml down

# 重启单个服务（后端热更新）
dev-restart-app:
	docker compose -f compose.yml -f compose.dev.yml restart app

# 查看容器状态
dev-ps:
	docker compose -f compose.yml -f compose.dev.yml ps

# ─────────────────────────────────────────
# 生产环境
# ─────────────────────────────────────────

# 启动所有服务（生产模式）
prod-up:
	docker compose -f compose.yml -f deploy/compose.prod.yml up -d --build

# 查看日志
prod-logs:
	docker compose logs -f

# 停止所有服务
prod-down:
	docker compose down

# 查看容器状态
prod-ps:
	docker compose ps

# ─────────────────────────────────────────
# 验证
# ─────────────────────────────────────────

# 本地 smoke test: build + docker compose up + healthcheck
# 模拟 CI/CD 的部署验证流程，确保 app 能正常启动
smoke-test:
	docker compose up -d --wait app
	@echo "✅ App started and healthy"
	docker compose down

# ─────────────────────────────────────────
# 其他
# ─────────────────────────────────────────

# 查看完整状态（所有容器）
ps:
	docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 清理未使用的资源
clean:
	docker system prune -f
