# Guide de Déploiement sur VPS

Voici les étapes pour déployer votre application sur votre serveur VPS.

## 1. Préparation (Sur votre machine locale)

Assurez-vous d'avoir sauvegardé tous les fichiers de configuration que je viens de créer (`docker-compose.prod.yml`, `nginx/`, `frontend/Dockerfile`, etc.) et poussez-les sur votre dépôt GitHub.

```bash
git add .
git commit -m "Ajout configuration déploiement production"
git push origin main
```

## 2. Connexion au Serveur

Ouvrez un terminal (PowerShell ou CMD) et connectez-vous à votre serveur :

```bash
ssh root@77.237.234.81
```
*Si on vous demande le mot de passe, tapez : `SRVsrvSkcm52`*

## 3. Installation de Docker et Git (Sur le serveur)

Une fois connecté au serveur, exécutez ces commandes une par une pour installer Docker et Git :

```bash
# Mettre à jour le système
apt-get update
apt-get upgrade -y

# Installer Git et autres prérequis
apt-get install -y git curl

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Installer Docker Compose (si non inclus)
apt-get install -y docker-compose-plugin
```

## 4. Récupération du Code

Clonez votre dépôt GitHub sur le serveur :

```bash
cd /var/www
# Si le dossier n'existe pas
mkdir -p /var/www
cd /var/www

# Clonez le projet dans un NOUVEAU dossier (par exemple : ecole-formation)
git clone https://github.com/youcef-ush/ecole_formation.git ecole-formation

## 5. Configuration de l'Environnement

Créez un fichier `.env` pour la production :

```bash
nano .env
```

Copiez et collez le contenu suivant (clic droit pour coller dans nano) :

```env
# Base de données
DB_PASSWORD=eftg

# Sécurité JWT (Changez ces valeurs pour la production !)
JWT_SECRET=k9L2mN5pQ8rS1tU4vW7xY0zA3bC6dE9fG2hI5jK8lM1nO4pQ7rS0tU3vW6xY9zA
JWT_REFRESH_SECRET=B2cD5eF8gH1iJ4kL7mN0oP3qR6sT9uV2wX5yZ8aB1cD4eF7gH0iJ3kL6mN9oP2q
```

*Pour sauvegarder dans nano : `Ctrl+O`, `Entrée`, puis `Ctrl+X` pour quitter.*

## 6. Lancement de l'Application

Lancez les conteneurs en mode production :

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## 7. Vérification

Votre application devrait maintenant être accessible sur :
http://inspiredacademy-dz.com:8080/dashboard

## 8. Dépannage (Troubleshooting)

### Erreur : "address already in use"
Nous avons configuré l'application sur le port **8080** pour éviter les conflits avec votre site principal qui utilise le port 80.

Si vous souhaitez que l'application soit accessible sans le port (ex: `http://inspiredacademy-dz.com/dashboard`), vous devez configurer le serveur web principal (celui qui occupe le port 80) pour rediriger le trafic `/dashboard` vers le port `8080`.

### Commandes Utiles

- **Voir les logs :**
  ```bash
  docker compose -f docker-compose.prod.yml logs -f
  ```

- **Arrêter l'application :**
  ```bash
  docker compose -f docker-compose.prod.yml down
  ```

- **Mettre à jour l'application (après un git push) :**
  ```bash
  git pull
  docker compose -f docker-compose.prod.yml up -d --build
  ```
