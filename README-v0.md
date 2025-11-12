# Front-End Bézier Curves MVC

[Live Demo](https://jonat94.github.io/front-end-bezier-curves-paper.js-mvc/)

# Éditeur de Courbes Bézier avec Offsets

Un éditeur interactif de courbes Bézier en JavaScript utilisant **Paper.js** et **Clipper.js**, permettant de :

- Création et modification de courbes Bézier via des handles interactifs.
- Calcul et visualisation des offsets avec ClipperLib.
- Remplissage entre courbe principale et offsets.
- Gestion de plusieurs courbes et offsets avec une interface dynamique.
- Export du canvas en image PNG.
- Exporter les dessins en PNG ou JSON, et importer des courbes sauvegardées.
- Personnaliser le nom de chaque courbe.

> Ce projet est également **un exemple concret de mise en œuvre du design pattern MVC (Model-View-Controller)** en JavaScript moderne.
> L'objectif de ce projet est de montrer mes compétences en développement JavaScript moderne, gestion de canvas, manipulation géométrique et architecture logiciel. Il sert également de support pédagogique pour des cours sur le developpement et l'architecture logiciel.

---

## Architecture MVC

- **Model (`DrawingModel.js`)** : gère les données des courbes, points et calculs d’offset.
- **View (`ToolbarView.js`)** : interface utilisateur, sliders, checkboxes, boutons et canvas.
- **Controller (`DrawingController.js`, `ToolController.js`)** : logique de liaison entre le modèle et la vue, interactions utilisateurs, gestion des événements.

Cette séparation permet de :

- Distinguer clairement la **logique métier** (calculs des offsets) de la **présentation** (canvas, sliders) et de la **gestion des événements**.
- Faciliter la maintenance et l’extension du projet.

---

##Déploiement

La démo en ligne est disponible sur GitHub Pages :
Voir la démo

## Installation / Utilisation

1. Cloner le dépôt :

```bash
git clone https://github.com/Jonat94/front-end-bezier-curves-paper.js-mvc.git

npm install

npm run dev
---




## Technologies

- JavaScript (ES6+)
- [Paper.js](http://paperjs.org/) pour le rendu vectoriel
- [ClipperLib](https://github.com/junmer/clipper-lib) pour les offsets géométriques
- HTML5 / CSS3
- GitHub Pages pour le déploiement

---


### Gestion des courbes

- Ajouter une nouvelle courbe avec un nom personnalisé.
- Supprimer une courbe sélectionnée.
- Sélectionner une courbe existante dans la liste déroulante.

### Points de contrôle

- Afficher ou cacher les points de contrôle (handles).
- Déplacer les points et leurs poignées Bézier.
- Supprimer un point sélectionné.

### Offsets

- Gestion dynamique des offsets par courbe, avec sliders pour modifier la distance.
- Activer/désactiver la visibilité de chaque offset.
- Les offsets sont recalculés automatiquement lors de la modification de la courbe.

### Export / Import

- Exporter le dessin courant en image PNG.
- Sauvegarder la courbe sélectionnée au format JSON.
- Importer un fichier JSON pour ajouter une nouvelle courbe dans l’éditeur.

### Canvas

- Affichage du fond optionnel.
- Déplacement complet de la courbe en cliquant et en glissant.

```
