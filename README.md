<div align="center">

# Zuno Pulse

### Business Productivity & Collaboration Platform

A full-stack platform for managing work, teams and real-time communication.

<br>

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--time-010101?style=flat-square&logo=socketdotio&logoColor=white)

</div>

---

## Overview

**Zuno Pulse** is a full-stack business productivity platform designed to centralize everyday team operations.

The platform combines **task management, user management, administration, notifications and real-time communication** into a single workspace.

The project was built as a practical foundation for developing internal business applications and workflow systems.

---

## Core Features

### Task Management

- Create, edit and delete tasks
- Assign tasks to users
- Track task status
- Search and filter tasks
- Task recovery and trash management

### User & Team Management

- User registration and authentication
- User profiles
- Role-based access control
- User management
- Account restrictions and ban management

### Administration

- Dedicated admin area
- User management
- Task management
- Protected admin routes
- Administrative permissions

### Real-time Messaging

- One-to-one messaging
- Real-time message delivery
- Conversation management
- Unread message indicators
- Message search
- Reply to messages
- Message recall
- Image and PDF attachments
- Socket.IO real-time events

### Notifications

- User notifications
- Unread notification tracking
- Notification management

---

## Product Preview

> Screenshots and product demonstrations will be added here.

---

## Architecture

```text
                         ZUNO PULSE
                              │
              ┌───────────────┴───────────────┐
              │                               │
       Web Application                  Real-time Layer
              │                               │
    Handlebars / SCSS                     Socket.IO
              │                               │
              └───────────────┬───────────────┘
                              │
                         Express.js
                              │
              ┌───────────────┼───────────────┐
              │               │               │
           Routes        Controllers      Middleware
              │               │               │
              └───────────────┼───────────────┘
                              │
                           Services
                              │
                 ┌────────────┴────────────┐
                 │                         │
            MongoDB Atlas                Redis
```

---

## Technology Stack

| Layer                 | Technology                  |
| --------------------- | --------------------------- |
| Runtime               | Node.js                     |
| Backend               | Express.js                  |
| Template Engine       | Handlebars                  |
| Frontend              | JavaScript, SCSS, Bootstrap |
| Database              | MongoDB Atlas               |
| Cache                 | Redis                       |
| Real-time             | Socket.IO                   |
| Authentication        | Session / Token             |
| Social Authentication | Google / Facebook / LINE    |
| Code Formatting       | Prettier                    |

---

## Project Structure

```text
Zuno-Pulse/
│
├── src/
│   ├── app/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── config/
│   ├── helpers/
│   ├── public/
│   ├── resources/
│   │   ├── scss/
│   │   └── views/
│   │
│   └── routes/
│
├── package.json
├── .gitignore
├── .prettierrc
└── README.md
```

---

## Development Status

### Core Platform

- [x] Authentication
- [x] User management
- [x] Task management
- [x] Notifications
- [x] Admin management
- [x] Role-based access control
- [x] Real-time messaging

### Collaboration

- [x] Conversations
- [x] Unread message tracking
- [x] Message search
- [x] Message reply
- [x] Message recall
- [x] File attachments
- [x] Socket.IO integration

### Next Steps

- [ ] Advanced dashboard
- [ ] Activity history
- [ ] Workflow automation
- [ ] Calendar integration
- [ ] Advanced analytics
- [ ] Email notifications
- [ ] Automated testing
- [ ] CI/CD
- [ ] Production deployment

---

## Getting Started

### Requirements

- Node.js 20+
- MongoDB Atlas
- Redis

### Installation

```bash
git clone https://github.com/zuonkimi/Zuno-Pulse.git

cd Zuno-Pulse

npm install
```

Create a `.env` file and configure the required environment variables.

Then start the application:

```bash
npm start
```

The application will be available at:

```text
http://localhost:3000
```

---

## Project Vision

Zuno Pulse is designed as a foundation for internal business applications.

The architecture can be extended to support:

- Company workflow management
- Internal communication
- Approval processes
- Employee operations
- Business dashboards
- Workflow automation
- Business-specific modules

---

<div align="center">

### Zuno Pulse

**Organize work. Connect teams. Keep the pulse.**

Built by **Zuon Kimi**

</div>
