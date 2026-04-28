<div align="center">

<br/>

<img src="https://img.icons8.com/fluency/96/leaf.png" width="100"/>

# 🌿 ANNADAAN

### *अन्नदान — The Gift of Food*

**Bridging the gap between surplus and scarcity.**
A real-time platform that connects food donors, NGOs, and volunteers — turning waste into impact.

<br/>

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-annadaan--2--0.vercel.app-22c55e?style=for-the-badge)](https://annadaan-2-0.vercel.app/)

<br/>

![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=flat-square&logo=google&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet_Maps-199900?style=flat-square&logo=leaflet&logoColor=white)
![Status](https://img.shields.io/badge/Status-Live%20%E2%9C%85-brightgreen?style=flat-square)

<br/>

-----

</div>

## 📖 The Problem We’re Solving

> **One-third of all food produced globally is wasted** — while 820 million people go hungry every day.

Restaurants, caterers, and households discard tonnes of perfectly edible food daily. The disconnect isn’t a scarcity problem — **it’s a logistics and communication problem.**

**ANNADAAN** solves it.

-----

## 💡 What is ANNADAAN?

ANNADAAN is a **purpose-driven food redistribution platform** that creates a real-time bridge between those who have surplus food and those who need it most. By connecting **Donors → NGOs → Volunteers → Recipients** in one seamless flow, we ensure that no meal goes to waste.

<div align="center">

```
🍱 Donor lists food ──► 🏢 NGO accepts request ──► 🚴 Volunteer picks up ──► 🤝 Community fed
```

</div>

-----

## ✨ Features

|#|Feature |Description |
|-|-------------------------|------------------------------------------------------------|
|🔐|**Secure Authentication**|Firebase Auth with role-based access control |
|📦|**Smart Food Listings** |Donors post surplus food with quantity, type & pickup window|
|👥|**Role-Based Dashboards**|Tailored views for Donors, NGOs, and Volunteers |
|🗺️|**Live Map Tracking** |Real-time pickup/drop location via Leaflet maps |
|⚡|**Real-Time Sync** |Instant updates powered by Firestore listeners |
|🤖|**AI Donor Assistant** |Gemini API helps donors describe & categorize food listings |
|🎨|**Modern UI/UX** |Clean, responsive design with Tailwind CSS |

-----

## 🏗️ Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│ FRONTEND LAYER │
│ React 18 · Vite · Tailwind CSS │
│ Wouter (Routing) │
└──────────────────────┬──────────────────────────────────┘
│
┌──────────────────────▼──────────────────────────────────┐
│ SERVICES LAYER │
│ Leaflet Maps · Gemini AI · Firebase SDK │
└──────────────────────┬──────────────────────────────────┘
│
┌──────────────────────▼──────────────────────────────────┐
│ BACKEND LAYER │
│ Firebase Auth · Firestore · Hosting │
└─────────────────────────────────────────────────────────┘
```

|Layer |Technology |Purpose |
|------------|-------------------------|--------------------------------|
|⚛️ Frontend |React 18 + Vite |Fast, component-driven UI |
|🎨 Styling |Tailwind CSS |Utility-first responsive design |
|🔥 Backend |Firebase Auth + Firestore|Auth, real-time database |
|🗺️ Maps |Leaflet.js |Interactive pickup/delivery maps|
|🔀 Routing |Wouter |Lightweight client-side routing |
|🤖 AI |Google Gemini API |Intelligent donor assistance |
|🚀 Deployment|Vercel |Fast global CDN deployment |

-----

## 🚀 Getting Started

### Prerequisites

- Node.js `v18+`
- npm or yarn
- Firebase project (Auth + Firestore enabled)
- Google Gemini API key

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Naxt318/annadaan.git
cd annadaan

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your Firebase config & Gemini API key

# 4. Start development server
npm run dev
```
-----

## 🎭 User Roles

<table>
<tr>
<td align="center" width="33%">

### 🍽️ Donor

- Register & list surplus food
- Add quantity, type, pickup time
- Get AI-powered listing help
- Track donation status

</td>
<td align="center" width="33%">

### 🏢 NGO

- Browse available donations
- Accept & manage requests
- Coordinate volunteer pickups
- Track impact metrics

</td>
<td align="center" width="33%">

### 🚴 Volunteer

- View assigned pickups on map
- Update delivery status live
- Build community impact score
- Seamless navigation support

</td>
</tr>
</table>

-----

## 📊 Impact Potential

```
🍛 1 in 3 meals produced globally is wasted
🌍 40% of food waste happens post-harvest & at retail
💚 ANNADAAN targets the last-mile redistribution gap
📱 Real-time tech ensures food reaches people before it spoils
```

-----

## 👨‍💻 Team

Built with ❤️ for communities that need it most.

> *“ANNADAAN — because every meal saved is a life uplifted.”*

-----
<div align="center">

**⭐ Star this repo if ANNADAAN inspires you!**

[![Try ANNADAAN](https://img.shields.io/badge/🌿%20Try%20ANNADAAN%20Now-22c55e?style=for-the-badge)](https://annadaan-2-0.vercel.app/)

<br/>

*Made with 🌱 to reduce waste and feed communities*

</div>
