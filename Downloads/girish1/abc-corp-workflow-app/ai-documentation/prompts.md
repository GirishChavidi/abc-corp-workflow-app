=>PROMPT - 1:

You are a senior full-stack engineer.

Generate a complete full-stack web application for the following business requirement.

Company: ABC Corp

Business Model:
ABC Corp manages multiple clients. Each client has client contacts. Clients provide projects that are handled by account managers of ABC Corp. Each client can have multiple projects.

Each project involves sourcing trainees and optionally training them before hiring.

Training may be conducted by vendors.

Project Types:
- On-site
- Off-site

Rules:
- On-site projects must include at least two trainings
- Off-site projects have no training restrictions

Training Types:
- Computer Skills
- Business Skills
- Logic Skills

Training Payment:
Training can be paid by:
- ABC Corp
- Client
- Trainee

Process Flow:
1. Client onboarding
2. Project creation
3. Determine project type (onsite/offsite)
4. Determine if training required
5. Select training types
6. Assign vendor
7. Define who pays for training
8. Conduct training
9. Certification by vendor (optional)
10. Client interviews trainees
11. Shortlist candidates
12. Offer letter
13. Hiring

SYSTEM REQUIREMENTS

Frontend:
- React
- Vite
- Tailwind CSS
- React Flow (for workflow builder)
- Zustand for state management
- Axios for API communication

Backend:
- Node.js
- Express.js
- SQLite database
- JWT authentication
- bcrypt password hashing
- REST API architecture

ROLES (RBAC)

Client
- view projects
- view trainees
- view workflow progress

Account Manager
- create clients
- create projects
- assign vendors
- manage trainees
- configure workflows

DATABASE ENTITIES

Clients
ClientContacts
Projects
Vendors
Trainees
Trainings
WorkflowDefinitions

APPLICATION FEATURES

1. Client Management
Create, edit and list clients.

2. Project Management
Each client can have multiple projects.
Projects must store:
- onsite/offsite
- training requirement
- assigned vendors
- workflow configuration.

3. Vendor Management
Vendors may provide one or more training types.

4. Trainee Management
Track trainees through sourcing, training, interview and hiring.

5. Workflow Builder
Create a drag-and-drop workflow builder UI using React Flow.

The workflow builder must allow:
- adding nodes
- connecting nodes
- defining decision logic
- saving workflow JSON
- loading workflows for each project

Node Types:
- Training
- Vendor Assignment
- Certification
- Interview
- Offer Letter
- Hiring
- Decision Node

UI STRUCTURE

Pages:

Login
Dashboard
Clients
Projects
ProjectDetail
Vendors
Trainees
WorkflowBuilder

FRONTEND STRUCTURE

client/
src/
components/
pages/
store/
api/

STATE MANAGEMENT

Use Zustand store for:
- authentication
- user role
- workflow state

BACKEND STRUCTURE

server/
src/
index.js
database.js
seed.js
middleware/
routes/

Routes required:

/auth
/clients
/projects
/vendors
/trainees
/workflows

Each route should support CRUD operations.

AUTHENTICATION

Use JWT authentication.
Store user role inside token.
Protect routes with middleware.

WORKFLOW STORAGE

Workflows should be stored as JSON in the database and attached to a project.

DELIVERABLE

Generate:

1. Backend code (Node.js + Express)
2. Database schema
3. React frontend
4. Zustand store
5. Workflow builder UI using React Flow
6. Role-based access control
7. API integration

Provide complete folder structure and working code.



=>PROMPT - 2


Generate a drag-and-drop workflow builder UI using React Flow.

Requirements:

- Node palette on the left
- Canvas in the center
- Node configuration panel
- Drag nodes onto canvas
- Connect nodes with edges
- Save workflow JSON

Node Types:
Training
Certification
Interview
Offer
Hiring
Decision

Each workflow should be configurable per project.

Use React + Tailwind CSS.


=>PROMPT - 3

Create a Node.js Express backend with SQLite.

Routes:

/auth
/clients
/projects
/vendors
/trainees
/workflows

Implement CRUD APIs.

Add JWT authentication middleware.

Use bcrypt for password hashing.

Database tables:

users
clients
projects
vendors
trainees
workflows


=>PROMPT 4 

Create a Zustand store for authentication and global state.

State should include:

user
token
role

Functions:

login()
logout()
setUser()


=>PROMPT - 5

Implement role based access control.

Roles:

Client
Account Manager

Clients can only view project data.

Account Managers can create and manage projects, vendors, trainees and workflows.

Protect both frontend routes and backend APIs.