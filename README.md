# 🚀 Pediatric Transplant Follow-up Management Platform
### Microservices Architecture

---

## 📌 1. Overview

The **Pediatric Transplant Follow-up Management Platform** is a healthcare information system designed using a modern **Microservices Architecture**.

It supports healthcare professionals in managing pediatric patients after organ transplantation by centralizing medical data and ensuring continuous long-term monitoring.

The platform improves:
- **Treatment adherence**
- **Medical data organization**
- **Communication between healthcare providers**
- **Monitoring of graft health and complications**

---

## 🏗️ 2. System Architecture

The application follows a **distributed microservices architecture**:

```
Medical Staff (Doctor / Nurse / Admin)
                ↓
        Angular Frontend
                ↓
           API Gateway
                ↓
   Spring Boot Microservices
                ↓
             MySQL Database
```

### **Architecture Components**

| **Component**        | **Description**                                          |
|----------------------|----------------------------------------------------------|
| **Angular Frontend** | User interface for doctors, nurses, and administrators   |
| **API Gateway**      | Single entry point for all client requests               |
| **Eureka Server**    | Service discovery between microservices                  |
| **Spring Boot Services** | Independent backend services                         |
| **Keycloak**         | Authentication & authorization server                    |
| **MySQL Database**   | Centralized storage for medical data                     |

---

## 🧩 3. Microservices Overview

| **Service Name**              | **Description**                                          |
|-------------------------------|----------------------------------------------------------|
| **User Service**              | Manages users and integrates with Keycloak               |
| **Prescription Service**      | Manages medications and immunosuppressive treatments     |
| **Nutrition Service**         | Manages patient dietary plans and nutritional follow-up  |
| **Medical Record Service**    | Stores patient history and clinical information          |
| **Consultation Service**      | Manages medical consultations and appointments           |
| **Lab Test (Bilan) Service**  | Manages laboratory results and medical reports           |
| **Vital Parameters Service**  | Tracks blood pressure, weight, temperature, etc.         |
| **Infection Service**         | Monitors infections and related treatments               |
| **Hospitalization Service**   | Manages admissions and discharge records                 |
| **Graft Monitoring Service**  | Monitors graft function and rejection risk               |
| **Long-Term Follow-up Service** | Ensures continuous monitoring post-transplant          |

---

## 🔐 4. Security & Authentication (Keycloak Integration)

Authentication and authorization are handled using **Keycloak**.

### **Security Features**

- ✅ **Secure login & registration**
- ✅ **Role-Based Access Control (RBAC)**:
  - `Admin`
  - `Doctor`
  - `Nurse`
- ✅ **JWT token-based authentication**
- ✅ **Centralized identity management**
- ✅ **API Gateway protection** for all services

---

## ⚙️ 5. Technologies Used

### 🔹 Backend

| **Technology**              | **Purpose**                        |
|-----------------------------|------------------------------------|
| **Java 17+**                | Core language                      |
| **Spring Boot**             | Microservices framework            |
| **Spring Cloud Gateway**    | API Gateway                        |
| **Spring Cloud Netflix Eureka** | Service discovery              |
| **Spring Security**         | Security layer                     |
| **Keycloak Integration**    | Authentication & authorization     |

### 🔹 Frontend

| **Technology**          | **Purpose**                          |
|-------------------------|--------------------------------------|
| **Angular**             | SPA frontend framework               |
| **TypeScript**          | Typed JavaScript                     |
| **Bootstrap / Angular Material** | UI components & styling     |

### 🔹 Database

| **Technology** | **Purpose**              |
|----------------|--------------------------|
| **MySQL**      | Relational data storage  |

---

## 🎯 6. Project Objectives

> *(Add your project objectives here)*
