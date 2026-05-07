
🚧 Smart Inventory Manager v2.0 befindet sich aktuell in Entwicklung.

Die neue Version erweitert das Projekt um eine ERP-ähnliche Sidebar-Navigation, Module für Einkauf, Dispo, Lager, Kundenstamm und Admin sowie einen verbesserten Inventur-Modus mit Excel-Bericht. Ziel ist eine noch praxisnähere Lager- und Prozessanwendung mit professioneller Struktur und besserer Bedienbarkeit.



# 🚀 Automatisierung Tool

Eine moderne Fullstack-Webanwendung zur digitalen Aufgaben- und Prozessverwaltung.  
Das Projekt kombiniert ein **Django REST Backend** mit einem **React/TypeScript Frontend** und bietet Registrierung, Login, JWT-Authentifizierung, Kanban-Board, Dashboard-Statistiken, Diagramme sowie ein produktives Deployment mit Apache, Gunicorn und HTTPS.

---

---

## 🔐 Demo-Zugang

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
- Docker Compose Setup für lokale Container-Umgebung

---

## 🧰 Tech Stack

### Backend

| Technologie | Einsatz |
|---|---|
| Python | Backend-Programmiersprache |
| Django | Webframework |
| Django REST Framework | REST API |
| SimpleJWT | JWT Authentifizierung |
| SQLite | Lokale Standard-Datenbank |
| PostgreSQL | Datenbank im Docker-Setup |
| Gunicorn | Produktiver WSGI Server |

### Frontend

| Technologie | Einsatz |
|---|---|
| React | Benutzeroberfläche |
| TypeScript | Typisierte Frontend-Entwicklung |
| Vite | Build Tool |
| dnd-kit | Drag & Drop |
| Recharts | Diagramme und Dashboard |

### Deployment / Infrastruktur

| Technologie | Einsatz |
|---|---|
| Apache | Webserver und Reverse Proxy im Live-Betrieb |
| Nginx | Reverse Proxy im Docker-Setup |
| Gunicorn | Backend Server |
| Docker Compose | Lokale Container-Umgebung |
| PostgreSQL | Datenbank im Container |
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
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── vite.config.ts
│   └── README.md
│
├── Dockerfile.backend
├── docker-compose.yml
├── .dockerignore
├── .env.docker.example
├── manage.py
├── requirements.txt
├── README.md
└── .gitignore
```

---

## ⚙️ Lokale Installation ohne Docker

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

## 🐳 Start mit Docker Compose

Das Projekt kann alternativ vollständig mit Docker Compose gestartet werden.  
Dabei werden automatisch folgende Dienste gestartet:

```text
Frontend: React/Vite Build über Nginx
Backend: Django REST API über Gunicorn
Datenbank: PostgreSQL
```

### Voraussetzungen

- Docker
- Docker Compose Plugin

Version prüfen:

```bash
docker --version
docker compose version
```

### Docker-Umgebungsdatei erstellen

```bash
cp .env.docker.example .env.docker
```

Die Datei `.env.docker` enthält lokale Docker-Konfigurationen wie Datenbankname, Benutzer, Passwort und Django Secret Key.

> Hinweis: `.env.docker` wird nicht ins GitHub-Repository hochgeladen.

### Docker-Container starten

```bash
docker compose up --build
```

Danach ist die Anwendung lokal erreichbar unter:

```text
http://localhost:8090/automatisierung-tool/
```

### Container im Hintergrund starten

```bash
docker compose up -d --build
```

### Container stoppen

```bash
docker compose down
```

### Logs anzeigen

```bash
docker compose logs -f
```

### Demo-User im Docker-System anlegen

```bash
docker compose exec backend python manage.py shell
```

Dann im Django-Shell-Fenster:

```python
from django.contrib.auth.models import User
from automation.models import Task

user, created = User.objects.get_or_create(username="demo")
user.set_password("demo123456")
user.is_active = True
user.save()

Task.objects.get_or_create(
    title="Docker Deployment testen",
    created_by=user,
    defaults={
        "description": "Automatisierung Tool lokal mit Docker Compose starten.",
        "status": "offen",
        "priority": "hoch",
    },
)

print("Demo-Zugang fertig: demo / demo123456")
exit()
```

### Docker-Setup Übersicht

```text
Browser
   ↓
Nginx Container
   ↓
React Frontend: /automatisierung-tool/
   ↓
Proxy: /automatisierung-tool-api/
   ↓
Django Backend Container
   ↓
PostgreSQL Container
```

Dieses Docker-Setup zeigt, dass die Anwendung reproduzierbar und containerisiert gestartet werden kann.

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

Für Docker wird eine eigene Datei genutzt:

### `.env.docker.example`

```env
DJANGO_SECRET_KEY=django-insecure-docker-dev-key-change-me
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

POSTGRES_DB=automation
POSTGRES_USER=automation
POSTGRES_PASSWORD=automation_password
POSTGRES_HOST=db
POSTGRES_PORT=5432
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
- Docker Compose Setup
- PostgreSQL im Container
- Deployment mit Apache, Gunicorn und HTTPS
- Debugging und produktionsnahes Arbeiten

---


---

## 📌 Status

✅ Live  
✅ Registrierung aktiv  
✅ Demo-Zugang aktiv  
✅ Dashboard aktiv  
✅ HTTPS aktiv  
✅ Docker Compose Setup aktiv  

---

## 📄 Hinweis

Dieses Projekt dient als Portfolio-Projekt und zeigt eine vollständige Fullstack-Anwendung mit Backend, Frontend, Authentifizierung, Dashboard, Docker-Setup und Deployment.
