[![forthebadge](https://forthebadge.com/images/badges/cc-0.svg)](https://forthebadge.com) [![forthebadge](https://forthebadge.com/images/badges/made-with-javascript.svg)](https://forthebadge.com) [![forthebadge](https://forthebadge.com/images/badges/uses-css.svg)](https://forthebadge.com)

<p align="center">
  <img src="screenshot.png" width="600" alt="Aperçu de l'application">
</p>

# 🎨 Bézier Curves Editor – MVC avec Paper.js & ClipperLib

[🌐 Voir la démo en ligne](https://jonat94.github.io/front-end-bezier-curves-paper.js-mvc/)

---

## 🚀 Description du projet

Application web interactive développée en **JavaScript (ES6)** mettant en œuvre le **modèle MVC**.  
Elle permet de **créer, manipuler et visualiser des courbes de Bézier** et leurs **offsets** grâce à :

- 🖊️ **Paper.js** pour le rendu vectoriel et la gestion des courbes.
- ⚙️ **ClipperLib** pour le calcul précis des décalages géométriques (offsets).
- 🧩 Une architecture **claire et modulaire (MVC)** favorisant la maintenance et l’apprentissage.

Ce projet illustre à la fois mes **compétences en développement front-end** et ma **pédagogie** dans l’explication des concepts géométriques et architecturaux.

---

## 🧠 Objectif professionnel

🎯 Je cherche à :

- **Intégrer une équipe de développement front-end** où je peux contribuer à des projets créatifs et techniques.
- Ou **transmettre mon savoir** en enseignant la programmation JavaScript, le dessin vectoriel et l’architecture logicielle moderne.

---

## 🧩 Fonctionnalités principales

- Création et édition de **courbes de Bézier** via des points et poignées interactifs.
- Calcul dynamique des **offsets** (déports) avec remplissage visuel entre courbes.
- Gestion multi-courbes et multi-offsets via une **interface contrôlable par sliders et cases à cocher**.
- Export du canvas en **image PNG**.
- Affichage optionnel des **handles**, du **fond** et des **niveaux d’offset**.

---

## 🏗️ Architecture MVC

| Composant                           | Rôle                                                                          |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| **Model (CurveProcessor)**          | Gestion et calculs géométriques (offsets, échantillonnage, filtrage).         |
| **View (CanvasView & ToolbarView)** | Affichage graphique avec Paper.js et interface utilisateur HTML.              |
| **Controller**                      | Coordination des événements entre modèle et vue (interactions, mises à jour). |

Cette séparation claire rend le code **pédagogique, évolutif et réutilisable**.

---

## 🧰 Technologies utilisées

- JavaScript (ES6 Modules)
- [Paper.js](http://paperjs.org/)
- [ClipperLib](https://github.com/junmer/clipper-lib)
- HTML5 / CSS3
- GitHub Pages (hébergement)

---

## ⚡ Installation & utilisation

```bash
git clone https://github.com/Jonat94/front-end-bezier-curves-paper.js-mvc.git
cd front-end-bezier-curves-paper.js-mvc
npm install
nom run dev
```
