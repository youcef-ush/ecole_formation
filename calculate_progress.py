#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour calculer la progression du PROJECT_PLAN
"""

import pandas as pd

# Lire le CSV
df = pd.read_csv('PROJECT_PLAN.csv', encoding='utf-8')

# Calculs globaux
total_tasks = len(df)
completed_tasks = len(df[df['Statut'].str.contains('TERMINÉ', na=False)])
pending_tasks = total_tasks - completed_tasks
percent_tasks = (completed_tasks / total_tasks * 100)

# Calculs temps
hours_total = df['Durée (h)'].sum()
hours_completed = df[df['Statut'].str.contains('TERMINÉ', na=False)]['Durée (h)'].sum()
hours_pending = hours_total - hours_completed
percent_hours = (hours_completed / hours_total * 100)

# Affichage
print("\n" + "="*70)
print("📊 PROGRESSION DU PROJET - ÉCOLE DE FORMATION")
print("="*70)
print(f"\n✅ TÂCHES TERMINÉES: {completed_tasks}/{total_tasks} ({percent_tasks:.1f}%)")
print(f"⏳ TÂCHES RESTANTES: {pending_tasks}")
print(f"\n⏱️  TEMPS TOTAL ESTIMÉ: {hours_total:.2f}h")
print(f"✅ TEMPS COMPLÉTÉ: {hours_completed:.2f}h ({percent_hours:.1f}%)")
print(f"⏳ TEMPS RESTANT: {hours_pending:.2f}h")

# Détail par module
print("\n" + "="*70)
print("📋 DÉTAIL PAR MODULE")
print("="*70)

modules = df.groupby('Module').agg({
    'Statut': lambda x: (x.str.contains('TERMINÉ', na=False).sum(), len(x)),
    'Durée (h)': 'sum'
})

for module, row in modules.iterrows():
    completed, total = row['Statut']
    hours = row['Durée (h)']
    percent = (completed / total * 100) if total > 0 else 0
    status = "✅" if completed == total else "🔄" if completed > 0 else "⏳"
    print(f"\n{status} {module}")
    print(f"   Tâches: {completed}/{total} ({percent:.1f}%)")
    print(f"   Temps: {hours:.2f}h")

# Tâches en cours/prioritaires
print("\n" + "="*70)
print("🔥 TÂCHES PRIORITAIRES À VENIR")
print("="*70)

next_tasks = df[
    (df['Statut'] == 'À faire') & 
    (df['Priorité'] == 'HAUTE')
].head(5)

for idx, task in next_tasks.iterrows():
    print(f"\n• Tâche {task['ID']}: {task['Tâche']}")
    print(f"  Durée: {task['Durée (h)']}h | Dépendances: {task['Dépendances']}")

print("\n" + "="*70)
print(f"🎯 PROGRESSION GLOBALE: {percent_tasks:.1f}% des tâches | {percent_hours:.1f}% du temps")
print("="*70 + "\n")
