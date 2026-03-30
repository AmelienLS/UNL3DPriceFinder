# Journal des modifications

## [1.6.3] - 2026-03-30
> Commit : `fix(icons): regenerate icon.ico with valid RGBA PNG format`
### Corrigé
- `icon.ico` régénéré avec le bon color type PNG (RGBA = type 6) au lieu de RGB (type 2). Le mismatch entre l'en-tête IHDR et les données pixel corrompait le fichier et faisait échouer le build Windows.

## [1.6.2] - 2026-03-30
> Commit : `chore(ci): force Node.js 24 for GitHub Actions`
### Modifié
- Ajout de `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` dans le workflow pour supprimer le warning de dépréciation Node.js 20 et anticiper la migration obligatoire de juin 2026.

## [1.6.1] - 2026-03-30
> Commit : `chore(ci): trigger release from commit message version pattern`
### Ajouté
- Job `build-windows` dans le workflow GitHub Actions : build Tauri sur `windows-latest`, produit un installeur NSIS `.exe` per-user (sans droits admin).
- Upload de l'`.exe` en artifact et en pièce jointe de release GitHub sur tag `vX.Y.Z`.

## [1.6.0] - 2026-03-30
> Commit : `feat(ui): add version footer and fix titlebar drag`
### Ajouté
- Footer "Amélien LARADE — UNL3D Prix v1.6.0" en bas de chaque page.
### Corrigé
- La zone de drag en haut de la fenêtre (`titlebar-drag`) est maintenant fonctionnelle : suppression de `pointer-events: none` qui bloquait le déplacement.
- Ajout de `-webkit-app-region: no-drag` sur les éléments de la sidebar pour qu'ils restent cliquables sous la zone de drag.
### Modifié
- Numéro de version synchronisé à 1.6.0 dans `package.json`, `tauri.conf.json` et `Cargo.toml`.
- Auteur mis à jour dans `Cargo.toml` (Amélien LARADE).

## [1.5.0] - 2026-03-30
> Commit : `feat(charts): update pies with tier discount and loss indicator`
### Ajouté
- Les graphiques "Prix recommandé" et "Prix personnalisé" prennent désormais en compte la remise dégressive selon la quantité saisie.
- Badge affichant le % de remise appliqué dans l'en-tête de chaque graphique.
- Indicateur visuel "Vente à perte" (bordure rouge + bandeau) quand le prix après remise est inférieur au coût de production.
- Onglet "Projets" avec tableau (nom, n° objet, prix unitaire, client, matériau, date), recherche, suppression, restauration et export CSV.
- Bouton "Sauvegarder le projet" dans le calculateur avec modale de saisie (n° objet, client).
### Modifié
- Valeurs par défaut du PrintJob remises à zéro (poids, durée, main d'œuvre, prix).
### Supprimé
- Filament "Résine" des densités et profils thermiques connus.
- Calcul de consommation spécifique résine (UV LED).

## [1.3.0] - 2026-03-26
> Commit : `feat(parameters): move tier config to parameters page`
### Ajouté
- Section "Paliers dégressifs" dans les Paramètres : réduction par palier (%) et liste éditable des quantités paliers (ajout, suppression, tri auto).
- Affichage du % de remise cumulé à côté de chaque palier.
### Modifié
- `tierQuantities` et `discountStep` déplacés de `PrintJob` vers `Parameters`.
### Supprimé
- Champ "Remise par palier" de la tarification personnalisée dans le calculateur.
- Bouton "Réinitialiser les paramètres".

## [1.2.0] - 2026-03-26
> Commit : `feat(charts): merge tier bars and simulation curve into single chart`
### Modifié
- Fusion des graphiques en un seul graphique combiné avec zones surlignées alternées pour chaque palier de remise (label du % affiché en haut de chaque zone).
- Axe gauche : prix unitaire (courbe verte continue en escalier).
- Axe droit : prix total (courbe bleue continue, échelle séparée).
- Champ de saisie de la quantité envisagée et point rouge marqueur avec prix affiché.

## [1.1.1] - 2026-03-26
> Commit : `feat(charts): add editable custom price on pie chart center`
### Ajouté
- Prix personnalisé cliquable au centre du donut : clic pour éditer, Enter/blur pour valider, Escape pour annuler.
- Styles pour le bouton éditable (souligné en pointillés accent) et l'input inline.

## [1.1.0] - 2026-03-26
> Commit : `feat(calculator): add charts tab with cost breakdown and degressive pricing`
### Ajouté
- Onglet "Graphiques" dans le calculateur avec système d'onglets (Calcul / Graphiques).
- Trois graphiques donut côte à côte : coût de production, prix recommandé (avec marge), prix personnalisé (avec bénéfice).
- Graphique combiné barres + ligne pour les tarifs dégressifs (prix unitaire et remise par palier).
- Dépendance `recharts` pour le rendu des graphiques.
- Styles CSS pour les onglets (`tab-bar`, `tab-item`) et les graphiques (`charts-section`, `chart-container`, `charts-pies`).
- Grille responsive 3 colonnes → 2 → 1 pour les donuts.
