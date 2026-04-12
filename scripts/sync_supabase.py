#!/usr/bin/env python3
"""
sync_supabase.py — Synchronise donnees/suivi_collecte.json
vers la table `statistiques_collection` de Supabase.

Agrégation : une ligne par (date, langue, source_id).
Upsert via l'API REST Supabase avec Prefer: resolution=merge-duplicates.

Variables d'environnement requises :
  SUPABASE_URL       — ex. https://qkxdsvfoahhwljkempth.supabase.co
  SUPABASE_ANON_KEY  — clé anon publique du projet
"""

import json
import os
import sys
import argparse
from collections import defaultdict
from datetime import datetime, timezone

try:
    import requests
except ImportError:
    print("[ERREUR] Le module 'requests' est requis. Installez-le avec : pip install requests")
    sys.exit(1)


# ─────────────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────────────

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://ihsylxxuakpqciyweied.supabase.co")
SUPABASE_ANON_KEY = os.environ.get(
    "SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc3lseHh1YWtwcWNpeXdlaWVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MzU0NDYsImV4cCI6MjA5MTQxMTQ0Nn0.2zdGhYVN05Qj6n86cB8W1JxS_diOzM5AmDt1anLjjIo"
)
TABLE = "statistiques_collection"
ENDPOINT = f"{SUPABASE_URL}/rest/v1/{TABLE}?on_conflict=date,langue,source"

HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates",
}


# ─────────────────────────────────────────────────────────────────────────────
# Lecture et agrégation du fichier suivi_collecte.json
# ─────────────────────────────────────────────────────────────────────────────

def charger_suivi(chemin: str) -> dict:
    """Charge le fichier JSON de suivi de collecte."""
    if not os.path.exists(chemin):
        print(f"[ERREUR] Fichier introuvable : {chemin}")
        sys.exit(1)
    with open(chemin, "r", encoding="utf-8") as f:
        return json.load(f)


def agreger_par_date_langue_source(suivi: dict) -> list[dict]:
    """
    Agrège les entrées de l'historique par (date_jour, langue, source_id).

    Retourne une liste de dicts prêts pour l'upsert Supabase :
      - date          : str "YYYY-MM-DD"
      - langue        : str (lin | kon | sag)
      - source        : str (source_id)
      - total_secondes: float (somme des duree_secondes)
      - total_segments: int  (nombre d'entrées avec statut == "succes")
      - corrections_totales : int (toujours 0 ici, mis à jour par d'autres scripts)
    """
    # Clé : (date_jour, langue, source_id) → agrégat
    agregats: dict[tuple, dict] = defaultdict(lambda: {
        "total_secondes": 0.0,
        "total_segments": 0,
        "corrections_totales": 0,
    })

    for langue, data in suivi.items():
        historique = data.get("historique", [])
        for entree in historique:
            # Extraire la date (YYYY-MM-DD) depuis l'horodatage ISO
            try:
                dt = datetime.fromisoformat(entree["date"])
                date_jour = dt.date().isoformat()
            except (KeyError, ValueError):
                date_jour = datetime.now(timezone.utc).date().isoformat()

            source_id = entree.get("source_id", "inconnu")
            duree = float(entree.get("duree_secondes", 0) or 0)
            statut = entree.get("statut", "")

            cle = (date_jour, langue, source_id)
            agregats[cle]["total_secondes"] += duree
            if statut == "succes":
                agregats[cle]["total_segments"] += 1

    rows = []
    for (date_jour, langue, source_id), vals in agregats.items():
        rows.append({
            "date": date_jour,
            "langue": langue,
            "source": source_id,
            "total_secondes": round(vals["total_secondes"], 2),
            "total_segments": vals["total_segments"],
            "corrections_totales": vals["corrections_totales"],
        })

    return rows


# ─────────────────────────────────────────────────────────────────────────────
# Upsert vers Supabase
# ─────────────────────────────────────────────────────────────────────────────

def upsert_rows(rows: list[dict], dry_run: bool = False) -> int:
    """
    Envoie les lignes vers Supabase via POST avec Prefer: resolution=merge-duplicates.
    Retourne le nombre de lignes traitées avec succès.
    """
    if not rows:
        print("[INFO] Aucune ligne à synchroniser.")
        return 0

    print(f"[INFO] {len(rows)} ligne(s) à synchroniser vers '{TABLE}'...")

    if dry_run:
        print("[DRY-RUN] Lignes qui seraient envoyées :")
        for row in rows:
            print(f"  {row}")
        return len(rows)

    # Envoyer par lots de 100 pour éviter les timeouts
    BATCH_SIZE = 100
    total_ok = 0

    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        try:
            resp = requests.post(ENDPOINT, headers=HEADERS, json=batch, timeout=30)
            if resp.status_code in (200, 201, 204):
                total_ok += len(batch)
                print(f"  [OK] Lot {i // BATCH_SIZE + 1} : {len(batch)} ligne(s) upsertées (HTTP {resp.status_code})")
            else:
                print(f"  [ERREUR] Lot {i // BATCH_SIZE + 1} : HTTP {resp.status_code} — {resp.text[:300]}")
        except requests.RequestException as e:
            print(f"  [ERREUR] Lot {i // BATCH_SIZE + 1} : exception réseau — {e}")

    return total_ok


# ─────────────────────────────────────────────────────────────────────────────
# Point d'entrée
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Synchronise suivi_collecte.json vers Supabase statistiques_collection"
    )
    parser.add_argument(
        "--suivi",
        default="donnees/suivi_collecte.json",
        help="Chemin vers le fichier suivi_collecte.json (défaut: donnees/suivi_collecte.json)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Affiche les lignes sans les envoyer à Supabase"
    )
    args = parser.parse_args()

    print(f"[{datetime.now().isoformat()}] Démarrage de la synchronisation Supabase")
    print(f"  Fichier source : {args.suivi}")
    print(f"  Endpoint       : {ENDPOINT}")

    suivi = charger_suivi(args.suivi)
    rows = agreger_par_date_langue_source(suivi)

    # Résumé avant envoi
    langues = {}
    for row in rows:
        langues[row["langue"]] = langues.get(row["langue"], 0) + 1
    print(f"  Lignes agrégées : {len(rows)} total — {langues}")

    nb_ok = upsert_rows(rows, dry_run=args.dry_run)

    print(f"[{datetime.now().isoformat()}] Synchronisation terminée : {nb_ok}/{len(rows)} ligne(s) OK")

    if nb_ok < len(rows):
        sys.exit(1)


if __name__ == "__main__":
    main()
