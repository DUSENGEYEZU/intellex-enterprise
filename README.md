# Intellex Enterprise

**Intellex Enterprise** is a self-hostable, enterprise-grade distribution of the [Intellex Data Exchange Platform](https://intellex.dev/), designed for secure and private deployments within your organization’s infrastructure.



## 📦 Features

- 🔐 Secure, JWT-based authentication
- 🌐 Modern Angular frontend (port `9001`)
- ⚙️ Robust NestJS backend API (port `9000`)
- 🗃️ PostgreSQL database integration
- ✉️ External email notification API support
- 🐳 Containerized and production-ready

---

## 🏁 Quick Start

### 1. Set up PostgreSQL

You can use Docker to spin up a PostgreSQL container:

```bash
docker run -d \
  --name intellex-postgres \
  -e POSTGRES_USER=intellex_user \
  -e POSTGRES_PASSWORD=securepassword \
  -e POSTGRES_DB=intellex \
  -p 5432:5432 \
  postgres:15

```bash
docker run -d \
  --name intellex-app \
  -p 9000:9000 \
  -p 9001:9001 \
  -e DATABASE_HOST=172.17.0.4 \
  -e DATABASE_PORT=5432 \
  -e DATABASE_USER=intellex_user \
  -e DATABASE_PASSWORD=securepassword \
  -e DATABASE_NAME=intellex \
  -e NOTIFICATION_API=https://mail.intellex.dev/email/send \
  -e SECRET=your-secret-here \
  -e DOMAIN_HOST=http://your-domain.com:9000 \
  -e WEB_CLIENT_URL=http://localhost:9001 \
  -e SERVER_PORT=9000 \
  intellexenterprise/intellex-enterprise