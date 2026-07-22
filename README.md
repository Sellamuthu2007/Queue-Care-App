Queue-Care: ML-Driven Emergency Queue Management Infrastructure

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React Native](https://img.shields.io/badge/Frontend-React_Native-61DAFB.svg)](https://reactnative.dev/)
[![Go Version](https://img.shields.io/badge/Backend-Go_1.22+-00ADD8.svg)](https://go.dev/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E.svg)](https://supabase.com/)

Queue-Care is a cross-platform, high-throughput hospital queue orchestration platform. By combining dynamic Machine Learning (ML) wait-time estimation with a low-latency **Global Emergency Override Filter**, Queue-Care guarantees that high-acuity trauma events immediately preempt standard administrative appointment schedules across all mobile and desktop clients.

---

## 🛠 Tech Stack Architecture

* **Mobile Frontend:** **React Native** (iOS & Android cross-platform UI with Expo / Native CLI)
* **Backend Engine:** **Go (Golang)** — Utilizing Gorilla WebSockets and Fiber/Gin for ultra-low latency event distribution and emergency broadcasting.
* **Database & Auth:** **Supabase** (PostgreSQL with real-time Row Level Security and Pub/Sub subscriptions).
* **ML Engine Service:** Lightweight Python/FastAPI microservice executing **XGBoost** and **DistilBERT** models, interfaced via gRPC/REST with the core Go server.

---

## 🏗 System Architecture & Emergency Workflow

┌─────────────────────────────────────────────────────────┐
│               REACT NATIVE MOBILE DASHBOARDS            │
│  [Patient App]   [Doctor App]   [Triage Nurse]  [Admin] │
│      └─── GLOBAL EMERGENCY FILTER (SOS OVERRIDE) ───┘   │
└────────────────────────────┬────────────────────────────┘
│ (Real-Time WebSockets)
▼
┌─────────────────────────────────────────────────────────┐
│                   GO BACKEND ENGINE                     │
│  • Concurrency Manager (Goroutines)                    │
│  • Supabase Realtime Listener                           │
│  • Sparse Data Handler & Priority Dispatcher            │
└──────────────┬────────────────────────────┬─────────────┘
│ (gRPC)                     │ (SQL / PgBouncer)
▼                            ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│   ML INFERENCE SERVICE   │   │     SUPABASE PLATFORM    │
│ • XGBoost Wait-Time      │   │ • PostgreSQL Database    │
│ • DistilBERT Chief Text  │   │ • Auth & User Roles      │
└──────────────────────────┘   └──────────────────────────┘

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed locally:

* [Node.js 18+](https://nodejs.org/)
* [Go 1.22+](https://go.dev/dl/)
* [React Native CLI / Expo CLI](https://reactnative.dev/docs/environment-setup)
* [Supabase CLI](https://supabase.com/docs/guides/cli)
