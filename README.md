# Project 01: Multi-Tier Web App with Docker Compose & Nginx Reverse Proxy

একটি প্রোডাকশন-স্টাইল ৩-টিয়ার ওয়েব অ্যাপ্লিকেশন যা **Nginx Reverse Proxy**, **Frontend**, **Node.js Backend API**, **PostgreSQL**, এবং **Redis Cache** দিয়ে তৈরি এবং **Docker Compose** দিয়ে অর্কেস্ট্রেটেড।

## Architecture

```text
Browser (http://localhost:8080)
   │
   ▼
[ Nginx Reverse Proxy (:80) ]  ── Rate Limiting + Security Headers + Gzip
   ├── /      ──► [ Frontend (Nginx Non-Root :8080) ]
   └── /api/  ──► [ Backend (Node.js Non-Root :5000) ]
                       ├──► [ PostgreSQL 16 (Persistent Volume) ]
                       └──► [ Redis 7 (30s Read Cache) ]
```

### Key DevOps Features
- **Multi-Stage Dockerfiles & Minimal Alpine Base:** ছোট ইমেজ সাইজ ও দ্রুত বিল্ড।
- **Non-Root Container Execution:** `frontend` (user `nginx`) ও `backend` (user `appuser`) উভয়ই non-root ইউজার হিসেবে চলে।
- **Network Isolation:** `backend-net` একটি `internal: true` নেটওয়ার্ক—ফলে ডাটাবেজ ও রেডিস সরাসরি পাবলিক/ফ্রন্টএন্ড নেটওয়ার্ক থেকে অ্যাক্সেস করা যায় না।
- **Health Checks & Startup Order:** প্রতিটি সার্ভিসের `HEALTHCHECK` রয়েছে এবং `depends_on: condition: service_healthy` ব্যবহার করা হয়েছে।
- **Nginx Reverse Proxy:** `/api/` রাউটে Rate Limiting (`10r/s`, `burst=20`), Gzip compression এবং Security Headers যুক্ত করা হয়েছে।

---

## WSL (Ubuntu)-তে চালানোর নিয়ম

১. প্রজেক্ট ফোল্ডারে যান:
```bash
cd /mnt/e/DevOps/DevOps_Practice/devops-portfolio-projects/01-multi-tier-docker-nginx
```

২. `.env` ফাইল তৈরি করুন (ঐচ্ছিক, না করলেও ডিফল্ট ভ্যালু দিয়ে চলবে):
```bash
cp .env.example .env
```

৩. কন্টেইনার বিল্ড ও রান করুন:
```bash
docker compose up -d --build
```

৪. সব সার্ভিস `healthy` হয়েছে কিনা দেখুন:
```bash
docker compose ps
```

৫. ব্রাউজার বা `curl` দিয়ে টেস্ট করুন:
```bash
curl http://localhost:8080/nginx-health
curl http://localhost:8080/api/health
curl http://localhost:8080/api/tasks
```
ব্রাউজারে ভিজিট করুন: `http://localhost:8080`

৬. বন্ধ করতে (ভলিউমসহ ক্লিন করতে `-v` দিন):
```bash
docker compose down
```

---

## Docker Hub-এ Image Push করার নিয়ম

১. `.env` ফাইলে আপনার Docker Hub ইউজারনেম সেট করুন:
```env
DOCKERHUB_USERNAME=your_dockerhub_username
```
২. Docker Hub-এ লগইন করে বিল্ড ও পুশ করুন:
```bash
docker login
docker compose build
docker compose push
```

---

## CV / Resume-তে লেখার জন্য Bullet Points

- *Architected and containerized a multi-tier web application (Frontend, Node.js REST API, PostgreSQL, Redis) using multi-stage Dockerfiles and non-root container users.*
- *Configured Nginx as a reverse proxy with rate limiting, Gzip compression, and security headers, routing traffic across isolated Docker bridge networks (`internal` backend network).*
- *Implemented automated container health checks, persistent named volumes, and Redis caching, publishing versioned images to Docker Hub.*
