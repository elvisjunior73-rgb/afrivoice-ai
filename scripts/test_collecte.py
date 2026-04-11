"""
Script de test rapide pour valider la collecte YouTube.
Télécharge les métadonnées (sans audio) de quelques vidéos récentes.
"""
import yt_dlp
import json

SOURCES_TEST = {
    "lin": {
        "url": "https://www.youtube.com/@radio_okapi/videos",
        "description": "Radio Okapi — vidéos récentes (Lingala/Français)"
    },
    "sag": {
        "url": "https://www.youtube.com/@radiondekeluka9232/videos",
        "description": "Radio Ndeke Luka — vidéos récentes (Sango/Français)"
    }
}

def tester_source(langue, url, description):
    print(f"\n{'='*60}")
    print(f"Test source [{langue.upper()}] : {description}")
    print(f"URL : {url}")
    
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': True,
        'playlistend': 5
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
        if info:
            entries = info.get('entries', [info])
            total_duree = sum((e.get('duration', 0) or 0) for e in entries if e)
            print(f"  Nombre de vidéos trouvées : {len(entries)}")
            print(f"  Durée totale estimée : {total_duree}s ({total_duree/3600:.2f}h)")
            for i, entry in enumerate(entries[:3]):
                if entry:
                    titre = entry.get('title', 'N/A')
                    duree = entry.get('duration', 0)
                    print(f"  [{i+1}] {titre[:60]} ({duree}s)")
            print(f"  STATUT : OK")
            return True, len(entries), total_duree
        else:
            print(f"  STATUT : Aucune donnée récupérée")
            return False, 0, 0
    except Exception as e:
        print(f"  STATUT : ERREUR - {e}")
        return False, 0, 0

if __name__ == "__main__":
    resultats = {}
    for langue, config in SOURCES_TEST.items():
        ok, nb_videos, duree = tester_source(langue, config["url"], config["description"])
        resultats[langue] = {"statut": "OK" if ok else "ECHEC", "nb_videos": nb_videos, "duree_s": duree}
    
    print(f"\n{'='*60}")
    print("RÉSUMÉ DES TESTS :")
    for langue, r in resultats.items():
        print(f"  {langue.upper()} : {r['statut']} | {r['nb_videos']} vidéos | {r['duree_s']/3600:.2f}h")
