# 🚀 Pediatric Transplant Follow-up Management Platform

---

## Overview

The **Pediatric Transplant Follow-up Management Platform** is a healthcare information system designed using a modern **Microservices Architecture**.

It supports healthcare professionals in managing pediatric patients after organ transplantation by centralizing medical data and ensuring **continuous long-term monitoring**.

The platform places all patients under close medical surveillance, with a particular focus on early detection of **infections** and **acute rejection** episodes — enabling rapid clinical response and better outcomes.

---

## Features

- 📋 **Medical record management** — centralized patient history and clinical data
- 💊 **Prescription tracking** — immunosuppressive and medication management
- 🧪 **Lab result monitoring** — biological reports and test follow-up
- 📏 **Vital parameters tracking** — blood pressure, weight, temperature, and more
- 🦠 **Infection surveillance** — real-time monitoring and treatment tracking
- 🫀 **Graft monitoring** — detection of rejection risk and graft dysfunction
- 🏥 **Hospitalization management** — admissions and discharge records
- 🥗 **Nutrition follow-up** — personalized dietary plans
- 📅 **Consultation scheduling** — appointments and medical visit management
- 🔒 **Role-based access control** — secure access for Admins and Doctors

---

## Tech Stack

### Frontend

| **Technology**                   | **Purpose**                     |
|----------------------------------|---------------------------------|
| **Angular**                      | SPA frontend framework          |
| **TypeScript**                   | Typed JavaScript                |
| **Bootstrap / Angular Material** | UI components & styling         |

### Backend

| **Technology**                   | **Purpose**                        |
|----------------------------------|------------------------------------|
| **Java 17+**                     | Core language                      |
| **Spring Boot**                  | Microservices framework            |
| **Spring Cloud Gateway**         | API Gateway                        |
| **Spring Cloud Netflix Eureka**  | Service discovery                  |
| **Spring Security + Keycloak**   | Authentication & authorization     |
| **MySQL**                        | Relational data storage            |

---

## Architecture

The application follows a **distributed microservices architecture**:

```
Medical Staff (Doctor / Admin)
                ↓
        Angular Frontend
                ↓
           API Gateway
                ↓
   Spring Boot Microservices
                ↓
             MySQL Database
```

### Microservices Overview

| **Service**                       | **Description**                                         |
|-----------------------------------|---------------------------------------------------------|
| **User Service**                  | Manages users and integrates with Keycloak              |
| **Prescription Service**          | Manages medications and immunosuppressive treatments    |
| **Nutrition Service**             | Manages dietary plans and nutritional follow-up         |
| **Medical Record Service**        | Stores patient history and clinical information         |
| **Consultation Service**          | Manages consultations and appointments                  |
| **Lab Test (Bilan) Service**      | Manages laboratory results and medical reports          |
| **Vital Parameters Service**      | Tracks blood pressure, weight, temperature, etc.        |
| **Infection Service**             | Monitors infections and related treatments              |
| **Hospitalization Service**       | Manages admissions and discharge records                |
| **Graft Monitoring Service**      | Monitors graft function and rejection risk              |
| **Long-Term Follow-up Service**   | Ensures continuous monitoring post-transplant           |

### Security

Authentication and authorization are handled by **Keycloak**:

- ✅ **JWT token-based authentication**
- ✅ **Role-Based Access Control (RBAC):** `Admin` · `Doctor`
- ✅ **Centralized identity management**
- ✅ **API Gateway protection** for all services

---

## Contributors

> *(Add contributor names and roles here)*

---

## Academic Context

> *(Add your university, program, course, or academic year here)*

---

## Getting Started

### Prerequisites

- Java 17+
- Node.js & Angular CLI
- MySQL
- Docker *(optional)*
- Keycloak server

### Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/pediatric-transplant-platform.git

# Start the Eureka Server
cd eureka-server && mvn spring-boot:run

# Start the API Gateway
cd api-gateway && mvn spring-boot:run

# Start each microservice
cd user-service && mvn spring-boot:run
# ... repeat for other services

# Start the frontend
cd frontend && npm install && ng serve
```

---

## Acknowledgment

> *(Add acknowledgments — supervisors, institutions, or open-source libraries used)*
