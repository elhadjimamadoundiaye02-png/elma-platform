# ELMA & Frères — Plateforme (monorepo)

```
elma-platform/
├── frontend/     # React + Vite → déployé sur GitHub Pages
├── backend/      # NestJS → déployé sur Render (auto-deploy depuis GitHub)
├── render.yaml   # Infra backend décrite en code (Blueprint Render)
└── .github/workflows/
    ├── frontend-deploy.yml   # build + publie frontend/dist sur GitHub Pages
    └── backend-ci.yml        # vérifie que le backend compile à chaque push
```

**Principe :** tout part de GitHub. Vous poussez du code sur `main`, GitHub Actions construit et publie le frontend sur GitHub Pages, et Render redéploie automatiquement le backend dès qu'il détecte le nouveau commit. Aucune commande de déploiement manuelle après la configuration initiale.

---

## Étape 1 — Créer le dépôt GitHub

```bash
cd elma-platform
git init
git add .
git commit -m "Initial commit — plateforme ELMA & Frères"
gh repo create elma-platform --public --source=. --push
# ou, sans gh CLI : créez le repo "elma-platform" sur github.com,
# puis : git remote add origin https://github.com/<votre-user>/elma-platform.git
#        git branch -M main && git push -u origin main
```

⚠️ Si vous nommez le dépôt différemment de `elma-platform`, changez la valeur `base` dans `frontend/vite.config.js` pour qu'elle corresponde (`/<nom-du-repo>/`).

---

## Étape 2 — Activer GitHub Pages

1. Sur GitHub : **Settings → Pages**
2. Section "Build and deployment" → Source : **GitHub Actions** (pas "Deploy from a branch")
3. C'est tout — le workflow `frontend-deploy.yml` prend le relais dès le prochain push sur `frontend/`.

Votre site sera accessible à `https://<votre-user>.github.io/elma-platform/`.

---

## Étape 3 — Déployer le backend sur Render

1. Créez un compte sur [render.com](https://render.com) et connectez votre compte GitHub.
2. Dashboard Render → **New +** → **Blueprint**.
3. Sélectionnez le dépôt `elma-platform` — Render détecte automatiquement `render.yaml` à la racine.
4. Render crée trois ressources : la base **PostgreSQL**, un **Redis**, et le **service web** NestJS (`backend/`).
5. Une seule variable à renseigner manuellement dans le dashboard du service `elma-backend` : `FRONTEND_URL` = `https://<votre-user>.github.io/elma-platform` (l'URL obtenue à l'étape 2). Elle sert au CORS et aux origines Socket.io autorisées.
6. Cliquez **Apply** — premier déploiement lancé.

À partir de là, **chaque `git push` sur `main` touchant `backend/` redéploie automatiquement** (Render écoute votre repo GitHub nativement, pas besoin d'Action dédiée pour ça — `backend-ci.yml` sert uniquement à vérifier que le build ne casse rien).

⚠️ Le plan gratuit Render met le service en veille après 15 min d'inactivité (le réveil prend ~30-50s au premier appel). Pour un site en production avec du trafic régulier, passez au plan payant le plus bas (~7$/mois) pour rester actif en continu — important ici car le suivi temps réel des sessions admin perd son intérêt si le serveur dort.

---

## Étape 4 — Connecter le frontend au backend

1. Repérez l'URL du service `elma-backend` sur Render (ex. `https://elma-backend.onrender.com`).
2. Sur GitHub : **Settings → Secrets and variables → Actions → New repository secret** :
   - `VITE_API_URL` = `https://elma-backend.onrender.com/api/v1`
   - `VITE_SOCKET_URL` = `https://elma-backend.onrender.com`
3. Relancez le workflow frontend (`Actions` → `Déploiement Frontend` → `Run workflow`), ou poussez un commit sur `frontend/`.

Le frontend rebuild avec ces URLs injectées — plus rien à toucher ensuite.

---

## Étape 5 — Vérifier que tout communique

- [ ] `https://<votre-user>.github.io/elma-platform/` charge le site
- [ ] `https://elma-backend.onrender.com/api/v1/services` répond en JSON (catalogue des 5 pôles)
- [ ] Pas d'erreur CORS dans la console navigateur (sinon : vérifier `FRONTEND_URL` sur Render)
- [ ] Connexion Socket.io établie (onglet Network → WS, statut 101)

---

## Développement local

```bash
# Backend
cd backend
cp .env.example .env
docker compose up -d postgres redis   # bases locales, uniquement pour le dev
npm install && npx prisma migrate dev
npm run start:dev                      # http://localhost:3000

# Frontend, dans un autre terminal
cd frontend
cp .env.example .env    # pointer vers localhost:3000 en local
npm install
npm run dev                            # http://localhost:5173
```

---

## Ce qui reste à faire pour une mise en production complète

- **Domaine personnalisé** : GitHub Pages et Render acceptent tous les deux un domaine custom (ex. `elma-freres.sn`) — à configurer dans Settings → Pages / Render une fois le nom de domaine acheté.
- **Frontend non encore branché sur l'API réelle** : `App.jsx` utilise encore des données simulées (prototype). Prochaine étape : remplacer les `useState` de données mock par des appels à `API_URL` (`src/config.js`) et une connexion `socket.io-client` vers `SOCKET_URL`.
- **Upload de fichiers, PDF, notifications** : toujours en attente côté backend (cf. README de `backend/`).
