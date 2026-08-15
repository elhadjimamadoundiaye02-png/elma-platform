# ELMA & Frères — Backend API

API NestJS pour la plateforme de gestion de services informatiques & dépannage.
Couvre l'authentification, le catalogue de services, la gestion des tickets
(Kanban, statuts, assignation), le suivi des sessions en direct et les
statistiques admin, en temps réel via Socket.io + Redis.

Voir `architecture-backend-elma.md` pour le détail de l'architecture, du
modèle de données et des choix techniques.

## Démarrage rapide

```bash
cp .env.example .env
docker compose up -d postgres redis minio
npm install
npx prisma migrate dev --name init
npm run start:dev
```

L'API est servie sur `http://localhost:3000/api/v1`.
Le WebSocket (Socket.io) écoute sur le même port.

## Structure

```
src/
├── auth/          # Inscription, connexion, JWT (access + refresh), OTP
├── users/         # Gestion des utilisateurs (admin)
├── catalog/       # Catalogue des 5 pôles de service + estimation de devis
├── tickets/       # Création, statuts, historique, assignation technicien
├── messages/      # Messagerie par ticket (client ↔ technicien ↔ admin)
├── realtime/       # Gateway Socket.io + sessions live (Redis)
├── admin/         # Sessions en direct, invalidation, statistiques
├── common/        # Guards (JWT, rôles), decorators, enums partagés
└── prisma/        # Client Prisma (accès PostgreSQL)
```

## Points restant à implémenter avant mise en production

- **Upload de fichiers** (`storage` module) : URLs pré-signées vers MinIO/S3
  pour les photos de tickets et les QR codes.
- **Génération de PDF** (factures/devis) via `puppeteer` ou `pdf-lib`.
- **Providers de notification** (email SMTP, Twilio SMS, WhatsApp Business
  API) — les points d'intégration sont indiqués dans `tickets.service.ts`
  et `auth.service.ts` (OTP), à connecter à une queue BullMQ pour l'envoi
  asynchrone.
