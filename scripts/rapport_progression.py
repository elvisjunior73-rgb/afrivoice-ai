"""
Génère un rapport de progression vers l'objectif de 20 000 heures par langue.
Lit le fichier de suivi de collecte et produit un résumé lisible.
"""
import os
import json
import argparse
from datetime import datetime

OBJECTIF_HEURES = 20000
LANGUES = {
    "lin": "Lingala",
    "kon": "Kikongo",
    "sag": "Sango"
}

def generer_rapport(suivi_path, output_path=None):
    """Génère un rapport de progression en Markdown."""
    
    suivi = {}
    if os.path.exists(suivi_path):
        with open(suivi_path, 'r', encoding='utf-8') as f:
            suivi = json.load(f)
    
    lignes = []
    lignes.append(f"# Rapport de Progression — AfriVoice AI")
    lignes.append(f"\n_Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')} UTC_\n")
    lignes.append(f"**Objectif global :** {OBJECTIF_HEURES} heures d'audio par langue\n")
    lignes.append("---\n")
    lignes.append("| Langue | Heures collectées | Progression | Restant |")
    lignes.append("|--------|-------------------|-------------|---------|")
    
    for code, nom in LANGUES.items():
        total_s = suivi.get(code, {}).get("total_secondes", 0)
        total_h = total_s / 3600
        pct = min((total_h / OBJECTIF_HEURES) * 100, 100)
        restant_h = max(OBJECTIF_HEURES - total_h, 0)
        barre = "█" * int(pct / 5) + "░" * (20 - int(pct / 5))
        lignes.append(f"| {nom} ({code}) | {total_h:.1f}h | `{barre}` {pct:.1f}% | {restant_h:.0f}h |")
    
    lignes.append("\n---\n")
    lignes.append("## Détail par langue\n")
    
    for code, nom in LANGUES.items():
        data = suivi.get(code, {})
        total_s = data.get("total_secondes", 0)
        historique = data.get("historique", [])
        nb_succes = sum(1 for e in historique if e.get("statut") == "succes")
        nb_echecs = sum(1 for e in historique if e.get("statut") == "echec")
        
        lignes.append(f"### {nom} ({code})")
        lignes.append(f"- **Total collecté :** {total_s/3600:.2f} heures ({total_s} secondes)")
        lignes.append(f"- **Collectes réussies :** {nb_succes}")
        lignes.append(f"- **Collectes échouées :** {nb_echecs}")
        
        if historique:
            derniere = historique[-1]
            lignes.append(f"- **Dernière collecte :** {derniere.get('date', 'N/A')} — {derniere.get('source_id', 'N/A')} ({derniere.get('statut', 'N/A')})")
        lignes.append("")
    
    rapport = "\n".join(lignes)
    
    if output_path:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(rapport)
        print(f"Rapport sauvegardé dans {output_path}")
    else:
        print(rapport)
    
    return rapport

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Génère un rapport de progression AfriVoice AI.")
    parser.add_argument("--suivi", type=str, default="../donnees/suivi_collecte.json", help="Chemin vers le fichier de suivi.")
    parser.add_argument("--output", type=str, default=None, help="Chemin de sortie du rapport Markdown (optionnel).")
    
    args = parser.parse_args()
    generer_rapport(args.suivi, args.output)
