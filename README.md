# Éditeur de Courbes Bézier avec Offsets

Un éditeur interactif de courbes Bézier en JavaScript utilisant **Paper.js** et **Clipper.js**, permettant de :

- Créer, sélectionner et supprimer des courbes.
- Ajouter et déplacer des points et poignées de contrôle.
- Calculer et afficher jusqu’à 3 offsets par courbe.
- Exporter les dessins en PNG ou JSON, et importer des courbes sauvegardées.
- Personnaliser le nom de chaque courbe.

> ⚡ Ce projet est également **un exemple concret de mise en œuvre du design pattern MVC (Model-View-Controller)** en JavaScript moderne.

---

## Architecture MVC

- **Model (`DrawingModel.js`)** : gère les données des courbes, points et calculs d’offset.
- **View (`ToolbarView.js`)** : interface utilisateur, sliders, checkboxes, boutons et canvas.
- **Controller (`DrawingController.js`, `ToolController.js`)** : logique de liaison entre le modèle et la vue, interactions utilisateurs, gestion des événements.

Cette séparation permet de :

- Distinguer clairement la **logique métier** (calculs des offsets) de la **présentation** (canvas, sliders) et de la **gestion des événements**.
- Faciliter la maintenance et l’extension du projet.

---

## Fonctionnalités

### Gestion des courbes

- Ajouter une nouvelle courbe avec un nom personnalisé.
- Supprimer une courbe sélectionnée.
- Sélectionner une courbe existante dans la liste déroulante.

### Points de contrôle

- Afficher ou cacher les points de contrôle (handles).
- Déplacer les points et leurs poignées Bézier.
- Supprimer un point sélectionné.

### Offsets

- Jusqu’à 3 offsets par courbe, avec sliders pour modifier la distance.
- Activer/désactiver la visibilité de chaque offset.
- Les offsets sont recalculés automatiquement lors de la modification de la courbe.

### Export / Import

- Exporter le dessin courant en image PNG.
- Sauvegarder la courbe sélectionnée au format JSON.
- Importer un fichier JSON pour ajouter une nouvelle courbe dans l’éditeur.

### Canvas

- Affichage du fond optionnel.
- Déplacement complet de la courbe en cliquant et en glissant.

---

## Installation

1. Cloner le dépôt :

```bash
git clone <URL_DU_DEPOT>
```
