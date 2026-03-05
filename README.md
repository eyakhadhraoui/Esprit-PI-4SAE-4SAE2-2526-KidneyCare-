🚀 Pediatric Transplant Follow-up Management Platform (Microservices Architecture)
📌 Overview

This project is a Pediatric Transplant Follow-up Management Platform designed using a modern Microservices Architecture.

It helps healthcare professionals manage pediatric patients after organ transplantation by centralizing medical data and ensuring continuous long-term monitoring.

The system includes independent services such as:

Prescription Management

Nutrition Management

Medical Records Management

Medical Tests & Reports (Bilan)

Consultation Management

Vital Parameters Monitoring

Infection Monitoring

Hospitalization Management

Graft (Transplant) Monitoring

Long-Term Follow-up Management

🏗️ Architecture

The application follows this architecture:

Doctor / Admin / Medical Staff → Angular Frontend → API Gateway → Spring Boot Microservices → Database

Microservices Included
Service Name	Description
Prescription Service	Manages patient prescriptions and medications
Nutrition Service	Manages dietary plans and nutritional monitoring
Medical Record Service	Manages patient medical history and records
Lab Test Service	Handles medical tests, lab results, and reports
Consultation Service	Manages medical consultations and appointments
Vital Parameters Service	Monitors blood pressure, temperature, weight, etc.
Infection Service	Tracks infections and related treatments
Hospitalization Service	Manages hospital admissions and discharge records
Graft Monitoring Service	Monitors graft function and rejection risks
Long-Term Follow-up Service	Ensures continuous post-transplant monitoring
🔐 User Management with Keycloak

Authentication and authorization are handled using Keycloak, providing:

Secure login and registration

Role-based access control (Admin, Doctor, Nurse)

Token-based authentication (JWT)

Centralized identity management

Keycloak is integrated with the API Gateway to secure all backend microservices.

⚙️ Technologies Used
Backend:

Java 17+

Spring Boot

Spring Cloud Gateway

Spring Cloud Netflix Eureka (Service Discovery)

Spring Security

Keycloak Integration

Frontend:

Angular

TypeScript

Bootstrap / Angular Material

Database:

MySQL
