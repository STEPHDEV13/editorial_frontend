# TARAM GROUP – Editorial Back Office

Front-end React/Vite pour le back-office éditorial connecté au backend Express.

---

## Stack technique

| Lib | Usage |
|---|---|
| React 18 + Vite + TypeScript | Base du projet |
| Material UI (MUI) v5 | Design system dark / brand |
| React Router v6 | Routing SPA |
| Axios | Client HTTP |
| TanStack Query v5 | Gestion des données serveur |
| React Hook Form + Zod | Formulaires + validation |
| @fontsource/inter | Typographie |

---

## Installation

```bash
# 1. Variables d'environnement
cp .env.example .env
# Editez .env et renseignez l'URL de votre API backend

# 2. Dependances
npm install

# 3. Lancement dev
npm run dev
# -> http://localhost:3000
```

### Scripts disponibles

| Commande | Role |
|---|---|
| `npm run dev` | Serveur de developpement (hot reload) |
| `npm run build` | Build de production (`dist/`) |
| `npm run preview` | Previsualisation du build prod |

---

## Configuration `.env`

```env
# URL de base de l'API backend Express
VITE_API_URL=http://localhost:4000
```

---

## Logo & Identite visuelle

Le logo se trouve dans **`src/assets/68e50a66e42f8802615262.png`**.
Pour remplacer le logo par le votre :

1. Copiez votre fichier dans `src/assets/68e50a66e42f8802615262.png` (ou `.png`)
2. Si vous utilisez un `.png`, mettez a jour l'import dans `src/components/branding/BrandLogo.tsx`
3. Le favicon est dans **`public/favicon.svg`** - remplacez-le par votre variante compacte

Le logo est utilise dans :
- **Sidebar** : variante `full` (logo + "TARAM GROUP") / `compact` (logo seul si reduite)
- **Topbar** : variante `compact` sur mobile
- **Dashboard** : hero header avec variante `full` + tagline
- **LoadingState / EmptyState** : en filigrane (faible opacite)
- **Favicon** : `public/favicon.svg`

---

## Endpoints API utilises

> Base URL : `VITE_API_URL` (defaut : `http://localhost:4000`)

### Articles
| Methode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/articles` | Liste des articles |
| `GET` | `/api/articles/:id` | Detail d'un article |
| `POST` | `/api/articles` | Creer un article |
| `PUT` | `/api/articles/:id` | Mettre a jour un article |
| `DELETE` | `/api/articles/:id` | Supprimer un article |
| `PATCH` | `/api/articles/:id/status` | Changer le statut (`draft`/`published`/`archived`) |
| `POST` | `/api/articles/:id/notify` | Envoyer une notification push |

### Categories
| Methode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/categories` | Liste des categories |
| `POST` | `/api/categories` | Creer une categorie |
| `PUT` | `/api/categories/:id` | Mettre a jour une categorie |
| `DELETE` | `/api/categories/:id` | Supprimer une categorie |

### Reseaux
| Methode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/networks` | Liste des reseaux |

### Import
| Methode | Endpoint | Description |
|---|---|---|
| `POST` | `/api/import/articles` | Import d'articles depuis un fichier JSON |

### Notifications
| Methode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/notifications` | Historique des notifications |

---

## Structure du projet

```
src/
  assets/
    68e50a66e42f8802615262.png                   <- Remplacez par votre logo
  theme.ts                     <- Theme MUI dark + couleurs brand
  types/index.ts               <- Types TypeScript globaux
  services/api.ts              <- Tous les appels API centralises
  app/
    router.tsx                 <- Routes React Router v6
  main.tsx
  App.tsx
  components/
    branding/
      BrandLogo.tsx            <- Logo (variants full / compact)
      BrandGradientText.tsx    <- Texte en degrade brand
    layout/
      AppShell.tsx             <- Layout principal
      Sidebar.tsx              <- Navigation laterale
      Topbar.tsx               <- Barre superieure
    common/
      StatusChip.tsx           <- Badge statut article
      LoadingState.tsx         <- Etat de chargement
      EmptyState.tsx           <- Etat vide
      ConfirmDialog.tsx        <- Dialog de confirmation
  pages/
    DashboardPage.tsx
    ArticlesPage.tsx
    ArticleFormPage.tsx
    CategoriesPage.tsx
    NotificationsPage.tsx
    ImportPage.tsx
```

---

## Design System

- **Mode** : Dark par defaut
- **Fond** : `#0B0B10` (noir bleute)
- **Paper** : `#12121A`
- **Primary** : `#2979FF` (bleu techno)
- **Secondary** : `#7B2FBE` (violet)
- **Gradient brand** : `linear-gradient(90deg, #2979FF -> #7B2FBE)`
- **Font** : Inter (via @fontsource/inter)
- **Border radius cards** : 16px
