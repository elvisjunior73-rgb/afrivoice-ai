# Configuration des Comptes et API

Ce document récapitule la configuration des comptes externes nécessaires au fonctionnement du pipeline AfriVoice AI.

## 1. Hugging Face (Stockage des Datasets)

Les datasets audio nettoyés sont automatiquement exportés vers Hugging Face.

- **Compte :** `elvisjunior73@gmail.com`
- **Nom d'utilisateur (Namespace) :** `MANIANGA`
- **Dépôts créés :**
  - [MANIANGA/afrivoice-lin](https://huggingface.co/datasets/MANIANGA/afrivoice-lin) (Lingala)
  - [MANIANGA/afrivoice-kon](https://huggingface.co/datasets/MANIANGA/afrivoice-kon) (Kikongo)
  - [MANIANGA/afrivoice-sag](https://huggingface.co/datasets/MANIANGA/afrivoice-sag) (Sango)

### Configuration du Token API (GitHub Actions)

Pour que le pipeline GitHub Actions puisse uploader les données automatiquement chaque nuit, vous devez configurer le secret `HF_TOKEN` dans votre dépôt GitHub :

1. Allez sur votre dépôt GitHub `elvisjunior73-rgb/afrivoice-ai`
2. Cliquez sur **Settings** > **Secrets and variables** > **Actions**
3. Cliquez sur **New repository secret**
4. Nom : `HF_TOKEN`
5. Valeur : *(Copiez-collez le token généré sur Hugging Face)*
6. Cliquez sur **Add secret**

*Note : Le token généré se nomme `afrivoice-pipeline` et possède les droits d'écriture (WRITE).*

## 2. Whisper (Transcription Automatique)

Le pipeline utilise le modèle Whisper d'OpenAI (version `large-v3` ou `base` selon la configuration) pour la transcription automatique.

- **Compte :** `elvisjunior73@gmail.com` (via Google)
- **Utilisation :** Le script `scripts/transcrire_auto.py` télécharge automatiquement les poids du modèle Whisper depuis Hugging Face lors de sa première exécution. Aucune clé API supplémentaire n'est requise pour l'utilisation locale/open-source de Whisper via la bibliothèque `transformers` ou `faster-whisper`.

Si vous décidez d'utiliser l'API payante d'OpenAI pour Whisper dans le futur, vous devrez ajouter une variable d'environnement `OPENAI_API_KEY`.
