
# ABC Corp Workflow Management System

This project is a **full-stack web application** developed for the **AI-First Development Assessment**.

The system allows **ABC Corp** to manage clients, projects, vendors, trainees, and define customizable project workflows using a **visual drag-and-drop workflow builder**.

The platform helps streamline the lifecycle of trainees from sourcing through training, interviews, and final hiring.



# Live Features Demonstrated

 Client Management  
 Project Management  
Vendor Management  
Trainee Pipeline Tracking  
 Drag-and-Drop Workflow Builder  
 Role-Based Access Control (RBAC)  
 JWT Authentication  
 SQLite Database Integration  


# Business Scenario

ABC Corp works with multiple clients.  
Each client can have multiple projects.

Projects may require trainees to undergo training before hiring.

Training may be provided by vendors and can include:

- Computer Skills
- Business Skills
- Logic Skills

Projects can be:

- **On-site**
- **Off-site**

Rules:

- On-site projects require **minimum two trainings**
- Off-site projects have **no minimum training restriction**

The system allows defining a **complete project lifecycle workflow** including:

Client onboarding → Project creation → Training → Certification → Interview → Offer → Hiring


# Technology Stack

## Frontend

- React
- Vite
- Tailwind CSS
- React Flow
- Zustand
- Axios

## Backend

- Node.js
- Express.js
- SQLite Database
- JWT Authentication
- bcrypt password hashing

## Architecture

- REST API
- Role Based Access Control (RBAC)
- AI-Assisted Development



# System Architecture

The application follows a **full-stack client-server architecture**.

## Frontend Layer

The frontend is built using **React with Vite**.

Key technologies used:

- **Tailwind CSS** for UI styling
- **Zustand** for global state management
- **Axios** for API communication
- **React Flow** for building the visual workflow editor

The frontend provides interfaces for managing:

- Clients
- Projects
- Vendors
- Trainees
- Workflow configuration



## Backend Layer

The backend is built using **Node.js and Express.js**.

It exposes REST APIs to manage application resources including:

- Clients
- Projects
- Vendors
- Trainees
- Workflows
- Authentication

**SQLite** is used as the database to store all system data.

Security features include:

- JWT authentication
- Password hashing using bcrypt
- Middleware-based route protection



## Workflow Engine

A major feature of the system is the **Workflow Builder**.

The workflow builder allows users to visually define project workflows using drag-and-drop nodes.

Supported workflow stages include:

- Training
- Vendor Assignment
- Certification
- Interview
- Offer Letter
- Hiring
- Decision Nodes

Each workflow is stored as **JSON** and linked to a specific project.



# User Roles

## Client

Clients have read-only access to project information.

Clients can:

- View projects
- View trainees
- View workflow progress


## Account Manager

Account Managers manage the entire workflow system.

They can:

- Create clients
- Create projects
- Assign vendors
- Manage trainees
- Configure workflows



# Application Pages

The frontend includes the following pages:

- Login
- Dashboard
- Clients
- Projects
- Project Details
- Vendors
- Trainees
- Workflow Builder

These pages allow users to manage the full lifecycle of client projects.

---

# Workflow Builder

The application includes a **drag-and-drop workflow builder** implemented using **React Flow**.

Features include:

- Drag and drop workflow nodes
- Connect nodes with edges
- Configure workflow logic
- Save workflow as JSON
- Assign workflow to projects

Example workflow stages:

Training → Certification → Interview → Offer → Hiring

---

# Folder Structure
abc-corp-app

client/
React frontend application

server/
Node.js backend APIs

ai-documentation/
prompts.md
ai-outputs.md
corrections.md


# Running the Application

## Start Backend
cd abc-corp-workflow-app
cd server
npm install
node src/index.js

Backend runs on:

http://localhost:5000


## Start Frontend
cd abc-corp-workflow-app
cd client
npm install
npm run dev

Frontend runs on:
http://localhost:5173





# AI Assisted Development

This project was developed using **AI-assisted development tools**.

AI was used to generate:

- System architecture
- Backend API structure
- Database schema
- React frontend components
- Workflow builder logic
- Authentication system

All AI-related development artifacts are documented in:


ai-documentation/


Files included:

- `prompts.md` – prompts used to generate code
- `ai-outputs.md` – AI generated outputs
- `corrections.md` – refinements made after AI generation

---

# Deliverables

This repository contains all required submission components:

- GitHub repository
- Prompts used
- AI generated outputs
- Corrections made
- Working application

# Author

ABC Corp Workflow System  
AI-First Development Assessment
