# Migrations de la base de données

Ce dossier contient les scripts SQL pour les migrations de la base de données.

## Fichiers de migration

### add_installment_payments.sql
**Date:** 5 Novembre 2025  
**Description:** Ajoute le support des paiements échelonnés

**Modifications:**
- Création de la table `installment_payments`
- Ajout du champ `installmentPlan` dans `registrations`
- Création des index pour les performances
- Documentation des colonnes

**Utilisation:**
```bash
# Via PowerShell (depuis la racine du projet)
.\run-migration.ps1

# Via psql
psql -U postgres -d ecole_formation -f backend\migrations\add_installment_payments.sql

# Via pgAdmin
Ouvrir Query Tool et exécuter le fichier
```

## Convention de nommage

Les fichiers de migration suivent le format:
```
<action>_<description>.sql
```

Exemples:
- `add_installment_payments.sql` - Ajoute une fonctionnalité
- `alter_students_table.sql` - Modifie une table
- `create_reports_table.sql` - Crée une nouvelle table

## Ordre d'exécution

Les migrations doivent être exécutées dans l'ordre chronologique.

## Rollback

Si une migration doit être annulée, créer un fichier de rollback:
```
rollback_<nom_migration>.sql
```

## Historique

| Date | Fichier | Description | Statut |
|------|---------|-------------|---------|
| 2025-11-05 | add_installment_payments.sql | Paiements échelonnés | ✅ |

## Notes importantes

- Toujours sauvegarder la base avant une migration
- Tester d'abord sur un environnement de développement
- Documenter les changements dans ce README
- Vérifier les contraintes de clés étrangères
- Créer les index nécessaires pour les performances

## Sauvegarde avant migration

```bash
# Sauvegarder la base
pg_dump -U postgres -d ecole_formation -F c -f backup_$(date +%Y%m%d).dump

# Restaurer si nécessaire
pg_restore -U postgres -d ecole_formation backup_20251105.dump
```
