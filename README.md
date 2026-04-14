# 🌟 STEMTrack (STEM Robotics Progress Tracker)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status: Active](https://img.shields.io/badge/status-active-success.svg)]()

> **A production-minded EdTech platform for capturing, structuring, and analysing real-world STEM learning.**

---


## 📌 Table of Contents

1. 📖 [About the Project](#-about-the-project)  
2. ✨ [Features](#-features)  
3. 🧰 [Tech Stack](#-tech-stack)  
4. 🚀 [Getting Started](#-getting-started)  
5. 📁 [Architecture](#-architecture)  
6. 🧪 [Examples & Screenshots](#-examples--screenshots)  
7. 🤝 [Contributing](#-contributing)  
8. 📝 [License](#-license)  
9. 📞 [Contact](#-contact)


---


## 🚀 The Problem

In real STEM learning environments, the most valuable moments happen **during the session**:

- A student finally understands a concept  
- A bug gets fixed after multiple attempts  
- A team collaborates to solve a challenge  

👉 These moments are **rarely captured in a structured way**

As a result:

- Progress is based on **memory, not evidence**
- Feedback is **inconsistent**
- Parents and organisations **lack visibility**

---

## 💡 The Solution

**STEMTrack captures learning as it happens.**

It transforms:

> 🎤 Voice  
> 📷 Evidence  
> ✅ Activity  

into:

> 📊 Structured, trackable, and auditable learning data

---

## 🎯 Positioning

> **STEMTrack is not a reporting tool.**  
> It is a **Learning Evidence Engine for practical STEM education.**

---

## 📌 Overview

**STEMTrack** is a multi-platform system designed for STEM clubs, robotics instructors, and learning organisations to:

- Capture real-time learning activity  
- Structure unrecorded “in-session” insights  
- Track student development over time  
- Generate meaningful progress evidence  

Unlike traditional systems, STEMTrack focuses on **capturing learning as it happens**, not just final results.

---

## 🧠 Core Concept

> “Turn real-world learning activity into structured, auditable evidence.”

The platform captures:

- 🎤 Voice-based instructor observations  
- ✅ Attendance (manual + voice-assisted review)  
- 📷 Photo & video evidence  
- 📊 Structured session data for reporting  

---

## ⚡ What Makes STEMTrack Different


### 🧠 Capturing Learning Behaviour
- Tracks what students **do**, not just outcomes  
- Records real problem-solving moments  
- Builds continuous learning history  

### ⚙️ Minimal Teacher Effort
- Voice instead of typing  
- 1–2 tap workflows  
- No heavy admin overhead  

### 🔁 Continuous Insight Loop
- Capture → Structure → Analyse → Improve  
- Not limited to end-of-term reporting  

### 🔐 Audit-Safe Design
- AI is reviewed before saving  
- Manual override always available  
- All actions are traceable  

---

## 🧰 Tech Stack

| Layer | Technology |
|------|-----------|
| Web App | Next.js, React, TypeScript |
| Mobile App | Expo (React Native) |
| Backend | Supabase Edge Functions |
| Database | PostgreSQL (Supabase) |
| Storage | Supabase Storage |
| AI Layer | OpenAI / Azure OpenAI |
| Monorepo | Turborepo |

---

## 🏗 Monorepo Architecture

```text
Stem-Robotic-Tracker-Monorepo/
│
├── apps/
│   ├── web/                      # Next.js web platform (admin + dashboards)
│   └── mobile/                   # Expo mobile app (teacher capture tool)
│
├── packages/
│   └── stemtrack-sdk/            # Shared TypeScript DTOs (API contracts)
│
├── supabase/
│   ├── functions/                # Edge Functions (backend logic)
│   │   ├── auth-access-key/
│   │   ├── attendance-voice-review/
│   │   ├── submit-attendance/
│   │   └── submit-evidence/
│   └── config.toml
│
├── docs/
│   └── screens/                  # UI screenshots (ADD YOUR IMAGES HERE)
│       ├── access.png
│       ├── dashboard.png
│       ├── capture.png
│       ├── attendance.png
│       └── evidence.png
│
├── package.json
├── turbo.json
└── README.md

```

---

## 🧭 System Architecture

```text
Mobile App (Expo)
   │
   ▼
Edge Functions (Supabase)
   │
   ├── PostgreSQL Database
   ├── Storage (Media Files)
   └── AI Processing (OpenAI / Azure)

```

---

## 🔄 Core Workflows

- 🎤 Learning Capture
- Record voice observations
- Transcribe + structure insights
- Store as learning evidence

---

## ✅ Attendance (Safe AI)

- Voice input processed
- Matched to roster
- Teacher confirms before save

---
## 📷 Evidence Capture

- Photo/video captured
- Metadata attached
- Stored and linked to session

---

## 📸 Product Walkthrough

### 🔐 Secure Access

### 🏠 Session Dashboard

### 🎤 Learning Capture

### ✅ Attendance System

### 📷 Evidence Capture

---

## 📡 API Contracts (Shared SDK)

### Defined in:

```text
packages/stemtrack-sdk/src/types
```

---

## 🗄 Supabase Schema (Simplified)

### Core Tables
- clubs
- students
- sessions
- session_students

### Attendance
- attendance_records
- attendance_voice_submissions

### Evidence
- evidence_items

---

## 🔐 Environment Strategy



| Location | Purpose |
|------|-----------|
| apps/web/.env.local | Web secrets |
| apps/mobile/.env | Public API URLs |
| Supabase Secrets | Backend secrets |
| supabase/.env | Local dev only |



---

## 🚀 Getting Started

### 🧾 Prerequisites

- Node.js **v16 or higher**
- npm or yarn

### ⬇ Installation

```bash
git clone https://github.com/kelvin101udoh-art/Stem-Robotic-Tracker.git
cd Stem-Robotic-Tracker/web
npm install

```

### Run Web
```text
cd apps/web
npm run dev
```

### Run Mobile
```text
cd apps/mobile
npx expo start
```

### Deploy Functions
```text
supabase functions deploy auth-access-key
supabase functions deploy attendance-voice-review
```

### ▶ Usage

```bash
npm run dev
```


### Visit 
```text
http://localhost:3000
```
To view the app locally.


---

## 🌍 Vision

**STEMTrack aims to become the operating system for practical STEM learning environments.**

### 🎯 Strategic Goal

Move education from:
- “What was taught”

→ to →

- “What was actually learned”

---


## 🏗 Engineering Standards

- Typed API contracts
- Edge Function architecture
- Secure session model
- Audit-safe workflows
- Metadata-first design

---

## 🧪 Development Status

| Area | Status |
|------|-----------|
| Mobile UI	| ✅ |
| Monorepo | ✅ |
| Edge Functions | ✅ |
| AI Attendance | ⚠️ |
| Evidence Upload	| ⚠️ |

---
## 🧪 Examples & Screenshots

https://youtu.be/rh31fEKTTfY

https://youtu.be/6JccBOGK6K4

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository  
2. Create a new feature branch  
3. Commit your changes  
4. Open a Pull Request

---

## 📝 License

This project is licensed under the **MIT License**.  
See the `LICENSE` file for details.

---
## 📞 Contact

**Maintainer:** Kelvin Udoh  

- 📧 Email: kelvin101udoh@gmail.com  
- 🔗 LinkedIn: https://www.linkedin.com/in/kelvin-udoh-b6197a398
- 🐦 Twitter/X: https://x.com/udoh_kelvin_101

