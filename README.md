# 🚀 Automatisierung Tool

Eine moderne Fullstack-Webanwendung zur digitalen Aufgaben- und Prozessverwaltung.  
Das Projekt kombiniert ein **Django REST Backend** mit einem **React/TypeScript Frontend** und bietet Registrierung, Login, JWT-Authentifizierung, Kanban-Board, Dashboard-Statistiken, Diagramme und ein produktives Deployment mit Apache, Gunicorn und HTTPS.

---


### 🔐 Demo-Zugang

```text
Benutzername: demo
Passwort: demo123456
```

Alternativ kann direkt über die Anwendung ein eigener Account erstellt werden.

---

## ✨ Features

### 🔑 Authentifizierung

- Benutzerregistrierung
- Login mit JWT-Authentifizierung
- Token Refresh
- Demo-Zugang / Gastmodus
- Geschützte API-Endpunkte

### ✅ Aufgabenverwaltung

- Aufgaben erstellen
- Aufgaben bearbeiten
- Aufgaben löschen
- Statusverwaltung:
  - Offen
  - In Bearbeitung
  - Erledigt
- Prioritäten:
  - Niedrig
  - Mittel
  - Hoch
- Fälligkeitsdatum
- Markierung überfälliger Aufgaben

### 📌 Kanban & Organisation

- Kanban-Board
- Drag & Drop mit `dnd-kit`
- Listenansicht
- Suche
- Filter nach Status
- Sortierung nach Priorität

### 📊 Dashboard

- Gesamtanzahl Aufgaben
- Offene Aufgaben
- Aufgaben in Bearbeitung
- Erledigte Aufgaben
- Überfällige Aufgaben
- Aufgaben mit hoher Priorität
- Kreisdiagramm für Statusübersicht
- Balkendiagramm für Prioritäten

### 🚀 Deployment

- Apache Reverse Proxy
- Gunicorn als WSGI Server
- HTTPS mit Zertifikat
- Produktiver Betrieb auf Ubuntu Server
- React/Vite Produktionsbuild

---

## 🧰 Tech Stack

### Backend

| Technologie | Einsatz |
|---|---|
| Python | Backend-Programmiersprache |
| Django | Webframework |
| Django REST Framework | REST API |
| SimpleJWT | JWT Authentifizierung |
| SQLite | Datenbank für dieses Projekt |
| Gunicorn | Produktiver WSGI Server |

### Frontend

| Technologie | Einsatz |
|---|---|
| React | Benutzeroberfläche |
| TypeScript | Typisierte Frontend-Entwicklung |
| Vite | Build Tool |
| dnd-kit | Drag & Drop |
| Recharts | Diagramme und Dashboard |

### Deployment

| Technologie | Einsatz |
|---|---|
| Apache | Webserver und Reverse Proxy |
| Gunicorn | Backend Server |
| Ubuntu Server | Serverumgebung |
| HTTPS | Sichere Verbindung |

---

## 🖼️ Projekt-Eindruck

### Login & Registrierung

```text
Benutzer können sich registrieren, anmelden oder den Demo-Zugang nutzen.
```

### Dashboard

```text
Live-Statistiken, Statusübersicht und Prioritätsdiagramm.
```

### Kanban-Board

```text
Aufgaben können per Drag & Drop zwischen den Status-Spalten verschoben werden.
```

Screenshots können später optional im Ordner `docs/screenshots/` ergänzt werden.

---

## 📁 Projektstruktur

```text
automatisierung-tool/
│
├── automation/
│   ├── models.py
│   ├── serializers.py
│   ├── urls.py
│   └── views.py
│
├── config/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│
├── frontend/
│   ├── src/
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── README.md
│
├── manage.py
├── requirements.txt
├── README.md
└── .gitignore
```

---

## ⚙️ Lokale Installation

### 1. Repository klonen

```bash
git clone https://github.com/Tamira70/automatisierung-tool.git
cd automatisierung-tool
```

---

## 🐍 Backend lokal starten

### Virtuelle Umgebung erstellen

```bash
python3 -m venv venv
source venv/bin/activate
```

### Abhängigkeiten installieren

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

### Datenbank vorbereiten

```bash
python manage.py migrate
```

### Backend starten

```bash
python manage.py runserver
```

Das Backend läuft dann unter:

```text
http://127.0.0.1:8000/
```

---

## ⚛️ Frontend lokal starten

In einem zweiten Terminal:

```bash
cd frontend
npm install
npm run dev
```

Das Frontend läuft dann unter:

```text
http://localhost:5173/automatisierung-tool/
```

---

## 🔐 Umgebungsvariablen

Für lokale Entwicklung und Produktion werden Vite-Umgebungsvariablen genutzt.

### `frontend/.env.development`

```env
VITE_API_BASE=http://127.0.0.1:8000/api
```

### `frontend/.env.production`

```env
VITE_API_BASE=/automatisierung-tool-api
```

Für Django wird der Secret Key über eine Umgebungsvariable gelesen:

```python
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "django-insecure-dev-key")
```

---

## 🔗 API-Endpunkte

| Methode | Endpoint | Beschreibung |
|---|---|---|
| POST | `/api/register/` | Neuen Benutzer registrieren |
| POST | `/api/token/` | Login / JWT Token erhalten |
| POST | `/api/token/refresh/` | Access Token erneuern |
| GET | `/api/tasks/` | Aufgaben abrufen |
| POST | `/api/tasks/` | Aufgabe erstellen |
| GET | `/api/tasks/<id>/` | Einzelne Aufgabe abrufen |
| PUT | `/api/tasks/<id>/` | Aufgabe bearbeiten |
| DELETE | `/api/tasks/<id>/` | Aufgabe löschen |
| GET | `/api/stats/` | Dashboard-Statistiken abrufen |

---

## 🚀 Deployment Übersicht

Das Projekt läuft produktiv mit folgender Struktur:

```text
Browser
   ↓
Apache
   ↓
React Frontend: /automatisierung-tool/
   ↓
Apache Proxy: /automatisierung-tool-api/
   ↓
Gunicorn
   ↓
Django REST API
```

### Beispiel Apache Reverse Proxy

```apache
ProxyPass /automatisierung-tool-api/ http://127.0.0.1:8002/api/
ProxyPassReverse /automatisierung-tool-api/ http://127.0.0.1:8002/api/
```

### Beispiel Gunicorn Service

```ini
[Unit]
Description=Automatisierung Tool Django Backend
After=network.target

[Service]
User=root
Group=root
WorkingDirectory=/opt/automatisierung-tool
Environment="DJANGO_SECRET_KEY=your-secret-key"
ExecStart=/opt/automatisierung-tool/venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:8002
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## 🧪 Demo-Zugang

Für eine schnelle Demonstration steht ein Testkonto zur Verfügung:

```text
Benutzername: demo
Passwort: demo123456
```

Damit können Registrierung, Login, Dashboard, Kanban-Board und Aufgabenverwaltung direkt getestet werden.

---

## 🎯 Ziel des Projekts

Dieses Projekt wurde als Portfolio-Projekt entwickelt, um folgende Fähigkeiten zu demonstrieren:

- Fullstack-Entwicklung mit Django und React
- REST API Design
- JWT Authentifizierung
- Benutzerregistrierung
- Frontend State Management
- Drag & Drop Interaktion
- Dashboard-Visualisierung
- Deployment mit Apache, Gunicorn und HTTPS
- Debugging und produktionsnahes Arbeiten

---

## 👩‍💻 Entwicklerin

**Tamira**

GitHub: [Tamira70](https://github.com/Tamira70)

---

## 📌 Status

✅ Live  
✅ Registrierung aktiv  
✅ Demo-Zugang aktiv  
✅ Dashboard aktiv  
✅ HTTPS aktiv  

---

## 📄 Hinweis

Dieses Projekt dient als Portfolio-Projekt und zeigt eine vollständige Fullstack-Anwendung mit Backend, Frontend, Authentifizierung, Dashboard und Deployment.

