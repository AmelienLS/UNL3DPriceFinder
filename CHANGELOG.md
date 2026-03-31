# Journal des modifications
## [1.13.3] - 2026-03-31
> Commit : `refactor(utils): extract formatting helpers to utils/formatting.ts`
### Modifié
- Création de `src/utils/formatting.ts` avec `fmt`, `euro`, `pct`, `closestTierQty`.
- `CalculatorPage.tsx` et `ChartsSection.tsx` importent désormais ces fonctions depuis le module partagé — plus de duplication.

## [1.13.2] - 2026-03-31
> Commit : `fix(storage): add try/catch to all localStorage save functions`
### Corrigé
- Les 4 fonctions `save*` de `models.ts` sont désormais protégées par un `try/catch` silencieux, évitant un crash en mode privé ou en cas de quota dépassé.

## [1.13.1] - 2026-03-31
> Commit : `fix(shortcuts): use e.code for digit keys to support AZERTY layout`
### Corrigé
- Les raccourcis `⌘1–4` utilisent désormais `e.code` (`Digit1`–`Digit4`) au lieu de `e.key`, ce qui les rend fonctionnels sur les claviers ISO français (AZERTY).

## [1.13.0] - 2026-03-31
> Commit : `feat(shortcuts): add keyboard navigation and quick save`
### Ajouté
- `⌘1` / `⌘2` / `⌘3` / `⌘4` : navigation directe entre Calculateur, Projets, Matériaux, Paramètres.
- `⌘S` : ouvre la modale de sauvegarde rapide depuis n'importe quelle page (bascule automatiquement sur le Calculateur).
- `⌘←` / `⌘→` : bascule entre les onglets Calcul et Graphiques dans le Calculateur.

## [1.12.0] - 2026-03-31
> Commit : `feat(projects): add sortable columns`
### Ajouté
- Toutes les colonnes du tableau Projets sont triables (clic sur l'en-tête, clic à nouveau pour inverser).
- Indicateur visuel ▲/▼ sur la colonne active, ⇅ discret sur les autres.
- Tri par défaut : Date décroissante (projets les plus récents en premier).
- Le tri Statut suit l'ordre logique : Brouillon → Devis envoyé → Accepté → Livré → Refusé.
- L'export CSV respecte l'ordre de tri courant.

## [1.11.0] - 2026-03-31
> Commit : `feat(projects): add project duplication`
### Ajouté
- Bouton "Dupliquer" sur chaque ligne du tableau des projets.
- La copie est insérée juste en dessous de l'original, avec un nouvel ID, la date du jour, le nom suffixé de " (copie)" et le statut "Brouillon".

## [1.10.0] - 2026-03-31
> Commit : `feat(projects): add project status with filter`
### Ajouté
- Type `ProjectStatus` avec 5 valeurs : Brouillon, Devis envoyé, Accepté, Refusé, Livré.
- Colonne "Statut" dans le tableau des projets, modifiable directement via un `<select>` inline coloré.
- Filtre par statut dans la toolbar de la page Projets.
- Nouveaux projets sauvegardés avec le statut "Brouillon" par défaut.
- Projets existants sans statut traités comme "Brouillon" (migration transparente).
- Export CSV inclut désormais la colonne Statut.

## [1.9.5] - 2026-03-31
> Commit : `feat(calculator): add editable profit margin field`
### Ajouté
- Champ de saisie du taux de marge directement dans la section "Prix de vente recommandé" du calculateur.
- La valeur est synchronisée avec les Paramètres (persistée en localStorage) et se répercute immédiatement sur le calcul.


## [1.9.4] - 2026-03-30
> Commit : `fix(configs): fixed an issue where the .exe would have the wrong version`
### Modifié
- réintroduction de la version dans tauri.conf.json afin d'avoir un .exe a la bonne version.

## [1.9.3] - 2026-03-30
> Commit : `feat(parameters): responsive multi-column layout`
### Modifié
- La page Paramètres s'affiche sur 2 colonnes à partir de 860 px et 3 colonnes à partir de 1200 px, avec largeurs identiques.
- Les sections "Couleurs des graphiques" et "Paliers dégressifs" s'étendent toujours sur toute la largeur.
- La carte "Couleurs des graphiques" organise ses lignes en 2 puis 4 colonnes selon la largeur.

## [1.9.2] - 2026-03-30
> Commit : `feat(parameters): add custom chart color pickers`
### Ajouté
- Section "Couleurs des graphiques" dans les Paramètres : 7 color pickers pour personnaliser chaque couleur (matière, électricité, main d'œuvre, taux d'échec, TVA coût, marge, TVA vente).
- Bouton "Réinitialiser les couleurs" pour revenir aux couleurs par défaut.
- Les couleurs choisies sont sauvegardées dans `chartColors` (déjà présent dans `Parameters`) et persistées en localStorage.

## [1.9.1] - 2026-03-30
> Commit : `refactor(charts): unify colors and slice names across price pies`
### Modifié
- Les graphiques "Prix recommandé" et "Prix personnalisé" utilisent désormais la même palette de couleurs et les mêmes noms de slices ("Marge" au lieu de "Bénéfice").
- Suppression des tableaux de couleurs séparés — un seul `PRICE_COLORS_BASE` partagé.

## [1.9.0] - 2026-03-30
> Commit : `feat(vat): add VAT-registered toggle for correct HT/TTC handling`
### Ajouté
- Paramètre "Assujetti à la TVA" (toggle) dans l'onglet Paramètres, section TVA.
- **Non-assujetti** (défaut) : TVA achats = coût réel, prix client = HT, pas de TVA facturée.
- **Assujetti** : TVA achats récupérée (pas un coût), TVA vente facturée au client, prix client = TTC.
- Les graphiques s'adaptent : une seule slice TVA cohérente selon le statut, plus de double-comptage.
- Les labels HT/TTC dans le calculateur s'adaptent dynamiquement selon le statut.
### Supprimé
- La distinction confuse "TVA achats / TVA vente" simultanée dans les graphiques.

## [1.8.3] - 2026-03-30
> Commit : `fix(footer): add fallback to package.json version when Tauri API unavailable`
### Corrigé
- La version dans le footer restait vide (`v`) car `getVersion()` de `@tauri-apps/api/app` échoue silencieusement hors contexte Tauri (dev browser). Ajout d'un fallback sur la version de `package.json` en cas d'erreur.

## [1.8.2] - 2026-03-30
> Commit : `fix(charts): correct TTC/TVA calculation in pie charts`
### Corrigé
- Graphique "Prix personnalisé" : la TVA affichée correspond maintenant à la TVA réelle du prix TTC saisi (= TTC × taux/(1+taux)), et non plus à la TVA sur les coûts d'achat.
- Graphique "Prix recommandé" : affiche maintenant le prix TTC (HT + TVA vente) avec une slice distincte pour la TVA sur vente (en rose).
- Les labels des graphiques passent de "Prix reco./perso." à "TTC reco./perso." pour indiquer clairement que ce sont des montants TTC.
- Nouvelle couleur (rose) pour la slice "TVA vente" afin de la distinguer de la "TVA achats" (violet).

## [1.8.1] - 2026-03-30
> Commit : `fix(ci): skip build jobs on non-release commits`
### Corrigé
- Les jobs `build-macos` et `build-windows` ne se déclenchent plus que sur les commits contenant un numéro de version (ex: `V1.8.1`). Évite de générer des artefacts avec une version incorrecte sur les commits ordinaires.

## [1.8.0] - 2026-03-30
> Commit : `feat(calculator): clarify HT/TTC pricing throughout`
### Modifié
- Section "Prix recommandé" : affichage explicite du prix HT, de la TVA sur vente et du prix TTC unitaire et total.
- Section "Tarification personnalisée" : l'entrée est "Prix TTC", avec décomposition en-dessous (TVA comprise + équivalent HT).
- Les bénéfices unitaire et total s'affichent en rouge quand négatifs.

## [1.7.1] - 2026-03-30
> Commit : `fix(version): sync version files and make footer version dynamic`
### Corrigé
- `package.json` mis à jour à 1.7.0 (était resté à 1.6.0), ce qui causait un DMG nommé avec l'ancienne version lors du build GitHub Actions.
- Suppression du champ `version` dans `tauri.conf.json` : Tauri v2 lit désormais la version directement depuis `package.json`, une seule source de vérité à maintenir.
- Le workflow GitHub Actions met à jour automatiquement `package.json` via `npm version --no-git-tag-version` en utilisant la version extraite du message de commit (ex: `V1.7.1`). Plus aucun fichier de version à mettre à jour manuellement.
- La version affichée en bas de chaque page est désormais lue dynamiquement via `getVersion()` de `@tauri-apps/api/app` au lieu d'être codée en dur.
- Correction de la génération de plusieurs artéfacts de versions différentes : le cache Rust conservait les anciens `.dmg` et `.exe`, que le glob `*` capturait tous. Les anciens artéfacts sont maintenant supprimés avant chaque build.

## [1.7.0] - 2026-03-30
> Commit : `feat(data): add JSON export and import in parameters page`
### Ajouté
- Export de toutes les données (matériaux, paramètres, projets) en fichier JSON horodaté depuis l'onglet Paramètres.
- Import d'une sauvegarde JSON : restaure matériaux, paramètres et projets en un clic.

## [1.6.4] - 2026-03-30
> Commit : `fix(ci): add contents:write permission for GitHub release creation`
### Corrigé
- Ajout de `permissions: contents: write` dans le workflow pour autoriser la création de releases GitHub (erreur "Resource not accessible by integration").

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
