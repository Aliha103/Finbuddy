[![Netlify Status](https://api.netlify.com/api/v1/badges/1ed1aba7-7f6a-4989-af4e-b4e6838542e6/deploy-status)](https://app.netlify.com/projects/finbuddych/deploys)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-orange.svg)
![Platform](https://img.shields.io/badge/platform-Web,%20Mobile-lightgrey)
![Tech Stack](https://img.shields.io/badge/stack-React%20%7C%20Django%20%7C%20AI-9cf)

# 🚀 FinBuddy

**Modern AI-Powered Personal & Group Finance Manager**

---

![FinBuddy Logo](./assets/finbuddy-logo.png)

## Overview

**FinBuddy** is a next-generation fintech application that empowers individuals and groups to take control of their finances with the help of artificial intelligence. Whether you're managing personal expenses or splitting bills among friends, FinBuddy simplifies financial management and helps improve your financial health.

> ⚡ Built for individuals, roommates, travelers, and teams who value clarity, collaboration, and smarter money decisions.

---

## Features

- **💸 Personal Expense Tracking**  
  Track your spending, categorize expenses, and gain insights through visual dashboards.

- **👥 Group Expense Splitting**  
  Seamlessly manage shared expenses, create or join groups, and monitor balances.

- **🤖 AI Financial Insights**  
  Receive real-time financial tips, warnings, and personalized “financial scores.”

- **📊 Rich Analytics & Reports**  
  Analyze trends, generate summaries, and gain clarity on your financial habits.

- **🔔 Notifications & Smart Reminders**  
  Stay on top of due payments and financial updates with timely alerts.

- **🔒 Privacy & Security First**  
  Fully GDPR compliant with end-to-end encryption and user data control.

- **🌍 Multi-Platform, Multi-Currency**  
  Use across devices with support for various currencies and localization options.

---

## Demo

🚧 _Live demo and screenshots coming soon._

---

## Repository layout

This repo is an npm workspaces monorepo:

| Path | What it is |
| --- | --- |
| `apps/mobile` | The FinBuddy app for iOS and Android (Expo / React Native, TypeScript, Expo Router). |
| `apps/web` | The website (Vite + React). It is a standalone npm project, outside the workspaces for now. |
| `packages/shared` | Shared TypeScript domain code (types, money logic, data layer), consumed as source by the apps. |

Requires Node.js 20.19 or newer (22 recommended).

### Run the mobile app

```bash
npm install        # once, at the repo root
npm run mobile     # starts the Expo dev server
```

Scan the QR code with Expo Go on your phone (iOS or Android), or press `w` to open the web preview. Root scripts: `npm run typecheck`, `npm run lint`, `npm test`.

### Run the website

```bash
npm run web:install   # npm ci in apps/web
npm run web:dev       # Vite dev server
npm run web:build     # production build into apps/web/dist
```

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/finbuddy.git
cd finbuddy
```

### 2. Install Dependencies

**Frontend**

```bash
cd frontend
npm install
```

**Backend**

```bash
cd ../backend
pip install -r requirements.txt
```

### 3. Environment Setup

Copy and configure the environment files:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

### 4. Run Locally (Development Mode)

**Frontend**

```bash
cd frontend
npm run dev
```

**Backend**

```bash
cd backend
python manage.py migrate
python manage.py runserver
```

Access the app at:  
- Frontend: http://localhost:3000  
- API: http://localhost:8000

---

## Tech Stack

- **Frontend:** React (TypeScript), Tailwind CSS, shadcn/ui  
- **Backend:** Django, Django REST Framework, PostgreSQL  
- **AI/Analytics:** Python (scikit-learn/TensorFlow), Custom ML, OpenAI APIs (optional)  
- **Deployment:** Docker, CI/CD, Cloud Hosting (AWS/GCP/Azure)  
- **Integrations:** Open Banking APIs (optional), Calendar, Notifications

---

## Roadmap

- ✅ Personal expense tracking  
- ✅ Group splitting and settlements  
- ⏳ AI financial score & smart suggestions  
- ⏳ Mobile app (React Native/Flutter)  
- ⏳ Bank sync & advanced integrations

---

## Contributing

Contributions are welcome! Please see `CONTRIBUTING.md` for details.

- Report Bugs: Use GitHub Issues  
- Suggest Features: Open a discussion or submit a PR

---

## License

MIT

---

## Contact & Community

- **Project Lead:** Ali Hassan Cheema  
- **Email:** cheemacheema0078@gmail.com  
- **LinkedIn:** [Connect on LinkedIn](https://www.linkedin.com)  
- **Community Forum:** Coming soon!

_FinBuddy – Smarter Finances. Together._

---

## Sponsors & Partners

Interested in partnering with us or supporting FinBuddy?  
📬 Contact us at cheemacheema0078@gmail.com for sponsorship or collaboration opportunities.

---