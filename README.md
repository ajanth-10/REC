# BP23REC — Entraînement

Application web mobile-first pour réviser le module BP23REC à partir d'une étude de cas.

## Contenu

- Énoncé de l'étude de cas
- Graphique intégré et agrandissable
- 10 questions interactives
- Correction immédiate après chaque question
- Notions débloquées progressivement
- Sauvegarde locale de la progression
- Manifest PWA + service worker

## Structure

```txt
index.html
manifest.webmanifest
service-worker.js
.nojekyll
css/style.css
js/app.js
js/data-trainings.js
js/data-notions.js
assets/images/graphique-attention.png
assets/icons/icon-192.png
assets/icons/icon-512.png
assets/icons/icon-512-maskable.png
```

## Tester localement

Les modules JavaScript ne doivent pas être ouverts en `file://`. Utilise un petit serveur local :

```bash
python3 -m http.server 8000
```

Puis ouvre :

```txt
http://localhost:8000
```

## Publier avec GitHub Pages

1. Crée un dépôt GitHub.
2. Ajoute tous les fichiers du dossier.
3. Dans GitHub : Settings > Pages.
4. Source : branche `main`, dossier `/root`.
5. Ouvre l'URL GitHub Pages générée.

## Ajouter d'autres entraînements

Ajoute de nouveaux objets dans `js/data-trainings.js`, puis adapte l'interface de sélection si plusieurs entraînements doivent être proposés.


## Version 2

Corrections enrichies, ajout de `white-space: pre-line` pour préserver les paragraphes de correction, ajout de screenshots dans le manifest PWA et passage du cache service worker à `bp23rec-training-v2`.


## Correction v3

Cette version stabilise la barre de navigation mobile avec `viewport-fit=cover`, `env(safe-area-inset-bottom)` et une barre inférieure à hauteur fixe.


## Version v4

- Correction responsive mobile : suppression du débordement horizontal.
- Navigation basse stabilisée pour téléphone.
- Largeurs contraintes à 100vw et texte forcé à revenir à la ligne.
- Cache du service worker mis à jour en v4.
