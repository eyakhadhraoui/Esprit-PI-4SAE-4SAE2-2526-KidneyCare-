# 🐳 KidneyCare - Complete Docker Compose Setup

## 📋 Overview

This Docker Compose configuration deploys the entire KidneyCare medical management platform with all services, databases, and authentication systems.

### Services Included

| Service | Port | Type | Description |
|---------|------|------|-------------|
| **MySQL** | 3306 | Database | Medical data storage |
| **Keycloak** | 8080 | Auth | Identity & Access Management |
| **Eureka** | 8761 | Registry | Service Discovery |
| **API Gateway** | 8088 | Gateway | Request routing & load balancing |
| **NEPHRO** | 8089 | Microservice | Core medical records management |
| **Consultation** | 8081 | Microservice | Consultation management |
| **Vital Parameters** | 8082 | Microservice | Vital signs tracking |
| **Infection & Vaccination** | 8083 | Microservice | Infection & vaccination records |
| **Nutrition** | 8084 | Microservice | Nutrition management |
| **Prescription** | 8086 | Microservice | Prescription management |
| **Greffe** | 8096 | Microservice | Transplant management |
| **Frontend** | 80 | UI | Angular application |
| **MailHog** | 8025 | Email Testing | Local email testing |

## 🚀 Quick Start

### For Windows:
```bash
cd C:\Users\eyakh\Desktop\PI 2025_2026\pi
demarrer-docker-compose.cmd
```

### For macOS/Linux:
```bash
cd ~/Desktop/"PI 2025_2026"/pi
chmod +x demarrer-docker-compose.sh
./demarrer-docker-compose.sh
```

### Manual Docker Compose:
```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (Angular)                         │
│                      Port 80/4200                            │
└────────────────────────┬────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY                               │
│                      Port 8088                               │
└──┬──┬──┬──┬──┬──┬──┬──┬──────────────────────────────────────┘
   │  │  │  │  │  │  │  │
   ├──┴──┤  │  │  │  │  └─── GREFFE (8096)
   │     │  │  │  │  │
   │     ├──┴──┤  │  └─── NUTRITION (8084)
   │     │     │  │
   │     │     ├──┤
   │     │     │  └─── INFECTION (8083)
   │     │     │
   │     │     └─── PARAM VITAL (8082)
   │     │
   │     └─── CONSULTATION (8081)
   │
   ├─ NEPHRO (8089)
   └─ PRESCRIPTION (8086)

┌─────────────────────────────────────────────────────────────┐
│     MICROSERVICES INFRASTRUCTURE                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐   ┌─────────────┐   ┌──────────────┐      │
│  │  Eureka     │   │  Keycloak   │   │  MySQL       │      │
│  │  (8761)     │   │  (8080)     │   │  (3306)      │      │
│  └─────────────┘   └─────────────┘   └──────────────┘      │
│                                                               │
│  ┌──────────────┐                                            │
│  │  MailHog     │                                            │
│  │  (8025)      │                                            │
│  └──────────────┘                                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Configuration

### MySQL Database
```
Host: mysql
Port: 3306
Database: nep
Username: nephro_user
Password: nephro_password
Root Password: root
```

### Keycloak
```
Admin URL: http://localhost:8080
Admin Console: http://localhost:8080/admin
Username: admin
Password: admin
Realm: kidneyCare-realm
Client: kidneycare-app
```

### Eureka Service Registry
```
URL: http://localhost:8761
All microservices register automatically
```

### MailHog (Email Testing)
```
UI: http://localhost:8025
SMTP: localhost:1025
All emails sent by services appear here
```

## 📝 Useful Commands

### Check Service Status
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f nephro
docker-compose logs -f keycloak
docker-compose logs -f mysql
```

### Access Database
```bash
docker-compose exec mysql mysql -u root -p
# Password: root
```

### Access Java Container
```bash
docker-compose exec nephro /bin/bash
```

### Rebuild Images
```bash
docker-compose build --no-cache
docker-compose build --no-cache nephro
```

### Scale Services (if needed)
```bash
docker-compose up -d --scale consultation=2
```

### Stop Specific Service
```bash
docker-compose stop nephro
docker-compose start nephro
docker-compose restart nephro
```

### Remove Everything (including data)
```bash
docker-compose down -v
```

## 🚨 Troubleshooting

### Services won't start
```bash
# Check Docker daemon
docker ps

# Check logs for errors
docker-compose logs -f

# Ensure ports are not in use
netstat -an | grep LISTEN  # Windows
lsof -i                    # macOS/Linux
```

### Database connection errors
```bash
# Test MySQL connection
docker-compose exec mysql mysql -u root -p -e "SELECT 1;"

# Reset MySQL
docker-compose restart mysql
```

### Keycloak not accessible
```bash
# Check Keycloak logs
docker-compose logs -f keycloak

# Wait for it to start (can take 30-60 seconds)
```

### Services register in Eureka but not responding
```bash
# Check service health
curl http://localhost:8761/eureka/apps

# Check individual service
curl http://localhost:8089/actuator/health
```

### Port already in use
```bash
# Free up the port or change it in docker-compose.yml
lsof -i :8089
kill -9 <PID>
```

## 🔐 Security Notes

⚠️ **This configuration is for DEVELOPMENT ONLY**

### Production Recommendations:
1. Change all default passwords
2. Enable HTTPS/TLS
3. Configure proper CORS
4. Set up reverse proxy (Nginx)
5. Use Docker secrets for credentials
6. Implement centralized logging
7. Configure automated backups
8. Set resource limits
9. Enable health checks monitoring
10. Implement rate limiting

## 📦 Volumes (Persistent Data)

- **mysql_data**: MySQL database files
- **keycloak_data**: Keycloak configuration & data
- **nephro_uploads**: File uploads from NEPHRO service

## 🌐 Network

All services communicate through the `nephro-network` bridge network. Inter-service communication uses service names (e.g., `http://mysql:3306`) instead of localhost.

## 📊 Resource Requirements

Minimum:
- CPU: 2 cores
- Memory: 4GB RAM
- Disk: 5GB free space

Recommended:
- CPU: 4+ cores
- Memory: 8GB+ RAM
- Disk: 20GB free space

## 📞 Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. View service status: `docker-compose ps`
3. Test connectivity: `curl http://localhost:<port>/actuator/health`
4. Review documentation: `DOCKER-COMPOSE-SETUP.md`

## 📄 Files

- `docker-compose.yml` - Main orchestration configuration
- `.env` - Environment variables
- `demarrer-docker-compose.cmd` - Windows startup script
- `demarrer-docker-compose.sh` - macOS/Linux startup script
- `DOCKER-COMPOSE-SETUP.md` - Detailed setup guide
- `README-DOCKER.md` - This file

---

**Created**: 2026-05-03  
**Last Updated**: 2026-05-03  
**Maintenance**: Regular updates recommended every 3-6 months

