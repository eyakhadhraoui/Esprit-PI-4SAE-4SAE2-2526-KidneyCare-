-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : dim. 03 mai 2026 à 14:12
-- Version du serveur : 8.4.7
-- Version de PHP : 8.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `nep`
--

-- --------------------------------------------------------

--
-- Structure de la table `alertes_nutrition`
--

DROP TABLE IF EXISTS `alertes_nutrition`;
CREATE TABLE IF NOT EXISTS `alertes_nutrition` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `aliment_id` bigint DEFAULT NULL,
  `date_alerte` datetime(6) NOT NULL,
  `details_techniques` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lue` bit(1) NOT NULL,
  `message` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `patient_id` bigint NOT NULL,
  `restriction_id` bigint DEFAULT NULL,
  `type` enum('AGE_INADEQUAT','ALIMENT_INTERDIT_CLIQUE','APPORT_EXCESSIF','AUTRE','BILAN_ANORMAL','INTERACTION_MEDICAMENT','RESTRICTION_ACTIVEE','RESTRICTION_LEVEE') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `alertes_nutrition`
--

INSERT INTO `alertes_nutrition` (`id`, `aliment_id`, `date_alerte`, `details_techniques`, `lue`, `message`, `patient_id`, `restriction_id`, `type`) VALUES
(1, 1, '2026-04-04 09:29:51.831000', NULL, b'1', '32KLJMLKRMTGKMLAERJGE', 1, 1, 'INTERACTION_MEDICAMENT'),
(2, 1, '2026-04-04 09:32:28.234000', NULL, b'1', 'HSHJSHJSH', 1, NULL, 'BILAN_ANORMAL');

-- --------------------------------------------------------

--
-- Structure de la table `alerte_labo`
--

DROP TABLE IF EXISTS `alerte_labo`;
CREATE TABLE IF NOT EXISTS `alerte_labo` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `acquittee_par` bigint DEFAULT NULL,
  `action_realisee` text COLLATE utf8mb4_unicode_ci,
  `date_acquittement` datetime(6) DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `resultat_id` bigint NOT NULL,
  `type_alerte` enum('AVERTISSEMENT','CRITIQUE','INFO','RAPPEL_TEST') COLLATE utf8mb4_unicode_ci NOT NULL,
  `prescription_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `alert_threshold`
--

DROP TABLE IF EXISTS `alert_threshold`;
CREATE TABLE IF NOT EXISTS `alert_threshold` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `acute_decline_level` tinyint DEFAULT NULL,
  `chronic_decline_level` tinyint DEFAULT NULL,
  `configured_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creatinine_absolute_max` double DEFAULT NULL,
  `creatinine_rise_percent` double DEFAULT NULL,
  `egfrcritical_min` double DEFAULT NULL,
  `egfrdrop_percent` double DEFAULT NULL,
  `patient_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tacrolimus_max` double DEFAULT NULL,
  `tacrolimus_min` double DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ;

--
-- Déchargement des données de la table `alert_threshold`
--

INSERT INTO `alert_threshold` (`id`, `acute_decline_level`, `chronic_decline_level`, `configured_by`, `creatinine_absolute_max`, `creatinine_rise_percent`, `egfrcritical_min`, `egfrdrop_percent`, `patient_id`, `tacrolimus_max`, `tacrolimus_min`, `updated_at`) VALUES
(1, 1, 0, 'ayouta', 3, 150, 20, 55, 'nour', 15, 5, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `aliments`
--

DROP TABLE IF EXISTS `aliments`;
CREATE TABLE IF NOT EXISTS `aliments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `age_minimum_mois` int DEFAULT NULL,
  `calories_kcal` int DEFAULT NULL,
  `categorie` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `interaction_cyclosporine` bit(1) NOT NULL,
  `interaction_tacrolimus` bit(1) NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phosphore_mg` int DEFAULT NULL,
  `potassium_mg` int DEFAULT NULL,
  `proteinesg` double DEFAULT NULL,
  `raison_restriction_age` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sodium_mg` int DEFAULT NULL,
  `sucreg` double DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `aliments`
--

INSERT INTO `aliments` (`id`, `age_minimum_mois`, `calories_kcal`, `categorie`, `interaction_cyclosporine`, `interaction_tacrolimus`, `nom`, `notes`, `phosphore_mg`, `potassium_mg`, `proteinesg`, `raison_restriction_age`, `sodium_mg`, `sucreg`) VALUES
(1, 4, 444, 'FRUIT', b'0', b'1', 'BANANA', 'LKTBJJBIFRDJGROPEA', 5, 3, 5, 'FGVR?LRTKJ?BRT', 3, 5),
(4, 4, 89, 'FRUIT', b'0', b'0', 'Banane', 'Riche en potassium', 22, 358, 1.1, NULL, 1, 12.2),
(5, 6, 52, 'FRUIT', b'0', b'0', 'Pomme', 'Peut être donnée en compote', 11, 107, 0.3, NULL, 1, 10.4),
(6, 6, 47, 'FRUIT', b'0', b'0', 'Poire', 'Facile à digérer', 12, 116, 0.4, NULL, 1, 10),
(7, 6, 32, 'FRUIT', b'0', b'1', 'Pastèque', 'Hydratante', 11, 112, 0.6, NULL, 1, 6.2),
(8, 8, 57, 'FRUIT', b'1', b'0', 'Orange', 'Attention interaction cyclosporine', 14, 181, 0.9, 'Interaction avec la cyclosporine', 0, 9),
(9, 8, 50, 'FRUIT', b'1', b'1', 'Pamplemousse', 'À éviter avec tacrolimus et cyclosporine', 16, 135, 0.8, 'Interaction médicamenteuse importante', 0, 8.5),
(10, 8, 34, 'FRUIT', b'0', b'0', 'Fraise', 'Riche en vitamine C', 24, 153, 0.7, NULL, 1, 4.9),
(11, 8, 61, 'FRUIT', b'0', b'0', 'Mangue', 'Bonne source de vitamine A', 14, 168, 0.8, NULL, 1, 13.7),
(12, 10, 43, 'FRUIT', b'0', b'0', 'Pêche', 'Fruit doux', 20, 190, 0.9, NULL, 0, 8.4),
(13, 10, 46, 'FRUIT', b'0', b'0', 'Abricot', 'Bon pour la croissance', 23, 259, 1.4, NULL, 1, 9.2),
(14, 6, 41, 'LEGUME', b'0', b'0', 'Carotte', 'Bonne pour la vitamine A', 35, 320, 0.9, NULL, 69, 4.7),
(15, 6, 34, 'LEGUME', b'0', b'0', 'Courgette', 'Très digeste', 38, 261, 1.2, NULL, 8, 2.5),
(16, 6, 25, 'LEGUME', b'0', b'0', 'Concombre', 'Très hydratant', 24, 147, 0.7, NULL, 2, 1.7),
(17, 6, 31, 'LEGUME', b'0', b'0', 'Haricots verts', 'Bonne source de fibres', 38, 209, 1.8, NULL, 6, 3.3),
(18, 8, 23, 'LEGUME', b'0', b'0', 'Tomate', 'À donner cuite au début', 24, 237, 1.1, NULL, 5, 2.6),
(19, 8, 86, 'LEGUME', b'0', b'0', 'Maïs', 'Énergétique', 89, 270, 3.4, NULL, 15, 6.3),
(20, 8, 35, 'LEGUME', b'0', b'0', 'Brocoli', 'Riche en calcium', 66, 316, 2.8, NULL, 33, 1.7),
(21, 10, 43, 'LEGUME', b'0', b'0', 'Petit pois', 'Bonne protéine végétale', 108, 244, 5.4, NULL, 5, 5.7),
(22, 10, 23, 'LEGUME', b'0', b'0', 'Aubergine', 'Faible en calories', 24, 229, 1, NULL, 2, 3.5),
(23, 10, 77, 'LEGUME', b'0', b'0', 'Patate douce', 'Très riche en vitamine A', 47, 337, 1.6, NULL, 55, 4.2),
(24, 6, 68, 'CEREALE', b'0', b'0', 'Riz cuit', 'Facile à digérer', 35, 26, 1.4, NULL, 1, 0.1),
(25, 6, 71, 'CEREALE', b'0', b'0', 'Pâtes cuites', 'Bonne source d’énergie', 24, 44, 2.5, NULL, 1, 0.6),
(26, 8, 247, 'CEREALE', b'0', b'0', 'Pain complet', 'Riche en fibres', 120, 230, 13, NULL, 490, 4),
(27, 8, 389, 'CEREALE', b'0', b'0', 'Avoine', 'Très nutritive', 410, 429, 16.9, NULL, 2, 0.9),
(28, 10, 130, 'CEREALE', b'0', b'0', 'Semoule', 'Bonne pour bébé', 15, 17, 3.6, NULL, 1, 0.1),
(29, 8, 61, 'PROTEINE', b'0', b'0', 'Poulet', 'Viande maigre', 180, 256, 27, NULL, 74, 0),
(30, 8, 143, 'PROTEINE', b'0', b'0', 'Œuf', 'Source importante de protéines', 198, 138, 13, NULL, 140, 1.1),
(31, 10, 208, 'PROTEINE', b'0', b'0', 'Saumon', 'Riche en oméga-3', 252, 363, 20, NULL, 59, 0),
(32, 10, 165, 'PROTEINE', b'0', b'0', 'Dinde', 'Viande légère', 210, 239, 29, NULL, 104, 0),
(33, 12, 239, 'PROTEINE', b'0', b'0', 'Bœuf maigre', 'Riche en fer', 180, 318, 26, NULL, 72, 0),
(34, 12, 42, 'LAITIER', b'0', b'0', 'Yaourt nature', 'Bon pour la flore intestinale', 135, 155, 3.5, NULL, 46, 4.7),
(35, 12, 61, 'LAITIER', b'0', b'0', 'Lait entier', 'À partir de 12 mois', 93, 150, 3.2, 'À éviter avant 12 mois', 44, 5),
(36, 12, 113, 'LAITIER', b'0', b'0', 'Fromage blanc', 'Riche en calcium', 120, 140, 7, NULL, 50, 3.5),
(37, 12, 884, 'MATIERE_GRASSE', b'0', b'0', 'Huile d’olive', 'Bonne graisse', 0, 1, 0, NULL, 0, 0),
(38, 12, 717, 'MATIERE_GRASSE', b'0', b'0', 'Beurre', 'À utiliser en petite quantité', 24, 24, 0.9, NULL, 643, 0.1),
(39, 18, 579, 'FRUIT_SEC', b'0', b'0', 'Amande', 'Risque d’étouffement avant 18 mois', 484, 705, 21, 'Ne pas donner avant 18 mois', 1, 4.4),
(40, 18, 654, 'FRUIT_SEC', b'0', b'0', 'Noix', 'À donner moulue', 346, 441, 15, 'Ne pas donner entière avant 18 mois', 2, 2.6),
(41, 18, 553, 'FRUIT_SEC', b'0', b'0', 'Noisette', 'À réduire en poudre', 290, 680, 15, 'Risque d’étouffement', 0, 4.3),
(42, 24, 160, 'DESSERT', b'0', b'0', 'Chocolat', 'À limiter', 206, 372, 2, 'Trop sucré avant 24 mois', 35, 18),
(43, 24, 387, 'DESSERT', b'0', b'0', 'Biscuit', 'Occasionnel seulement', 120, 120, 6, 'À éviter avant 24 mois', 250, 24),
(44, 24, 270, 'BOISSON', b'0', b'0', 'Jus de pomme', 'À limiter', 7, 101, 0.1, 'Pas avant 24 mois en grande quantité', 4, 10),
(45, 24, 42, 'BOISSON', b'0', b'0', 'Lait chocolaté', 'Très sucré', 95, 150, 3, 'À limiter avant 24 mois', 60, 8.5);

-- --------------------------------------------------------

--
-- Structure de la table `besoins_nutritionnels`
--

DROP TABLE IF EXISTS `besoins_nutritionnels`;
CREATE TABLE IF NOT EXISTS `besoins_nutritionnels` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `age_mois` int DEFAULT NULL,
  `calories_jour` int NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `patient_id` bigint NOT NULL,
  `phosphore_max_mg` int NOT NULL,
  `poids_kg` double DEFAULT NULL,
  `potassium_max_mg` int NOT NULL,
  `proteines_maxg` double NOT NULL,
  `raison_calcul` text COLLATE utf8mb4_unicode_ci,
  `sodium_max_mg` int NOT NULL,
  `sucre_maxg` double NOT NULL,
  `traitement_prednisone` bit(1) DEFAULT NULL,
  `traitement_tacrolimus` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `besoins_nutritionnels`
--

INSERT INTO `besoins_nutritionnels` (`id`, `age_mois`, `calories_jour`, `date_debut`, `date_fin`, `notes`, `patient_id`, `phosphore_max_mg`, `poids_kg`, `potassium_max_mg`, `proteines_maxg`, `raison_calcul`, `sodium_max_mg`, `sucre_maxg`, `traitement_prednisone`, `traitement_tacrolimus`) VALUES
(1, 12, 1600, '2026-04-04', NULL, '📊 DONNÉES ANTHROPOMÉTRIQUES:\n- Poids: 22 kg\n- Taille: 85 cm\n- Périmètre crânien: 48 cm\n- IMC: 30.4 (surpoids)\n\n💊 TRAITEMENT IMMUNOSUPPRESSEUR:\n- Tacrolimus: 2mg matin + 2mg soir (0.18mg/kg/jour)\n- Début traitement: 15/08/2024\n\n🔬 DERNIERS BILANS (18/02/2026):\n- Potassium: 5.2 mmol/L [Normal: 3.5-5.0] ⚠️ ÉLEVÉ\n- Sodium: 138 mmol/L [Normal: 135-145] ✓\n- Phosphore: 1.45 mmol/L [Normal: 1.0-1.8] ✓\n- Créatinine: 52 µmol/L [Normal: 27-62] ✓\n- Urée: 4.2 mmol/L [Normal: 2.5-6.4] ✓\n- Tacrolimus sanguin: 8.5 ng/mL [Cible: 5-15] ✓\n- Hémoglobine: 115 g/L [Normal: 110-140] ✓\n- Leucocytes: 6.2 x10⁹/L [Normal: 5-15] ✓\n\n⚠️ RESTRICTIONS ACTIVES:\n- HYPERKALIÉMIE: Éviter banane, fruits secs, épinards\n- TACROLIMUS: Pamplemousse INTERDIT\n\n📅 SURVEILLANCE:\n- Bilan sanguin: Chaque semaine\n- Pesée: 2x/semaine\n- Contrôle tension: Quotidien', 1, 400, 20, 800, 30, 'Calculé automatiquement — Poids: 20kg, Âge: 1 ans | Bilan: K=? mmol/L, DFG=? mL/min, Phos=? mmol/L', 600, 40, b'0', b'0'),
(2, 9, 800, '2026-04-04', NULL, '📊 DONNÉES ANTHROPOMÉTRIQUES:\n- Poids: 9 kg\n- Taille: 72 cm\n- Périmètre crânien: 45 cm\n- IMC: 17.4 (normal)\n\n💊 TRAITEMENT:\n- Aucun immunosuppresseur\n- Supplémentation vitamine D: 400 UI/jour\n- Fer: 2mg/kg/jour\n\n🔬 DERNIERS BILANS (18/02/2026):\n- Potassium: 4.5 mmol/L [Normal: 3.5-5.0] ✓\n- Sodium: 140 mmol/L [Normal: 135-145] ✓\n- Phosphore: 1.6 mmol/L [Normal: 1.0-1.8] ✓\n- Créatinine: 35 µmol/L [Normal: 18-35] ✓ Limite haute\n- Urée: 3.8 mmol/L [Normal: 1.8-6.4] ✓\n- Hémoglobine: 105 g/L [Normal: 95-130] ✓\n- Fer sérique: 8 µmol/L [Normal: 7-18] ✓\n\n⚠️ RESTRICTIONS ACTIVES:\n- ÂGE: Raisins secs interdits (< 12 mois)\n- ÂGE: Fruits à coques interdits (< 12 mois)\n- Surveillance créatinine (limite haute)\n\n📅 SURVEILLANCE:\n- Bilan sanguin: Chaque mois\n- Pesée: 1x/semaine\n- Croissance: Courbe OMS normale', 2, 500, 9, 1000, 20, 'Calculé selon âge (9 mois) et poids (9kg) - Pas de traitement immunosuppresseur', 800, 25, b'0', b'0'),
(3, 144, 1800, '2026-04-04', NULL, '📊 DONNÉES ANTHROPOMÉTRIQUES:\n- Poids: 38 kg\n- Taille: 148 cm\n- Périmètre crânien: 54 cm\n- IMC: 17.3 (normal)\n\n💊 TRAITEMENT IMMUNOSUPPRESSEUR TRIPLE:\n- Tacrolimus: 3mg matin + 3mg soir (0.16mg/kg/jour)\n- Prednisone: 5mg/jour (0.13mg/kg/jour)\n- Mycophenolate: 500mg 2x/jour\n- Début traitement: 14/02/2024\n\n🔬 DERNIERS BILANS (18/02/2026):\n- Potassium: 4.8 mmol/L [Normal: 3.5-5.0] ✓\n- Sodium: 142 mmol/L [Normal: 135-145] ✓\n- Phosphore: 1.3 mmol/L [Normal: 1.0-1.8] ✓\n- Créatinine: 58 µmol/L [Normal: 44-88] ✓\n- Urée: 5.1 mmol/L [Normal: 2.5-6.4] ✓\n- Tacrolimus sanguin: 12.3 ng/mL [Cible: 5-15] ✓\n- Glycémie: 6.8 mmol/L [Normal: 3.9-5.6] ⚠️ ÉLEVÉ (Prednisone)\n- HbA1c: 5.9% [Normal: <5.7%] ⚠️ Prédiabète\n- Hémoglobine: 125 g/L [Normal: 115-155] ✓\n- Leucocytes: 8.5 x10⁹/L [Normal: 4.5-13.5] ✓\n- GFR: 85 mL/min/1.73m² [Normal: >90] ⚠️ Légère baisse\n\n⚠️ RESTRICTIONS ACTIVES:\n- DIABÈTE CORTICOÏDE: Limiter sucres rapides\n- TACROLIMUS: Pamplemousse INTERDIT\n- PREDNISONE: Surveillance glycémie renforcée\n\n📅 SURVEILLANCE:\n- Bilan sanguin: 2x/semaine\n- Glycémie capillaire: Quotidienne\n- Pesée: 1x/semaine\n- Contrôle tension: Quotidien\n- Dosage Tacrolimus: Hebdomadaire', 3, 1200, 38, 2500, 55, 'Calculé selon poids (38kg) + âge (12 ans) + Tacrolimus + Prednisone actifs', 1500, 45, b'1', b'1'),
(4, 11, 3520, '2026-04-15', '2026-04-23', NULL, 8, 880, 44, 1760, 66, 'Calculé automatiquement — Poids: 44kg, Âge: 11 mois | Bilan: K=? mmol/L, DFG=? mL/min, Phos=? mmol/L', 1320, 88, b'0', b'0'),
(5, 11, 3520, '2026-04-15', NULL, NULL, 8, 880, 44, 1760, 66, 'Calculé automatiquement — Poids: 44kg, Âge: 11 mois | Bilan: K=? mmol/L, DFG=? mL/min, Phos=? mmol/L', 1320, 88, b'0', b'0');

-- --------------------------------------------------------

--
-- Structure de la table `constante_vitale`
--

DROP TABLE IF EXISTS `constante_vitale`;
CREATE TABLE IF NOT EXISTS `constante_vitale` (
  `id_constante_vitale` int NOT NULL AUTO_INCREMENT,
  `nom_parametre` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `poids_max` float DEFAULT NULL,
  `poids_min` float DEFAULT NULL,
  `taille_max` float DEFAULT NULL,
  `taille_min` float DEFAULT NULL,
  `unite` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valeur_max_normale` float DEFAULT NULL,
  `valeur_min_normale` float DEFAULT NULL,
  `indicateur_vital_id_indicateur_vital` int DEFAULT NULL,
  PRIMARY KEY (`id_constante_vitale`),
  KEY `FKs3mia8ys8g3uc8ugvkmrxn2gc` (`indicateur_vital_id_indicateur_vital`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `constante_vitale`
--

INSERT INTO `constante_vitale` (`id_constante_vitale`, `nom_parametre`, `poids_max`, `poids_min`, `taille_max`, `taille_min`, `unite`, `valeur_max_normale`, `valeur_min_normale`, `indicateur_vital_id_indicateur_vital`) VALUES
(3, 'JJJJJJJJJJ', 98.9, 9, 98, 56, 'mmol/L', 8, 6, 6),
(4, 'JJJJ', 78.8, 66, 99, 77, 'mmol/L', 8, 6, 6),
(5, 'fg', 55, 44, 54, 44, 'mL/min/1.73m²', 4.98, 4, 8),
(7, 'fréquence cardiaque', 10, 5, NULL, NULL, 'mmol/L', 15, 10, 6);

-- --------------------------------------------------------

--
-- Structure de la table `consultation`
--

DROP TABLE IF EXISTS `consultation`;
CREATE TABLE IF NOT EXISTS `consultation` (
  `id_consultation` int NOT NULL AUTO_INCREMENT,
  `date_consultation` datetime(6) DEFAULT NULL,
  `diagnostic` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_dossiermedical` int DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `medecin_id_medecin` bigint DEFAULT NULL,
  `patient_id_patient` bigint DEFAULT NULL,
  `rendezvous_id_rendezvous` int DEFAULT NULL,
  PRIMARY KEY (`id_consultation`),
  UNIQUE KEY `UKbjjmeek4nwy1hrnr6m5w1na12` (`rendezvous_id_rendezvous`),
  KEY `FKft7nfrf9cw433dljyfeiymne3` (`medecin_id_medecin`),
  KEY `FKopm3qrmj8r9i23t4rrj0fc715` (`patient_id_patient`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `consultation`
--

INSERT INTO `consultation` (`id_consultation`, `date_consultation`, `diagnostic`, `id_dossiermedical`, `notes`, `medecin_id_medecin`, `patient_id_patient`, `rendezvous_id_rendezvous`) VALUES
(1, '2026-04-04 01:00:00.000000', 'gbfdvsqQSDFGHNJ?K.LM§K.J?NBHV', 3, 'rrrrrrrrrrrrrrrrrrrrrrrrrrrrr', 1, 2, 1);

-- --------------------------------------------------------

--
-- Structure de la table `daily_report`
--

DROP TABLE IF EXISTS `daily_report`;
CREATE TABLE IF NOT EXISTS `daily_report` (
  `id_report` bigint NOT NULL AUTO_INCREMENT,
  `date` datetime(6) DEFAULT NULL,
  `observation` longtext COLLATE utf8mb4_unicode_ci,
  `hospitalization_id_hospitalization` bigint DEFAULT NULL,
  PRIMARY KEY (`id_report`),
  KEY `FKa0h6qm5hpt763ftyv8c6xki89` (`hospitalization_id_hospitalization`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `doctor_alert`
--

DROP TABLE IF EXISTS `doctor_alert`;
CREATE TABLE IF NOT EXISTS `doctor_alert` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `alert_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_immunosuppressor` bit(1) DEFAULT NULL,
  `is_read` bit(1) DEFAULT NULL,
  `medication_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `missed_days_count` int DEFAULT NULL,
  `patient_id` bigint DEFAULT NULL,
  `prescription_item_id` bigint DEFAULT NULL,
  `severity` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `triggered_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `doctor_alert`
--

INSERT INTO `doctor_alert` (`id`, `alert_type`, `is_immunosuppressor`, `is_read`, `medication_name`, `message`, `missed_days_count`, `patient_id`, `prescription_item_id`, `severity`, `triggered_at`) VALUES
(1, 'CONSECUTIVE', b'0', b'0', 'GTGTTGTGTG', '⚠️ GTGTTGTGTG non pris à 08:00 — 30 jour(s) consécutif(s) manqués', 30, 1, 1, 'WARNING', '2026-04-08 22:22:10.045898'),
(2, 'CONSECUTIVE', b'0', b'0', 'GTGTTGTGTG', '⚠️ GTGTTGTGTG non pris à 08:00 — 30 jour(s) consécutif(s) manqués', 30, 1, 1, 'WARNING', '2026-04-15 22:13:28.075259'),
(3, 'CONSECUTIVE', b'0', b'0', 'GTGTTGTGTG', '⚠️ GTGTTGTGTG non pris à 08:00 — 30 jour(s) consécutif(s) manqués', 30, 1, 1, 'WARNING', '2026-04-16 22:51:08.591209'),
(4, 'CONSECUTIVE', b'0', b'0', 'PARACYTAMOLE', '⚠️ PARACYTAMOLE non pris à 08:00 — 30 jour(s) consécutif(s) manqués', 30, 8, 4, 'WARNING', '2026-04-16 22:51:08.880837');

-- --------------------------------------------------------

--
-- Structure de la table `dosage_adjustment`
--

DROP TABLE IF EXISTS `dosage_adjustment`;
CREATE TABLE IF NOT EXISTS `dosage_adjustment` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `current_dose` double DEFAULT NULL,
  `patient_id` bigint DEFAULT NULL,
  `previous_weight` double DEFAULT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewed_at` datetime(6) DEFAULT NULL,
  `reviewed_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `suggested_dose` double DEFAULT NULL,
  `weight_used` double DEFAULT NULL,
  `prescription_item_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKnpq1rg4w1w41dmb2yhghuiif` (`prescription_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `dossier_medical`
--

DROP TABLE IF EXISTS `dossier_medical`;
CREATE TABLE IF NOT EXISTS `dossier_medical` (
  `id_dossier_medical` bigint NOT NULL AUTO_INCREMENT,
  `date_creation` date NOT NULL,
  `diagnostic` enum('ACIDOSE_TUBULAIRE_RENALE','AUTRE','CYSTITE','DIABETE_INSIPIDE_NEPHROGINIQUE','DYSPLASIE_RENALE','ENURESIE_PRIMAIRE','ENURESIE_SECONDAIRE','GLOMERULONEPHRITE_AIGUE','GLOMERULONEPHRITE_CHRONIQUE','HEMATURIE_MACROSCOPIQUE','HEMATURIE_MICROSCOPIQUE','HYDRONEPHROSE','HYPERTENSION_ARTERIELLE','HYPERTENSION_RENOVASCULAIRE','HYPOPLASIE_RENALE','INFECTION_URINAIRE','INSUFFISANCE_RENALE_AIGUE','INSUFFISANCE_RENALE_CHRONIQUE','LITHIASE_RENALE','LUPUS_NEPHRITE','MALADIE_DE_BERGER','MALADIE_RENALE_CHRONIQUE_STADE_1','MALADIE_RENALE_CHRONIQUE_STADE_2','MALADIE_RENALE_CHRONIQUE_STADE_3','MALADIE_RENALE_CHRONIQUE_STADE_4','MALADIE_RENALE_CHRONIQUE_STADE_5','NEPHROCALCINOSE','POLYKYSTOSE_RENALE','POST_TRANSPLANTATION_RENALE','PROTEINURIE_ISOLEE','PROTEINURIE_ORTHOSTATIQUE','PURPURA_RHUMATOIDE','PYELONEPHRITE','REFLUX_VESICO_URETERAL','REIN_UNIQUE','REJET_DE_GREFFE','SYNDROME_ALPORT','SYNDROME_DE_BARTTER','SYNDROME_DE_FANCONI','SYNDROME_DE_GITELMAN','SYNDROME_HEMOLYTIQUE_UREMIQUE','SYNDROME_NEPHROTIQUE','SYNDROME_NEPHROTIQUE_CONGENITAL','SYNDROME_NEPHROTIQUE_CORTICORESISTANT','SYNDROME_NEPHROTIQUE_CORTICOSENSIBLE','TUBULOPATHIE_PROXIMALE','UROPATHIE_OBSTRUCTIVE','VESSIE_NEUROLOGIQUE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_medecin` bigint NOT NULL,
  `id_patient` bigint NOT NULL,
  `imc` decimal(5,2) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `poids` decimal(5,2) DEFAULT NULL,
  `taille` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`id_dossier_medical`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `dossier_medical`
--

INSERT INTO `dossier_medical` (`id_dossier_medical`, `date_creation`, `diagnostic`, `id_medecin`, `id_patient`, `imc`, `notes`, `poids`, `taille`) VALUES
(1, '2026-04-02', 'INSUFFISANCE_RENALE_CHRONIQUE', 1, 1, NULL, 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', NULL, NULL),
(2, '2026-04-04', 'INSUFFISANCE_RENALE_CHRONIQUE', 1, 2, NULL, 'vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv', NULL, NULL),
(4, '2026-04-14', 'INSUFFISANCE_RENALE_CHRONIQUE', 1, 8, NULL, 'C\'est tres urgent', NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `graft_function_entry`
--

DROP TABLE IF EXISTS `graft_function_entry`;
CREATE TABLE IF NOT EXISTS `graft_function_entry` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `collection_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `creatinine` double DEFAULT NULL,
  `diastolicbp` double DEFAULT NULL,
  `egfr` double DEFAULT NULL,
  `measurement_date` date DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patient_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `systolicbp` double DEFAULT NULL,
  `tacrolimus_level` double DEFAULT NULL,
  `temperature` double DEFAULT NULL,
  `urine_output` double DEFAULT NULL,
  `weight` double DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `graft_function_entry`
--

INSERT INTO `graft_function_entry` (`id`, `collection_type`, `created_at`, `creatinine`, `diastolicbp`, `egfr`, `measurement_date`, `notes`, `patient_id`, `systolicbp`, `tacrolimus_level`, `temperature`, `urine_output`, `weight`) VALUES
(1, 'ROUTINE', NULL, 5, 30, 5, '2026-04-01', 'TTTTTTTTTT', 'nour', 79, 6, 30, 555, 30),
(2, 'ROUTINE', NULL, 0.1, 30, 6, '2026-04-01', '333333333', 'eya.khadhraouiHH@esprit.tn', 66, 6, 30, 66, 39),
(3, 'ROUTINE', NULL, 5, 44, 55, '2026-04-01', '555555555555', 'nour', 77, 5, 40, 55555, 66),
(4, 'ROUTINE', NULL, 5, 100, 20, '2026-04-14', '', 'nour', 200, 3, 39, 1200, 39);

-- --------------------------------------------------------

--
-- Structure de la table `graft_survival_score`
--

DROP TABLE IF EXISTS `graft_survival_score`;
CREATE TABLE IF NOT EXISTS `graft_survival_score` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `calculated_at` datetime(6) DEFAULT NULL,
  `calculation_model` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creatinine_slope` double DEFAULT NULL,
  `egfrslope` double DEFAULT NULL,
  `has_acute_decline` bit(1) DEFAULT NULL,
  `has_chronic_decline` bit(1) DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patient_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rejection_episode_count` int DEFAULT NULL,
  `risk_level` tinyint DEFAULT NULL,
  `survival_probability1year` double DEFAULT NULL,
  `survival_probability3year` double DEFAULT NULL,
  `survival_probability5year` double DEFAULT NULL,
  `tacrolimus_variability` double DEFAULT NULL,
  PRIMARY KEY (`id`)
) ;

--
-- Déchargement des données de la table `graft_survival_score`
--

INSERT INTO `graft_survival_score` (`id`, `calculated_at`, `calculation_model`, `creatinine_slope`, `egfrslope`, `has_acute_decline`, `has_chronic_decline`, `notes`, `patient_id`, `rejection_episode_count`, `risk_level`, `survival_probability1year`, `survival_probability3year`, `survival_probability5year`, `tacrolimus_variability`) VALUES
(1, NULL, 'AUTO_EGFR_SLOPE', 11, 5, b'1', b'1', 'Auto-computed from 2 eGFR readings. eGFR slope: 50.00 mL/min/measurement.', 'nour', 2, 0, 1, 1, 1, 99),
(2, NULL, 'AUTO_EGFR_SLOPE', NULL, 5, b'0', b'0', 'Auto-computed from 3 eGFR readings. eGFR slope: 7.50 mL/min/measurement.', 'nour', 0, 0, 1, 0.63, 0.03, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `hospitalization`
--

DROP TABLE IF EXISTS `hospitalization`;
CREATE TABLE IF NOT EXISTS `hospitalization` (
  `id_hospitalization` bigint NOT NULL AUTO_INCREMENT,
  `admission_date` datetime(6) DEFAULT NULL,
  `discharge_date` datetime(6) DEFAULT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `room` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` tinyint DEFAULT NULL,
  PRIMARY KEY (`id_hospitalization`)
) ;

-- --------------------------------------------------------

--
-- Structure de la table `image_medicale`
--

DROP TABLE IF EXISTS `image_medicale`;
CREATE TABLE IF NOT EXISTS `image_medicale` (
  `id_image` bigint NOT NULL AUTO_INCREMENT,
  `chemin_image` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_capture` date NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `type_image` enum('ASP','AUTRE','CYSTOGRAPHIE_ISOTOPIQUE','CYSTOGRAPHIE_RETRO_MICTIONNELLE','DENSITOMETRIE_OSSEUSE','ECHOGRAPHIE_ABDOMINALE','ECHOGRAPHIE_DOPPLER_RENAL','ECHOGRAPHIE_PELVIENNE','ECHOGRAPHIE_RENALE','ECHOGRAPHIE_VESICALE','IRM_ABDOMINALE','IRM_AVEC_GADOLINIUM','IRM_PELVIENNE','IRM_RENALE','PHOTO_CLINIQUE','RADIOGRAPHIE_ABDOMINALE','RADIOGRAPHIE_THORACIQUE','RAPPORT_RADIOLOGIQUE','SCANNER_ABDOMINAL','SCANNER_AVEC_INJECTION','SCANNER_RENAL','SCANNER_SANS_INJECTION','SCINTIGRAPHIE_RENALE_DYNAMIQUE','SCINTIGRAPHIE_RENALE_STATIQUE','UIV','URO_IRM','URO_SCANNER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_dossier_medical` bigint NOT NULL,
  PRIMARY KEY (`id_image`),
  KEY `FKc2duo4hv54wgx13ftqj4p318b` (`id_dossier_medical`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `indicateur_vital`
--

DROP TABLE IF EXISTS `indicateur_vital`;
CREATE TABLE IF NOT EXISTS `indicateur_vital` (
  `id_indicateur_vital` int NOT NULL AUTO_INCREMENT,
  `actif` bit(1) DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nom_indicateur` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unite` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_indicateur_vital`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `indicateur_vital`
--

INSERT INTO `indicateur_vital` (`id_indicateur_vital`, `actif`, `description`, `nom_indicateur`, `unite`) VALUES
(6, b'1', '', 'KKKKKKKKKK', 'mmol/L'),
(7, b'1', '', 'NNNNNNNN', 'mg/24h'),
(8, b'1', '', 'hr', 'mL/min/1.73m²'),
(9, b'1', '', 'yyyyyyyyyyy', 'mL/min/1.73m²'),
(10, b'1', '', 'Fréquence cardiaque', 'µmol/L'),
(11, b'1', '', 'Fréauence cardiaque', 'mL/min/1.73m²');

-- --------------------------------------------------------

--
-- Structure de la table `infections`
--

DROP TABLE IF EXISTS `infections`;
CREATE TABLE IF NOT EXISTS `infections` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `detection_date` datetime(6) DEFAULT NULL,
  `patient_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `severity` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `medecin`
--

DROP TABLE IF EXISTS `medecin`;
CREATE TABLE IF NOT EXISTS `medecin` (
  `id_medecin` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nom` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_medecin`),
  UNIQUE KEY `UKnyrt47ahw0g81lg41pfpyof2` (`username`),
  UNIQUE KEY `IDXnyrt47ahw0g81lg41pfpyof2` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `medecin`
--

INSERT INTO `medecin` (`id_medecin`, `email`, `nom`, `prenom`, `username`) VALUES
(1, NULL, 'ayouta', '', 'ayouta');

-- --------------------------------------------------------

--
-- Structure de la table `medication`
--

DROP TABLE IF EXISTS `medication`;
CREATE TABLE IF NOT EXISTS `medication` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active_ingredient` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contraindications` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dosage` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `form` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_immunosuppressor` bit(1) DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requires_monitoring` bit(1) DEFAULT NULL,
  `unit` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `medication`
--

INSERT INTO `medication` (`id`, `active_ingredient`, `category`, `contraindications`, `dosage`, `form`, `is_immunosuppressor`, `name`, `requires_monitoring`, `unit`) VALUES
(1, 'GTYH', 'antipyrétique', '', '22', 'comprimé', b'0', 'GTGTTGTGTG', b'1', 'mg'),
(2, 'ffffff', 'anti-inflammatoire', '', '22', 'comprimé', b'0', 'ff', b'1', 'g'),
(3, 'ffffff', 'antipyrétique', '', '22', 'comprimé', b'0', 'HYHY', b'1', 'mg'),
(5, 'JGVJVGGgg', 'antipyrétique', '', '22', 'gélule', b'0', 'PARACYTAMOLE', b'1', 'g');

-- --------------------------------------------------------

--
-- Structure de la table `medication_history`
--

DROP TABLE IF EXISTS `medication_history`;
CREATE TABLE IF NOT EXISTS `medication_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `actual_dosage` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `administered_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patient_id` bigint DEFAULT NULL,
  `side_effects` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `taken_at` datetime(6) DEFAULT NULL,
  `temperature` double DEFAULT NULL,
  `vital_signs` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prescription_item_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKnm25hs28gc5gslk4uvdyk7ww8` (`prescription_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `medication_schedule`
--

DROP TABLE IF EXISTS `medication_schedule`;
CREATE TABLE IF NOT EXISTS `medication_schedule` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `scheduled_time` time(6) DEFAULT NULL,
  `prescription_item_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK3mu455wiw43jod0jmyvjpwq43` (`prescription_item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `medication_schedule`
--

INSERT INTO `medication_schedule` (`id`, `scheduled_time`, `prescription_item_id`) VALUES
(1, '08:00:00.000000', 1),
(6, '08:00:00.000000', 4);

-- --------------------------------------------------------

--
-- Structure de la table `message`
--

DROP TABLE IF EXISTS `message`;
CREATE TABLE IF NOT EXISTS `message` (
  `id_message` bigint NOT NULL AUTO_INCREMENT,
  `contenu` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_envoi` datetime(6) NOT NULL,
  `lu` bit(1) NOT NULL,
  `type_expediteur` enum('MEDECIN','PATIENT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_dossier_medical` bigint NOT NULL,
  PRIMARY KEY (`id_message`),
  KEY `FKjyavay9rc2derngq2bvsjcj1v` (`id_dossier_medical`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `message`
--

INSERT INTO `message` (`id_message`, `contenu`, `date_envoi`, `lu`, `type_expediteur`, `id_dossier_medical`) VALUES
(1, 'SALUT DOCTEUR', '2026-04-27 09:54:55.421390', b'0', 'PATIENT', 4),
(2, 'HI', '2026-04-27 09:56:52.397121', b'0', 'MEDECIN', 4),
(3, 'HU', '2026-05-03 14:52:40.128720', b'0', 'PATIENT', 4);

-- --------------------------------------------------------

--
-- Structure de la table `norme_pediatrique_labo`
--

DROP TABLE IF EXISTS `norme_pediatrique_labo`;
CREATE TABLE IF NOT EXISTS `norme_pediatrique_labo` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `age_max_mois` int NOT NULL,
  `age_min_mois` int NOT NULL,
  `code_loinc` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `poids_min_kg` decimal(6,2) DEFAULT NULL,
  `seuil_critique_bas` decimal(12,4) DEFAULT NULL,
  `seuil_critique_haut` decimal(12,4) DEFAULT NULL,
  `sexe` enum('F','M','TOUS') COLLATE utf8mb4_unicode_ci NOT NULL,
  `source_reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valeur_max_normale` decimal(12,4) DEFAULT NULL,
  `valeur_min_normale` decimal(12,4) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_norme_loinc_age_sexe` (`code_loinc`,`age_min_mois`,`age_max_mois`,`sexe`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `norme_pediatrique_labo`
--

INSERT INTO `norme_pediatrique_labo` (`id`, `age_max_mois`, `age_min_mois`, `code_loinc`, `poids_min_kg`, `seuil_critique_bas`, `seuil_critique_haut`, `sexe`, `source_reference`, `valeur_max_normale`, `valeur_min_normale`) VALUES
(1, 6, 0, '2160-0', NULL, 10.0000, 80.0000, 'TOUS', 'SFN', 35.0000, 15.0000),
(2, 12, 6, '2160-0', NULL, 12.0000, 90.0000, 'TOUS', 'SFN', 40.0000, 20.0000),
(3, 24, 12, '2160-0', NULL, 15.0000, 100.0000, 'TOUS', 'SFN', 45.0000, 25.0000),
(4, 60, 24, '2160-0', NULL, 18.0000, 120.0000, 'TOUS', 'SFN', 55.0000, 30.0000),
(5, 120, 60, '2160-0', NULL, 25.0000, 150.0000, 'TOUS', 'SFN', 70.0000, 40.0000),
(6, 216, 120, '2160-0', NULL, 30.0000, 180.0000, 'M', 'SFN', 90.0000, 50.0000),
(7, 216, 120, '2160-0', NULL, 28.0000, 160.0000, 'F', 'SFN', 80.0000, 45.0000),
(8, 6, 0, '3094-0', NULL, 1.0000, 15.0000, 'TOUS', 'SFN', 6.0000, 1.5000),
(9, 24, 6, '3094-0', NULL, 1.2000, 16.0000, 'TOUS', 'SFN', 6.5000, 2.0000),
(10, 120, 24, '3094-0', NULL, 1.5000, 18.0000, 'TOUS', 'SFN', 7.0000, 2.5000),
(11, 216, 120, '3094-0', NULL, 2.0000, 20.0000, 'TOUS', 'SFN', 7.5000, 3.0000),
(12, 216, 0, '2823-3', NULL, 2.5000, 6.5000, 'TOUS', 'SFN', 5.5000, 3.5000),
(13, 216, 0, '2951-2', NULL, 125.0000, 155.0000, 'TOUS', 'SFN', 145.0000, 135.0000),
(14, 216, 0, '2888-6', NULL, NULL, 3.0000, 'TOUS', 'SFN', 0.2000, 0.0000),
(15, 216, 0, '1963-8', NULL, 15.0000, 35.0000, 'TOUS', 'SFN', 28.0000, 22.0000),
(16, 24, 0, '33914-3', NULL, 30.0000, NULL, 'TOUS', 'KDIGO Pediatric', 120.0000, 40.0000),
(17, 120, 24, '33914-3', NULL, 30.0000, NULL, 'TOUS', 'KDIGO Pediatric', 120.0000, 80.0000),
(18, 216, 120, '33914-3', NULL, 30.0000, NULL, 'TOUS', 'KDIGO Pediatric', 120.0000, 90.0000),
(19, 6, 0, '718-7', NULL, 70.0000, 180.0000, 'TOUS', 'SFN', 140.0000, 95.0000),
(20, 24, 6, '718-7', NULL, 75.0000, 160.0000, 'TOUS', 'SFN', 135.0000, 105.0000),
(21, 120, 24, '718-7', NULL, 80.0000, 160.0000, 'TOUS', 'SFN', 140.0000, 115.0000),
(22, 216, 120, '718-7', NULL, 90.0000, 180.0000, 'M', 'SFN', 170.0000, 130.0000),
(23, 216, 120, '718-7', NULL, 90.0000, 170.0000, 'F', 'SFN', 155.0000, 120.0000);

-- --------------------------------------------------------

--
-- Structure de la table `note_interne`
--

DROP TABLE IF EXISTS `note_interne`;
CREATE TABLE IF NOT EXISTS `note_interne` (
  `id_note_interne` bigint NOT NULL AUTO_INCREMENT,
  `contenu` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `id_dossier_medical` bigint NOT NULL,
  PRIMARY KEY (`id_note_interne`),
  KEY `FKayjijwy42n1syyypyge6rbtcq` (`id_dossier_medical`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `notification_medecin`
--

DROP TABLE IF EXISTS `notification_medecin`;
CREATE TABLE IF NOT EXISTS `notification_medecin` (
  `id_notification_medecin` bigint NOT NULL AUTO_INCREMENT,
  `date_creation` datetime(6) NOT NULL,
  `id_dossier_medical` bigint NOT NULL,
  `id_medecin` bigint NOT NULL,
  `id_patient` bigint DEFAULT NULL,
  `id_resultat_laboratoire` bigint DEFAULT NULL,
  `lu` bit(1) NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `patient_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `titre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('ALERTE_LABO','MEDICAMENT_NON_PRIS','NOUVEAU_TEST_LABO','RAPPEL_TEST_NON_FAIT') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_notification_medecin`),
  KEY `idx_notif_medecin_medecin_lu` (`id_medecin`,`lu`),
  KEY `idx_notif_medecin_date` (`date_creation`)
) ENGINE=InnoDB AUTO_INCREMENT=113 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `notification_medecin`
--

INSERT INTO `notification_medecin` (`id_notification_medecin`, `date_creation`, `id_dossier_medical`, `id_medecin`, `id_patient`, `id_resultat_laboratoire`, `lu`, `message`, `patient_name`, `titre`, `type`) VALUES
(3, '2026-04-02 09:44:24.047554', 1, 1, NULL, 3, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « DFG estimé (Schwartz) » (date: 2026-04-02).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(4, '2026-04-03 09:17:26.207069', 1, 1, NULL, 4, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « Créatininémie » (date: 2026-04-03).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(5, '2026-04-03 13:37:33.847299', 1, 1, NULL, 6, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « Chloremie » (date: 2026-04-03).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(6, '2026-04-03 13:37:33.838413', 1, 1, NULL, 5, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « Natrémie » (date: 2026-04-03).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(7, '2026-04-03 13:37:33.847299', 1, 1, NULL, 9, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « Bicarbonates » (date: 2026-04-03).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(8, '2026-04-03 13:37:33.849876', 1, 1, NULL, 8, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « Calcémie » (date: 2026-04-03).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(9, '2026-04-03 13:37:33.849302', 1, 1, NULL, 7, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « Kaliémie » (date: 2026-04-03).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(10, '2026-04-03 13:37:33.898517', 1, 1, NULL, 10, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « Phosphorémie » (date: 2026-04-03).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(11, '2026-04-03 13:37:33.970213', 1, 1, NULL, 11, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « Calcémie corrigée » (date: 2026-04-03).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(12, '2026-04-03 13:37:33.984176', 1, 1, NULL, 12, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « Magnésémie » (date: 2026-04-03).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(13, '2026-04-05 20:15:50.787215', 1, 1, NULL, 13, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « Kaliémie » (date: 2026-04-05).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(14, '2026-04-05 20:15:50.787215', 1, 1, NULL, 14, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « Créatininémie » (date: 2026-04-05).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(15, '2026-04-05 20:37:18.721298', 1, 1, NULL, 15, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « DFG cystatine C » (date: 2026-04-05T20:37:18).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(16, '2026-04-05 20:37:18.725168', 1, 1, NULL, 16, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « Cystatine C » (date: 2026-04-05T20:37:18).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(18, '2026-04-05 21:10:54.555747', 2, 1, NULL, 18, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « DFG cystatine C » (date: 2026-04-05T21:10:54).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(19, '2026-04-05 21:10:54.572126', 2, 1, NULL, 21, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « DFG estimé (Schwartz) » (date: 2026-04-05T21:10:54).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(20, '2026-04-05 21:10:54.555747', 2, 1, NULL, 17, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « Acide urique » (date: 2026-04-05T21:10:54).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(21, '2026-04-05 21:10:54.567084', 2, 1, NULL, 19, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « Créatininémie » (date: 2026-04-05T21:10:54).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(22, '2026-04-05 21:10:54.565485', 2, 1, NULL, 20, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « Urée » (date: 2026-04-05T21:10:54).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(23, '2026-04-05 21:10:54.616826', 2, 1, NULL, 22, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « Cystatine C » (date: 2026-04-05T21:10:54).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(24, '2026-04-05 21:10:54.660251', 2, 1, NULL, 8, b'0', 'DFG critique : 5.0 mL/min/1.73m² — insuffisance rénale sévère', 'brahimbr brahimbr', 'Alerte labo critique', 'ALERTE_LABO'),
(25, '2026-04-05 21:12:58.970996', 2, 1, NULL, 23, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « Natrémie » (date: 2026-04-05T21:12:58).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(26, '2026-04-05 21:12:58.996604', 2, 1, NULL, 24, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « Kaliémie » (date: 2026-04-05T21:12:58).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(27, '2026-04-05 21:12:59.000721', 2, 1, NULL, 25, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « Chloremie » (date: 2026-04-05T21:12:58).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(28, '2026-04-05 21:12:59.014414', 2, 1, NULL, 9, b'0', 'Hyponatrémie critique : 44.0 mmol/L', 'brahimbr brahimbr', 'Alerte labo critique', 'ALERTE_LABO'),
(29, '2026-04-05 21:12:59.016418', 2, 1, NULL, 10, b'0', 'Kaliémie critique : 44.0 mmol/L — risque arythmie', 'brahimbr brahimbr', 'Alerte labo critique', 'ALERTE_LABO'),
(30, '2026-04-05 21:12:59.449158', 2, 1, NULL, 26, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « Bicarbonates » (date: 2026-04-05T21:12:58).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(31, '2026-04-05 21:12:59.462977', 2, 1, NULL, 27, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « Phosphorémie » (date: 2026-04-05T21:12:58).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(32, '2026-04-05 21:12:59.529270', 2, 1, NULL, 28, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « Calcémie » (date: 2026-04-05T21:12:58).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(33, '2026-04-05 21:12:59.599054', 2, 1, NULL, 29, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « Calcémie corrigée » (date: 2026-04-05T21:12:58).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(34, '2026-04-05 21:12:59.671520', 2, 1, NULL, 30, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « Magnésémie » (date: 2026-04-05T21:12:58).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(35, '2026-04-07 11:02:36.663037', 1, 1, NULL, 31, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « Acide urique » (date: 2026-04-07T11:02:36).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(36, '2026-04-07 11:20:10.615022', 2, 1, NULL, 32, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « NFS » (date: 2026-04-07T11:20:10).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(37, '2026-04-07 11:46:59.864410', 2, 1, NULL, 35, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « Acide urique » (date: 2026-04-07T11:46:59).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(38, '2026-04-07 11:46:59.864410', 2, 1, NULL, 33, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « DFG cystatine C » (date: 2026-04-07T11:46:59).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(39, '2026-04-07 11:46:59.864410', 2, 1, NULL, 36, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « Cystatine C » (date: 2026-04-07T11:46:59).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(40, '2026-04-07 11:46:59.864410', 2, 1, NULL, 34, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « Créatininémie » (date: 2026-04-07T11:46:59).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(41, '2026-04-07 11:46:59.886371', 2, 1, NULL, 37, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « DFG estimé (Schwartz) » (date: 2026-04-07T11:46:59).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(42, '2026-04-07 11:46:59.986187', 2, 1, NULL, 38, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « Urée » (date: 2026-04-07T11:46:59).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(43, '2026-04-07 11:47:00.105400', 2, 1, NULL, 41, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « Chloremie » (date: 2026-04-07T11:46:59).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(44, '2026-04-07 11:47:00.105400', 2, 1, NULL, 40, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « Kaliémie » (date: 2026-04-07T11:46:59).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(45, '2026-04-07 11:47:00.122975', 2, 1, NULL, 42, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « Bicarbonates » (date: 2026-04-07T11:46:59).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(46, '2026-04-07 11:47:00.129963', 2, 1, NULL, 43, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « Phosphorémie » (date: 2026-04-07T11:46:59).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(47, '2026-04-07 11:47:00.091290', 2, 1, NULL, 39, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « Natrémie » (date: 2026-04-07T11:46:59).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(48, '2026-04-07 11:47:00.161598', 2, 1, NULL, 44, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « Calcémie » (date: 2026-04-07T11:46:59).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(49, '2026-04-07 11:47:00.189250', 2, 1, NULL, 45, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « Calcémie corrigée » (date: 2026-04-07T11:46:59).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(50, '2026-04-07 11:47:00.195782', 2, 1, NULL, 46, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « Magnésémie » (date: 2026-04-07T11:46:59).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(51, '2026-04-07 11:47:00.196794', 2, 1, NULL, 47, b'0', 'Le patient brahimbr brahimbr a ajouté un résultat pour le test « NFS » (date: 2026-04-07T11:46:59).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(52, '2026-04-07 21:58:50.344798', 1, 1, NULL, 48, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « NFS » (date: 2026-04-07T21:58:50).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(53, '2026-04-08 14:17:01.516617', 1, 1, NULL, 53, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « Acide urique » (date: 2026-04-08T14:17:01).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(54, '2026-04-08 14:17:01.507631', 1, 1, NULL, 51, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « DFG cystatine C » (date: 2026-04-08T14:17:01).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(55, '2026-04-08 14:17:01.507631', 1, 1, NULL, 52, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « Urée » (date: 2026-04-08T14:17:01).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(56, '2026-04-08 14:17:01.507631', 1, 1, NULL, 50, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « Cystatine C » (date: 2026-04-08T14:17:01).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(57, '2026-04-08 14:17:01.507631', 1, 1, NULL, 49, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « Créatininémie » (date: 2026-04-08T14:17:01).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(58, '2026-04-08 14:17:01.735666', 1, 1, NULL, 54, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « DFG estimé (Schwartz) » (date: 2026-04-08T14:17:01).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(59, '2026-04-08 14:17:04.356926', 1, 1, NULL, 55, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « Kaliémie » (date: 2026-04-08T14:17:01).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(60, '2026-04-08 14:17:04.385381', 1, 1, NULL, 57, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « Bicarbonates » (date: 2026-04-08T14:17:01).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(61, '2026-04-08 14:17:04.375662', 1, 1, NULL, 56, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « Calcémie » (date: 2026-04-08T14:17:01).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(62, '2026-04-08 14:17:04.484327', 1, 1, NULL, 60, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « Chloremie » (date: 2026-04-08T14:17:01).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(63, '2026-04-08 14:17:04.432680', 1, 1, NULL, 59, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « Phosphorémie » (date: 2026-04-08T14:17:01).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(64, '2026-04-08 14:17:04.517866', 1, 1, NULL, 58, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « Natrémie » (date: 2026-04-08T14:17:01).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(65, '2026-04-08 14:17:05.586129', 1, 1, NULL, 61, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « Calcémie corrigée » (date: 2026-04-08T14:17:01).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(66, '2026-04-08 14:17:05.736845', 1, 1, NULL, 62, b'0', 'Le patient EyaHHH KhadhraouiHHH a ajouté un résultat pour le test « Magnésémie » (date: 2026-04-08T14:17:01).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(67, '2026-04-14 21:40:55.493662', 4, 1, NULL, 67, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Urée » (date: 2026-04-14T21:40:55).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(68, '2026-04-14 21:40:55.483634', 4, 1, NULL, 65, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Cystatine C » (date: 2026-04-14T21:40:55).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(69, '2026-04-14 21:40:55.493662', 4, 1, NULL, 68, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Créatininémie » (date: 2026-04-14T21:40:55).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(70, '2026-04-14 21:40:55.483634', 4, 1, NULL, 64, b'0', 'Le patient nour nour a ajouté un résultat pour le test « DFG estimé (Schwartz) » (date: 2026-04-14T21:40:55).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(71, '2026-04-14 21:40:55.483634', 4, 1, NULL, 66, b'0', 'Le patient nour nour a ajouté un résultat pour le test « DFG cystatine C » (date: 2026-04-14T21:40:55).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(72, '2026-04-14 21:40:55.493662', 4, 1, NULL, 63, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Acide urique » (date: 2026-04-14T21:40:55).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(73, '2026-04-15 11:40:18.219663', 4, 1, NULL, 72, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Cystatine C » (date: 2026-04-15T11:40:18).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(74, '2026-04-15 11:40:18.219663', 4, 1, NULL, 70, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Créatininémie » (date: 2026-04-15T11:40:18).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(75, '2026-04-15 11:40:18.219663', 4, 1, NULL, 69, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Urée » (date: 2026-04-15T11:40:18).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(76, '2026-04-15 11:40:18.219663', 4, 1, NULL, 73, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Acide urique » (date: 2026-04-15T11:40:18).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(77, '2026-04-15 11:40:18.219663', 4, 1, NULL, 71, b'0', 'Le patient nour nour a ajouté un résultat pour le test « DFG estimé (Schwartz) » (date: 2026-04-15T11:40:18).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(78, '2026-04-15 11:40:18.248546', 4, 1, NULL, 74, b'0', 'Le patient nour nour a ajouté un résultat pour le test « DFG cystatine C » (date: 2026-04-15T11:40:18).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(79, '2026-04-15 11:40:18.983515', 4, 1, NULL, 75, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Kaliémie » (date: 2026-04-15T11:40:18).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(80, '2026-04-15 11:40:18.997047', 4, 1, NULL, 76, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Natrémie » (date: 2026-04-15T11:40:18).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(81, '2026-04-15 11:40:19.002916', 4, 1, NULL, 77, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Chloremie » (date: 2026-04-15T11:40:18).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(82, '2026-04-15 11:40:19.008934', 4, 1, NULL, 78, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Bicarbonates » (date: 2026-04-15T11:40:18).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(83, '2026-04-15 11:40:19.020812', 4, 1, NULL, 79, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Calcémie » (date: 2026-04-15T11:40:18).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(84, '2026-04-15 11:40:19.030388', 4, 1, NULL, 80, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Phosphorémie » (date: 2026-04-15T11:40:18).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(85, '2026-04-15 11:40:19.338079', 4, 1, NULL, 81, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Calcémie corrigée » (date: 2026-04-15T11:40:18).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(86, '2026-04-15 11:40:19.363730', 4, 1, NULL, 82, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Magnésémie » (date: 2026-04-15T11:40:18).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(87, '2026-04-15 11:49:28.447435', 4, 1, NULL, 83, b'0', 'Le patient nour nour a ajouté un résultat pour le test « NFS » (date: 2026-04-15T11:49:28).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(88, '2026-04-15 11:55:35.500739', 4, 1, NULL, 84, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Protéinurie » (date: 2026-04-15T11:55:35).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(89, '2026-04-15 22:11:10.386063', 4, 1, NULL, 88, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Acide urique » (date: 2026-04-15T22:11:09).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(90, '2026-04-15 22:11:10.374462', 4, 1, NULL, 87, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Urée » (date: 2026-04-15T22:11:09).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(91, '2026-04-15 22:11:10.379069', 4, 1, NULL, 85, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Cystatine C » (date: 2026-04-15T22:11:09).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(92, '2026-04-15 22:11:10.374462', 4, 1, NULL, 86, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Créatininémie » (date: 2026-04-15T22:11:09).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(93, '2026-04-15 22:11:10.397691', 4, 1, NULL, 89, b'0', 'Le patient nour nour a ajouté un résultat pour le test « DFG estimé (Schwartz) » (date: 2026-04-15T22:11:09).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(94, '2026-04-15 22:11:10.668981', 4, 1, NULL, 90, b'0', 'Le patient nour nour a ajouté un résultat pour le test « DFG cystatine C » (date: 2026-04-15T22:11:09).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(95, '2026-04-16 02:15:36.228809', 4, 1, NULL, 94, b'0', 'Le patient nour nour a ajouté un résultat pour le test « DFG cystatine C » (date: 2026-04-16T02:15:35).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(96, '2026-04-16 02:15:36.224827', 4, 1, NULL, 92, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Cystatine C » (date: 2026-04-16T02:15:35).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(97, '2026-04-16 02:15:36.225856', 4, 1, NULL, 96, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Créatininémie » (date: 2026-04-16T02:15:35).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(98, '2026-04-16 02:15:36.228809', 4, 1, NULL, 95, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Urée » (date: 2026-04-16T02:15:35).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(99, '2026-04-16 02:15:36.224827', 4, 1, NULL, 93, b'0', 'Le patient nour nour a ajouté un résultat pour le test « DFG estimé (Schwartz) » (date: 2026-04-16T02:15:35).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(100, '2026-04-16 02:15:36.225856', 4, 1, NULL, 91, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Acide urique » (date: 2026-04-16T02:15:35).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(101, '2026-04-16 10:11:26.489561', 4, 1, NULL, 97, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Protéinurie » (date: 2026-04-16T10:11:25).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(102, '2026-04-16 10:45:09.391562', 4, 1, NULL, 98, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Créatininémie » (date: 2026-04-16T10:45:09).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(103, '2026-04-27 09:55:28.545831', 4, 1, NULL, 101, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Bicarbonates » (date: 2026-04-27T09:55:28).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(104, '2026-04-27 09:55:28.550790', 4, 1, NULL, 103, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Chloremie » (date: 2026-04-27T09:55:28).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(105, '2026-04-27 09:55:28.545831', 4, 1, NULL, 102, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Kaliémie » (date: 2026-04-27T09:55:28).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(106, '2026-04-27 09:55:28.549030', 4, 1, NULL, 99, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Phosphorémie » (date: 2026-04-27T09:55:28).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(107, '2026-04-27 09:55:28.547910', 4, 1, NULL, 100, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Natrémie » (date: 2026-04-27T09:55:28).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(108, '2026-04-27 09:55:28.651214', 4, 1, NULL, 104, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Calcémie » (date: 2026-04-27T09:55:28).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(109, '2026-04-27 09:55:29.285896', 4, 1, NULL, 102, b'0', 'Kaliémie critique : 44.0 mmol/L — risque arythmie', 'nour nour', 'Alerte labo critique', 'ALERTE_LABO'),
(110, '2026-04-27 09:55:31.488975', 4, 1, NULL, 105, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Calcémie corrigée » (date: 2026-04-27T09:55:28).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(111, '2026-04-27 09:55:31.502730', 4, 1, NULL, 106, b'0', 'Le patient nour nour a ajouté un résultat pour le test « Magnésémie » (date: 2026-04-27T09:55:28).', NULL, 'Nouveau résultat de test laboratoire', 'NOUVEAU_TEST_LABO'),
(112, '2026-04-28 09:23:11.818349', 4, 1, 8, 32, b'0', 'Rappel : nour nour n’a pas encore réalisé tous les tests prescrits (7 manquant(s)).', 'nour nour', 'Rappel : tests non réalisés', 'RAPPEL_TEST_NON_FAIT');

-- --------------------------------------------------------

--
-- Structure de la table `parametre_vital`
--

DROP TABLE IF EXISTS `parametre_vital`;
CREATE TABLE IF NOT EXISTS `parametre_vital` (
  `id_parametre_vital` int NOT NULL AUTO_INCREMENT,
  `age` int DEFAULT NULL,
  `etat` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_resultat_laboratoire` int DEFAULT NULL,
  `imc` float DEFAULT NULL,
  `nom_parametre` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `poids` float DEFAULT NULL,
  `reference_max` float DEFAULT NULL,
  `reference_min` float DEFAULT NULL,
  `taille` float DEFAULT NULL,
  `unite` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valeur_mesuree` float DEFAULT NULL,
  `constante_vitale_id_constante_vitale` int DEFAULT NULL,
  PRIMARY KEY (`id_parametre_vital`),
  KEY `FK77pr94xku3ibcdfpmtjjq65i5` (`constante_vitale_id_constante_vitale`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `parametre_vital`
--

INSERT INTO `parametre_vital` (`id_parametre_vital`, `age`, `etat`, `id_resultat_laboratoire`, `imc`, `nom_parametre`, `poids`, `reference_max`, `reference_min`, `taille`, `unite`, `valeur_mesuree`, `constante_vitale_id_constante_vitale`) VALUES
(1, NULL, NULL, NULL, NULL, 'HELLO', NULL, 8, 6, NULL, 'µmol/L', NULL, NULL),
(2, 8, 'ELEVE', NULL, 145.95, 'JJJJJJJJJJ', 5, 8, 6, 120, 'mmol/L', 55, 3),
(3, 8, 'BAS', NULL, 556, 'JJJJJJJJJJ', 8, 8, 6, 88, 'mmol/L', 88, 3),
(4, 8, 'BAS', NULL, 88, 'température', 7, 38, 36, 87, 'C', 77, NULL),
(5, NULL, 'NORMAL', NULL, NULL, 'fréquence cardiaque', NULL, 15, 10, NULL, 'mmol/L', 17, 7);

-- --------------------------------------------------------

--
-- Structure de la table `patient`
--

DROP TABLE IF EXISTS `patient`;
CREATE TABLE IF NOT EXISTS `patient` (
  `id_patient` bigint NOT NULL AUTO_INCREMENT,
  `date_creation` datetime(6) NOT NULL,
  `date_naissance` date DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telephone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_patient`),
  UNIQUE KEY `UKavbwwnxo3348e62y2reiv3fko` (`username`),
  UNIQUE KEY `IDXavbwwnxo3348e62y2reiv3fko` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `patient`
--

INSERT INTO `patient` (`id_patient`, `date_creation`, `date_naissance`, `email`, `first_name`, `last_name`, `telephone`, `username`) VALUES
(1, '2026-04-02 09:01:59.252229', NULL, 'eya.khadhraouiHH@esprit.tn', 'EyaHHH', 'KhadhraouiHHH', NULL, 'eya.khadhraouiHH@esprit.tn'),
(2, '2026-04-02 09:17:21.940559', NULL, 'brahimbr@gmail.com', 'brahimbr', 'brahimbr', NULL, 'brahimbr'),
(3, '2026-04-03 22:39:07.050391', '1990-01-01', 'testpatient505@example.com', 'T', 'P', NULL, 'testpatient505'),
(4, '2026-04-03 22:47:32.441908', '1991-02-02', 'testcurl506@example.com', 'A', 'B', NULL, 'testcurl506'),
(5, '2026-04-03 23:35:36.091710', '1990-01-15', 'test@test.com', 'Jean', 'Dupont', NULL, 'test'),
(6, '2026-04-03 23:39:47.422851', '1999-04-07', 'test@teTst.com', 'JeanT', 'DupontT', NULL, 'testT'),
(7, '2026-04-14 20:26:04.796396', NULL, 'eya.khadhraoui@esprit.tn', 'Eya', 'Khadhraoui', NULL, 'eya.khadhraoui@esprit.tn'),
(8, '2026-04-14 20:44:21.106189', NULL, 'eyakhadhraoui221@gmail.com', 'nour', 'nour', NULL, 'nour');

-- --------------------------------------------------------

--
-- Structure de la table `patient_weight`
--

DROP TABLE IF EXISTS `patient_weight`;
CREATE TABLE IF NOT EXISTS `patient_weight` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `measured_at` datetime(6) DEFAULT NULL,
  `patient_id` bigint DEFAULT NULL,
  `weight_kg` double DEFAULT NULL,
  `height_cm` double DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `prescription`
--

DROP TABLE IF EXISTS `prescription`;
CREATE TABLE IF NOT EXISTS `prescription` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patient_id` bigint NOT NULL,
  `prescription_date` date NOT NULL,
  `date_debut` date DEFAULT NULL,
  `date_fin` date DEFAULT NULL,
  `statut` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `prescription`
--

INSERT INTO `prescription` (`id`, `notes`, `patient_id`, `prescription_date`, `date_debut`, `date_fin`, `statut`) VALUES
(1, 'K', 1, '2026-04-04', NULL, NULL, NULL),
(2, '', 8, '2026-04-16', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `prescription_bilan`
--

DROP TABLE IF EXISTS `prescription_bilan`;
CREATE TABLE IF NOT EXISTS `prescription_bilan` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date_prescription` datetime(6) NOT NULL,
  `dossier_id` bigint NOT NULL,
  `labo_id` bigint DEFAULT NULL,
  `medecin_id` bigint NOT NULL,
  `note_clinique` text COLLATE utf8mb4_unicode_ci,
  `statut` enum('ANNULE','COMPLET','EN_ATTENTE','PARTIEL') COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_bilan` enum('AUTRE','BICARBONATES','CREATININE','DFG','DMSA','HEMOGLOBINE','IONOGRAMME','KALIEMIE','NATREMIE','NFS','PROTEINURIE','RENAL_COMPLET','UREE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `urgence` bit(1) NOT NULL,
  `dernier_rappel_test_envoye` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `prescription_bilan`
--

INSERT INTO `prescription_bilan` (`id`, `date_prescription`, `dossier_id`, `labo_id`, `medecin_id`, `note_clinique`, `statut`, `type_bilan`, `urgence`, `dernier_rappel_test_envoye`) VALUES
(30, '2026-04-16 09:10:09.000000', 4, 1, 1, 'ttttttttttttttttttttttttttttttt | Preferred date: 2026-04-16 | Urgency: NORMAL | Fasting: No | Collection mode: VEINEUX', 'COMPLET', 'PROTEINURIE', b'0', NULL),
(31, '2026-04-16 09:43:59.000000', 4, 1, 1, 'c\'est tres urgent | Preferred date: 2026-04-16 | Urgency: NORMAL | Fasting: No | Collection mode: VEINEUX', 'COMPLET', 'CREATININE', b'0', NULL),
(32, '2026-04-16 09:46:05.000000', 4, 1, 1, 'c\'est tres urgent | Preferred date: 2026-04-16 | Urgency: NORMAL | Fasting: No | Collection mode: VEINEUX', 'PARTIEL', 'IONOGRAMME', b'0', '2026-04-28 09:22:48.664806'),
(33, '2026-05-03 13:54:10.000000', 4, 1, 1, 'Preferred date: 2026-05-03 | Urgency: NORMAL | Fasting: No | Collection mode: VEINEUX', 'EN_ATTENTE', 'IONOGRAMME', b'0', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `prescription_bilan_examens`
--

DROP TABLE IF EXISTS `prescription_bilan_examens`;
CREATE TABLE IF NOT EXISTS `prescription_bilan_examens` (
  `prescription_id` bigint NOT NULL,
  `code_loinc` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  KEY `FK3r9qd90li2l1qeryhfwj06b1i` (`prescription_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `prescription_bilan_examens`
--

INSERT INTO `prescription_bilan_examens` (`prescription_id`, `code_loinc`) VALUES
(30, '2888-6'),
(31, '2160-0'),
(32, '2951-2'),
(32, '2823-3'),
(32, '2075-0'),
(32, '1963-8'),
(32, '2777-1'),
(32, '2000-8'),
(32, '2601-3'),
(33, '2951-2'),
(33, '2823-3'),
(33, '2075-0'),
(33, '1963-8'),
(33, '2777-1'),
(33, '2000-8'),
(33, '2601-3');

-- --------------------------------------------------------

--
-- Structure de la table `prescription_item`
--

DROP TABLE IF EXISTS `prescription_item`;
CREATE TABLE IF NOT EXISTS `prescription_item` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `administration_route` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dosage_instructions` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration` int DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `frequency` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_immunosuppressor` bit(1) DEFAULT NULL,
  `is_priority` bit(1) DEFAULT NULL,
  `special_instructions` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `medication_id` bigint DEFAULT NULL,
  `prescription_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKct6o91onjk12s6dvh8ajhvmso` (`medication_id`),
  KEY `FKeykn9e2g6nbmvwhqbrdm3jb2p` (`prescription_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `prescription_item`
--

INSERT INTO `prescription_item` (`id`, `administration_route`, `dosage_instructions`, `duration`, `end_date`, `frequency`, `is_immunosuppressor`, `is_priority`, `special_instructions`, `start_date`, `medication_id`, `prescription_id`) VALUES
(1, 'orale', 'matin', 30, '2026-05-04', '1x/jour', b'0', b'1', NULL, '2026-04-04', 1, 1),
(4, 'intramusculaire', '4.5 mg 2x/jour', 30, '2026-05-16', '1x/jour', b'0', b'1', NULL, '2026-04-16', 5, 2);

-- --------------------------------------------------------

--
-- Structure de la table `rapport`
--

DROP TABLE IF EXISTS `rapport`;
CREATE TABLE IF NOT EXISTS `rapport` (
  `id_rapport` int NOT NULL AUTO_INCREMENT,
  `contenu` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_rapport` datetime(6) DEFAULT NULL,
  `id_medecin` bigint DEFAULT NULL,
  `recommendations` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `consultation_id_consultation` int DEFAULT NULL,
  PRIMARY KEY (`id_rapport`),
  KEY `FKixmyonkrjodrme79rier1vob2` (`consultation_id_consultation`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `rapport`
--

INSERT INTO `rapport` (`id_rapport`, `contenu`, `date_rapport`, `id_medecin`, `recommendations`, `consultation_id_consultation`) VALUES
(1, 'JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ', '2026-04-04 01:00:00.000000', NULL, 'GGGGGGGGGGGGGGGGGGGGGGGGG', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `rapport_bi`
--

DROP TABLE IF EXISTS `rapport_bi`;
CREATE TABLE IF NOT EXISTS `rapport_bi` (
  `id_rapport_bilan` bigint NOT NULL AUTO_INCREMENT,
  `chemin_pdf` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `conclusion` text COLLATE utf8mb4_unicode_ci,
  `contenu` text COLLATE utf8mb4_unicode_ci,
  `date_rapport` date NOT NULL,
  `date_signature` datetime(6) DEFAULT NULL,
  `nom_medecin` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `partage_patient` bit(1) NOT NULL,
  `recommandations` text COLLATE utf8mb4_unicode_ci,
  `signature_base64` longtext COLLATE utf8mb4_unicode_ci,
  `id_dossier_medical` bigint NOT NULL,
  `id_resultat_laboratoire` bigint DEFAULT NULL,
  PRIMARY KEY (`id_rapport_bilan`),
  KEY `FKeru13c3xabofe59ll441nj0j9` (`id_dossier_medical`),
  KEY `FK76o6fqej1tulnpihqkp0pu711` (`id_resultat_laboratoire`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `rapport_bilan`
--

DROP TABLE IF EXISTS `rapport_bilan`;
CREATE TABLE IF NOT EXISTS `rapport_bilan` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `commentaire_medecin` text COLLATE utf8mb4_unicode_ci,
  `date_generation` datetime(6) NOT NULL,
  `dossier_id` bigint NOT NULL,
  `genere_par` bigint NOT NULL,
  `partage_famille` bit(1) NOT NULL,
  `pdf_url` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `periode_debut` date NOT NULL,
  `periode_fin` date NOT NULL,
  `prescription_id` bigint DEFAULT NULL,
  `signature_data_url` longtext COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `rapport_bilan`
--

INSERT INTO `rapport_bilan` (`id`, `commentaire_medecin`, `date_generation`, `dossier_id`, `genere_par`, `partage_famille`, `pdf_url`, `periode_debut`, `periode_fin`, `prescription_id`, `signature_data_url`) VALUES
(1, 'CDVFGBHJ?KIJUHYTGRFDSZA', '2026-04-14 23:33:17.203321', 4, 1, b'0', NULL, '2026-04-14', '2026-04-14', NULL, NULL),
(2, 'CX FVBGJHIKUHYGRTFDSZ', '2026-04-14 23:35:28.277723', 4, 1, b'1', NULL, '2026-04-14', '2026-04-14', 21, 'data:image/png;base64,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'),
(3, '.?NBJKJNLLKLJKHJHKJLK', '2026-04-14 23:41:03.914067', 4, 1, b'0', NULL, '2026-04-14', '2026-04-14', 21, 'data:image/png;base64,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');
INSERT INTO `rapport_bilan` (`id`, `commentaire_medecin`, `date_generation`, `dossier_id`, `genere_par`, `partage_famille`, `pdf_url`, `periode_debut`, `periode_fin`, `prescription_id`, `signature_data_url`) VALUES
(4, 'KOIUYGUIHILJK', '2026-04-14 23:41:58.254392', 4, 1, b'0', NULL, '2026-04-14', '2026-04-14', 21, 'data:image/png;base64,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'),
(5, 'KJNHGFDEFRGTYHUJIKOL', '2026-04-14 23:58:15.606189', 4, 1, b'0', NULL, '2026-04-14', '2026-04-14', 21, 'data:image/png;base64,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'),
(6, '?LKJHGVHJNKLKNJBVHBN?', '2026-04-15 12:00:10.491404', 4, 1, b'0', NULL, '2026-04-15', '2026-04-15', 25, 'data:image/png;base64,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');
INSERT INTO `rapport_bilan` (`id`, `commentaire_medecin`, `date_generation`, `dossier_id`, `genere_par`, `partage_famille`, `pdf_url`, `periode_debut`, `periode_fin`, `prescription_id`, `signature_data_url`) VALUES
(7, 'c\'est validee apres je crer', '2026-04-15 22:12:28.563735', 4, 1, b'1', NULL, '2026-04-15', '2026-04-15', 27, 'data:image/png;base64,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'),
(8, 'uigjljefkrkjoehzzqpksgbrjfsdmkqfhrjdk', '2026-04-16 04:49:20.040293', 4, 1, b'0', NULL, '2026-04-16', '2026-04-16', 29, 'data:image/png;base64,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');
INSERT INTO `rapport_bilan` (`id`, `commentaire_medecin`, `date_generation`, `dossier_id`, `genere_par`, `partage_famille`, `pdf_url`, `periode_debut`, `periode_fin`, `prescription_id`, `signature_data_url`) VALUES
(9, 'C\'est tres urgent', '2026-04-16 10:42:19.617959', 4, 1, b'0', NULL, '2026-04-16', '2026-04-16', 30, 'data:image/png;base64,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'),
(10, 'JJJJ', '2026-04-27 09:57:15.276210', 4, 1, b'0', NULL, '2026-04-16', '2026-04-27', 32, 'data:image/png;base64,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');

-- --------------------------------------------------------

--
-- Structure de la table `rapport_bilan_resultats`
--

DROP TABLE IF EXISTS `rapport_bilan_resultats`;
CREATE TABLE IF NOT EXISTS `rapport_bilan_resultats` (
  `rapport_id` bigint NOT NULL,
  `resultat_id` bigint DEFAULT NULL,
  KEY `FKa0hd5va15wj4qdlnefw6m8ndo` (`rapport_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `rapport_bi_resultats`
--

DROP TABLE IF EXISTS `rapport_bi_resultats`;
CREATE TABLE IF NOT EXISTS `rapport_bi_resultats` (
  `id_rapport_bi` bigint NOT NULL,
  `id_resultat_laboratoire` bigint NOT NULL,
  KEY `FK896e6ahu3wi1vl90otprb7apx` (`id_resultat_laboratoire`),
  KEY `FKb79wmkayj86ioujrtm7mw8n8c` (`id_rapport_bi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `reference_value`
--

DROP TABLE IF EXISTS `reference_value`;
CREATE TABLE IF NOT EXISTS `reference_value` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `baseline_creatinine` double DEFAULT NULL,
  `baselineegfr` double DEFAULT NULL,
  `established_date` date DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patient_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `set_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_diastolicbp` double DEFAULT NULL,
  `target_systolicbp` double DEFAULT NULL,
  `target_tacrolimus_max` double DEFAULT NULL,
  `target_tacrolimus_min` double DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `reference_value`
--

INSERT INTO `reference_value` (`id`, `baseline_creatinine`, `baselineegfr`, `established_date`, `notes`, `patient_id`, `set_by`, `target_diastolicbp`, `target_systolicbp`, `target_tacrolimus_max`, `target_tacrolimus_min`) VALUES
(1, 1, 11, '2026-04-09', '11111111111111', 'nour', '', 111, 111, 11, 1);

-- --------------------------------------------------------

--
-- Structure de la table `rendezvous`
--

DROP TABLE IF EXISTS `rendezvous`;
CREATE TABLE IF NOT EXISTS `rendezvous` (
  `id_rendezvous` int NOT NULL AUTO_INCREMENT,
  `date_rendezvous` datetime(6) DEFAULT NULL,
  `etat` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `consultation_id_consultation` int DEFAULT NULL,
  `patient_id_patient` bigint DEFAULT NULL,
  PRIMARY KEY (`id_rendezvous`),
  UNIQUE KEY `UKb1qm4yv4o7gktmh3il7inay23` (`consultation_id_consultation`),
  KEY `FKrun15b47i4ilndu6g3ru85baw` (`patient_id_patient`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `rendezvous`
--

INSERT INTO `rendezvous` (`id_rendezvous`, `date_rendezvous`, `etat`, `consultation_id_consultation`, `patient_id_patient`) VALUES
(1, '2026-04-04 17:43:00.000000', 'CONFIRME', NULL, 1);

-- --------------------------------------------------------

--
-- Structure de la table `restrictions_alimentaires`
--

DROP TABLE IF EXISTS `restrictions_alimentaires`;
CREATE TABLE IF NOT EXISTS `restrictions_alimentaires` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `aliment_id` bigint NOT NULL,
  `cree_automatiquement` bit(1) NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date DEFAULT NULL,
  `notes` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patient_id` bigint NOT NULL,
  `raison` enum('AGE_INADEQUAT','ALLERGIE','AUTRE','CYCLOSPORINE','DIABETE_CORTICOIDE','HYPERKALIEMIE','HYPERNATREMIE','HYPERPHOSPHOREMIE','TACROLIMUS') COLLATE utf8mb4_unicode_ci NOT NULL,
  `valeur_bilan_declencheur` double DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `restrictions_alimentaires`
--

INSERT INTO `restrictions_alimentaires` (`id`, `aliment_id`, `cree_automatiquement`, `date_debut`, `date_fin`, `notes`, `patient_id`, `raison`, `valeur_bilan_declencheur`) VALUES
(2, 1, b'0', '2026-04-04', NULL, '7882', 1, 'HYPERPHOSPHOREMIE', 6),
(3, 7, b'0', '2026-04-15', NULL, 'HTHY', 8, 'TACROLIMUS', 4);

-- --------------------------------------------------------

--
-- Structure de la table `resultat_laboratoire`
--

DROP TABLE IF EXISTS `resultat_laboratoire`;
CREATE TABLE IF NOT EXISTS `resultat_laboratoire` (
  `id_resultat_laboratoire` bigint NOT NULL AUTO_INCREMENT,
  `conclusion` text COLLATE utf8mb4_unicode_ci,
  `date_prelevement` datetime(6) DEFAULT NULL,
  `date_rendu` datetime(6) DEFAULT NULL,
  `date_resultat` date DEFAULT NULL,
  `date_validation` datetime(6) DEFAULT NULL,
  `etat` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `interpretation` enum('BAS','CRITIQUE_BAS','CRITIQUE_HAUT','ELEVE','NORMAL') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `partage_patient` bit(1) NOT NULL,
  `source_import` enum('HL7','LABO_CONNECTE','PDF_OCR','SAISIE_MANUELLE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statut_resultat` enum('EN_ATTENTE','RECU','VALIDE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unite` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valeur_numerique` double DEFAULT NULL,
  `valeur_resultat` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valeur_texte` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valide_par_medecin` bigint DEFAULT NULL,
  `id_dossier_medical` bigint NOT NULL,
  `id_test_laboratoire` bigint NOT NULL,
  PRIMARY KEY (`id_resultat_laboratoire`),
  KEY `FKc993345smuqs8n7ruoaenuu8g` (`id_dossier_medical`),
  KEY `FKgihq90m95r9jtmnauwcx1dvct` (`id_test_laboratoire`)
) ENGINE=InnoDB AUTO_INCREMENT=107 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `resultat_laboratoire`
--

INSERT INTO `resultat_laboratoire` (`id_resultat_laboratoire`, `conclusion`, `date_prelevement`, `date_rendu`, `date_resultat`, `date_validation`, `etat`, `interpretation`, `partage_patient`, `source_import`, `statut_resultat`, `unite`, `valeur_numerique`, `valeur_resultat`, `valeur_texte`, `valide_par_medecin`, `id_dossier_medical`, `id_test_laboratoire`) VALUES
(85, 'Conclusion: 1 anomalie(s) detectee(s): Creatinine (bas). Correlation clinique necessaire.', '2026-04-15 08:00:00.000000', '2026-04-15 22:11:09.000000', '2026-04-15', NULL, 'Bas', 'BAS', b'1', 'SAISIE_MANUELLE', 'RECU', 'mg/L', NULL, 'Créatininémie=52 µmol/L ; Urée=5 mmol/L ; Acide urique=5 µmol/L ; Cystatine C=4 mg/L ; DFG estimé=6 mL/min/1,73m² ; DFG cystatine C=6 mL/min/1,73m² | 14.2 g/L', 'Bas', NULL, 4, 34),
(86, 'Conclusion: 1 anomalie(s) detectee(s): Creatinine (bas). Correlation clinique necessaire.', '2026-04-15 08:00:00.000000', '2026-04-15 22:11:09.000000', '2026-04-15', NULL, 'Bas', 'BAS', b'1', 'SAISIE_MANUELLE', 'RECU', 'µmol/L', NULL, 'Créatininémie=52 µmol/L ; Urée=5 mmol/L ; Acide urique=5 µmol/L ; Cystatine C=4 mg/L ; DFG estimé=6 mL/min/1,73m² ; DFG cystatine C=6 mL/min/1,73m² | 14.2 g/L', 'Bas', NULL, 4, 30),
(87, 'Conclusion: 1 anomalie(s) detectee(s): Creatinine (bas). Correlation clinique necessaire.', '2026-04-15 08:00:00.000000', '2026-04-15 22:11:09.000000', '2026-04-15', NULL, 'Bas', 'BAS', b'1', 'SAISIE_MANUELLE', 'RECU', 'mmol/L', NULL, 'Créatininémie=52 µmol/L ; Urée=5 mmol/L ; Acide urique=5 µmol/L ; Cystatine C=4 mg/L ; DFG estimé=6 mL/min/1,73m² ; DFG cystatine C=6 mL/min/1,73m² | 14.2 g/L', 'Bas', NULL, 4, 32),
(88, 'Conclusion: 1 anomalie(s) detectee(s): Creatinine (bas). Correlation clinique necessaire.', '2026-04-15 08:00:00.000000', '2026-04-15 22:11:09.000000', '2026-04-15', NULL, 'Bas', 'BAS', b'1', 'SAISIE_MANUELLE', 'RECU', 'µmol/L', NULL, 'Créatininémie=52 µmol/L ; Urée=5 mmol/L ; Acide urique=5 µmol/L ; Cystatine C=4 mg/L ; DFG estimé=6 mL/min/1,73m² ; DFG cystatine C=6 mL/min/1,73m² | 14.2 g/L', 'Bas', NULL, 4, 33),
(95, 'Conclusion: 1 anomalie(s) detectee(s): Creatinine (bas). Correlation clinique necessaire.', '2026-04-16 08:00:00.000000', '2026-04-16 02:15:35.000000', '2026-04-16', NULL, NULL, NULL, b'1', 'SAISIE_MANUELLE', 'RECU', 'mmol/L', NULL, 'Créatininémie=52 µmol/L ; Urée=3 mmol/L ; Acide urique=7 µmol/L ; Cystatine C=6 mg/L ; DFG estimé=4 mL/min/1,73m² ; DFG cystatine C=4 mL/min/1,73m² | Négatif', 'Créatininémie=52 µmol/L ; Urée=3 mmol/L ; Acide urique=7 µmol/L ; Cystatine C=6 mg/L ; DFG estimé=4', NULL, 4, 32),
(96, 'Conclusion: 1 anomalie(s) detectee(s): Creatinine (bas). Correlation clinique necessaire.', '2026-04-16 08:00:00.000000', '2026-04-16 02:15:35.000000', '2026-04-16', NULL, NULL, NULL, b'1', 'SAISIE_MANUELLE', 'RECU', 'µmol/L', NULL, 'Créatininémie=52 µmol/L ; Urée=3 mmol/L ; Acide urique=7 µmol/L ; Cystatine C=6 mg/L ; DFG estimé=4 mL/min/1,73m² ; DFG cystatine C=4 mL/min/1,73m² | Négatif', 'Créatininémie=52 µmol/L ; Urée=3 mmol/L ; Acide urique=7 µmol/L ; Cystatine C=6 mg/L ; DFG estimé=4', NULL, 4, 30),
(97, 'Conclusion: pas d\'anomalie biologique majeure detectee sur les parametres saisis. Surveillance clinique standard recommandee.', '2026-04-16 08:00:00.000000', '2026-04-16 10:11:25.000000', '2026-04-16', NULL, 'Normal', 'NORMAL', b'1', 'SAISIE_MANUELLE', 'RECU', 'g/g créat', NULL, 'Protéines urine=4 mg/L ; Albuminurie=5 ; Rapport Alb/Créat=6 ; Vol. urinaire 24h=5 mL ; Créatinine urinaire=6 | Positif', 'Normal', NULL, 4, 51),
(98, 'Conclusion: 1 anomalie(s) detectee(s): Creatinine (bas). Correlation clinique necessaire.', '2026-04-16 08:00:00.000000', '2026-04-16 10:45:09.000000', '2026-04-16', NULL, 'Normal', 'NORMAL', b'1', 'SAISIE_MANUELLE', 'RECU', 'µmol/L', NULL, 'Créatininémie=6 µmol/L ; Urée=7 mmol/L ; Acide urique=8 µmol/L ; Cystatine C=8 mg/L ; DFG estimé=7 mL/min/1,73m² ; DFG cystatine C=8 mL/min/1,73m² | 5', 'Normal', NULL, 4, 30),
(99, 'Conclusion: pas d\'anomalie biologique majeure detectee sur les parametres saisis. Surveillance clinique standard recommandee.', '2026-04-27 08:00:00.000000', '2026-04-27 09:55:28.000000', '2026-04-27', NULL, NULL, NULL, b'1', 'SAISIE_MANUELLE', 'RECU', 'mmol/L', NULL, 'Na=44 mmol/L ; K=\'4 mmol/L ; Cl=102 mmol/L ; HCO3=24 mmol/L ; Ca=4 mmol/L ; Mg=5 mmol/L ; P=8 mmol/L | Positif', 'Na=44 mmol/L ; K=\'4 mmol/L ; Cl=102 mmol/L ; HCO3=24 mmol/L ; Ca=4 mmol/L ; Mg=5 mmol/L ; P=8 mmol/L', NULL, 4, 40),
(100, 'Conclusion: pas d\'anomalie biologique majeure detectee sur les parametres saisis. Surveillance clinique standard recommandee.', '2026-04-27 08:00:00.000000', '2026-04-27 09:55:28.000000', '2026-04-27', NULL, NULL, NULL, b'1', 'SAISIE_MANUELLE', 'RECU', 'mmol/L', NULL, 'Na=44 mmol/L ; K=\'4 mmol/L ; Cl=102 mmol/L ; HCO3=24 mmol/L ; Ca=4 mmol/L ; Mg=5 mmol/L ; P=8 mmol/L | Positif', 'Na=44 mmol/L ; K=\'4 mmol/L ; Cl=102 mmol/L ; HCO3=24 mmol/L ; Ca=4 mmol/L ; Mg=5 mmol/L ; P=8 mmol/L', NULL, 4, 36),
(101, 'Conclusion: pas d\'anomalie biologique majeure detectee sur les parametres saisis. Surveillance clinique standard recommandee.', '2026-04-27 08:00:00.000000', '2026-04-27 09:55:28.000000', '2026-04-27', NULL, NULL, NULL, b'1', 'SAISIE_MANUELLE', 'RECU', 'mmol/L', NULL, 'Na=44 mmol/L ; K=\'4 mmol/L ; Cl=102 mmol/L ; HCO3=24 mmol/L ; Ca=4 mmol/L ; Mg=5 mmol/L ; P=8 mmol/L | Positif', 'Na=44 mmol/L ; K=\'4 mmol/L ; Cl=102 mmol/L ; HCO3=24 mmol/L ; Ca=4 mmol/L ; Mg=5 mmol/L ; P=8 mmol/L', NULL, 4, 39),
(103, 'Conclusion: pas d\'anomalie biologique majeure detectee sur les parametres saisis. Surveillance clinique standard recommandee.', '2026-04-27 08:00:00.000000', '2026-04-27 09:55:28.000000', '2026-04-27', NULL, NULL, NULL, b'1', 'SAISIE_MANUELLE', 'RECU', 'mmol/L', NULL, 'Na=44 mmol/L ; K=\'4 mmol/L ; Cl=102 mmol/L ; HCO3=24 mmol/L ; Ca=4 mmol/L ; Mg=5 mmol/L ; P=8 mmol/L | Positif', 'Na=44 mmol/L ; K=\'4 mmol/L ; Cl=102 mmol/L ; HCO3=24 mmol/L ; Ca=4 mmol/L ; Mg=5 mmol/L ; P=8 mmol/L', NULL, 4, 38),
(104, 'Conclusion: pas d\'anomalie biologique majeure detectee sur les parametres saisis. Surveillance clinique standard recommandee.', '2026-04-27 08:00:00.000000', '2026-04-27 09:55:28.000000', '2026-04-27', NULL, NULL, NULL, b'1', 'SAISIE_MANUELLE', 'RECU', 'mmol/L', NULL, 'Na=44 mmol/L ; K=\'4 mmol/L ; Cl=102 mmol/L ; HCO3=24 mmol/L ; Ca=4 mmol/L ; Mg=5 mmol/L ; P=8 mmol/L | Positif', 'Na=44 mmol/L ; K=\'4 mmol/L ; Cl=102 mmol/L ; HCO3=24 mmol/L ; Ca=4 mmol/L ; Mg=5 mmol/L ; P=8 mmol/L', NULL, 4, 41),
(105, 'Conclusion: pas d\'anomalie biologique majeure detectee sur les parametres saisis. Surveillance clinique standard recommandee.', '2026-04-27 08:00:00.000000', '2026-04-27 09:55:28.000000', '2026-04-27', NULL, NULL, NULL, b'1', 'SAISIE_MANUELLE', 'RECU', 'mmol/L', NULL, 'Na=44 mmol/L ; K=\'4 mmol/L ; Cl=102 mmol/L ; HCO3=24 mmol/L ; Ca=4 mmol/L ; Mg=5 mmol/L ; P=8 mmol/L | Positif', 'Na=44 mmol/L ; K=\'4 mmol/L ; Cl=102 mmol/L ; HCO3=24 mmol/L ; Ca=4 mmol/L ; Mg=5 mmol/L ; P=8 mmol/L', NULL, 4, 42),
(106, 'Conclusion: pas d\'anomalie biologique majeure detectee sur les parametres saisis. Surveillance clinique standard recommandee.', '2026-04-27 08:00:00.000000', '2026-04-27 09:55:28.000000', '2026-04-27', NULL, NULL, NULL, b'1', 'SAISIE_MANUELLE', 'RECU', 'mmol/L', NULL, 'Na=44 mmol/L ; K=\'4 mmol/L ; Cl=102 mmol/L ; HCO3=24 mmol/L ; Ca=4 mmol/L ; Mg=5 mmol/L ; P=8 mmol/L | Positif', 'Na=44 mmol/L ; K=\'4 mmol/L ; Cl=102 mmol/L ; HCO3=24 mmol/L ; Ca=4 mmol/L ; Mg=5 mmol/L ; P=8 mmol/L', NULL, 4, 43);

-- --------------------------------------------------------

--
-- Structure de la table `resultat_labtest`
--

DROP TABLE IF EXISTS `resultat_labtest`;
CREATE TABLE IF NOT EXISTS `resultat_labtest` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code_loinc` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_prelevement` datetime(6) DEFAULT NULL,
  `date_rendu` datetime(6) DEFAULT NULL,
  `dossier_id` bigint NOT NULL,
  `libelle_examen` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prescription_id` bigint DEFAULT NULL,
  `source` enum('HL7','LABO_EXTERNE','PDF_OCR','SAISIE_MANUELLE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statut_interpretation` enum('BAS','CRITIQUE_BAS','CRITIQUE_HAUT','ELEVE','NORMAL') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unite` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valeur` decimal(10,4) DEFAULT NULL,
  `valide_par_medecin` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `suivi`
--

DROP TABLE IF EXISTS `suivi`;
CREATE TABLE IF NOT EXISTS `suivi` (
  `id_suivi` bigint NOT NULL AUTO_INCREMENT,
  `chemin_piece_jointe` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_suivi` date NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `objectif` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resultat` enum('AMELIORATION','ATTENTE_RESULTATS','COMPLIANCE_BONNE','COMPLIANCE_FAIBLE','CONSULTATION_SPECIALISEE_REQUISE','DECES','DETERIORATION','EN_COURS','GREFFE_EN_ATTENTE','GUERISON','HOSPITALISATION_REQUISE','PERDU_DE_VUE','POST_OPERATOIRE','RECHUTE','REMISSION','SOUS_SURVEILLANCE','STABLE','SUIVI_TERMINE','TRAITEMENT_MODIFIE','URGENCE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_dossier_medical` bigint NOT NULL,
  PRIMARY KEY (`id_suivi`),
  KEY `FKhxl5aj7y705ouv91v3b3p14x2` (`id_dossier_medical`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `test_laboratoire`
--

DROP TABLE IF EXISTS `test_laboratoire`;
CREATE TABLE IF NOT EXISTS `test_laboratoire` (
  `id_test_laboratoire` bigint NOT NULL AUTO_INCREMENT,
  `categorie` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code_loinc` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code_test` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `delai_rendu_heures` int DEFAULT NULL,
  `methode_analyse` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `necessite_jeune` bit(1) NOT NULL,
  `nom_test` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prix` double DEFAULT NULL,
  `type_echantillon` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unite` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valeurs_normales` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_test_laboratoire`),
  UNIQUE KEY `UKg59twokptjfp3pxu7qsujmsyo` (`code_test`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `test_laboratoire`
--

INSERT INTO `test_laboratoire` (`id_test_laboratoire`, `categorie`, `code_loinc`, `code_test`, `delai_rendu_heures`, `methode_analyse`, `necessite_jeune`, `nom_test`, `prix`, `type_echantillon`, `unite`, `valeurs_normales`) VALUES
(30, 'Biochimie rénale', '2160-0', 'CREATININEMIE', 24, 'Enzymatique (Jaffé ou enzymatique)', b'0', 'Créatininémie', 18.5, 'Sang veineux', 'µmol/L', '53–97 µmol/L (adulte) ; normes pédiatriques selon âge/poids.'),
(31, 'Biochimie rénale', '48642-3', 'DFG_ESTIME_SCHWARTZ', 24, 'Formule Schwartz / CKD-EPI pédiatrique', b'0', 'DFG estimé (Schwartz)', 0, 'Calculé (sang)', 'mL/min/1.73m²', '> 90 mL/min/1,73 m² (interprétation selon âge).'),
(32, 'Biochimie rénale', '3094-0', 'UREE', 24, 'Enzymatique (uréase-GDH)', b'0', 'Urée', 12, 'Sang veineux', 'mmol/L', '2,5–7,5 mmol/L (adulte) ; normes pédiatriques selon laboratoire.'),
(33, 'Biochimie rénale', '3084-1', 'ACIDE_URIQUE', 24, 'Enzymatique', b'0', 'Acide urique', 14, 'Sang veineux', 'µmol/L', '150–420 µmol/L (homme) ; 120–360 µmol/L (femme).'),
(34, 'Biochimie rénale', '33914-3', 'CYSTATINE_C', 48, 'Immunonéphélométrie / turbidimétrie', b'0', 'Cystatine C', 35, 'Sang veineux', 'mg/L', '0,53–0,95 mg/L (adulte) ; normes selon âge.'),
(35, 'Biochimie rénale', '76633-7', 'DFG_CYSTATINE_C', 48, 'Formule basée sur cystatine C', b'0', 'DFG cystatine C', 0, 'Calculé (sang)', 'mL/min/1.73m²', '> 90 mL/min/1,73 m² selon formule validée.'),
(36, 'Électrolytes', '2951-2', 'NATREMIE', 24, 'Électrode ion-sélective indirecte', b'0', 'Natrémie', 10, 'Sang veineux', 'mmol/L', '136–145 mmol/L.'),
(37, 'Électrolytes', '2823-3', 'KALIEMIE', 24, 'Électrode ion-sélective indirecte', b'0', 'Kaliémie', 10, 'Sang veineux', 'mmol/L', '3,5–5,1 mmol/L.'),
(38, 'Électrolytes', '2075-0', 'CHLOREMIE', 24, 'Électrode ion-sélective indirecte', b'0', 'Chloremie', 10, 'Sang veineux', 'mmol/L', '98–107 mmol/L.'),
(39, 'Électrolytes', '1963-8', 'BICARBONATES', 24, 'Calcul sur gaz du sang / enzymatique', b'0', 'Bicarbonates', 12, 'Sang veineux', 'mmol/L', '22–29 mmol/L.'),
(40, 'Électrolytes', '2777-1', 'PHOSPHOREMIE', 24, 'Spectrophotométrie (molybdate)', b'0', 'Phosphorémie', 10, 'Sang veineux', 'mmol/L', '0,81–1,45 mmol/L (adulte) ; fortement âge-dépendant en pédiatrie.'),
(41, 'Électrolytes', '2000-8', 'CALCEMIE', 24, 'Spectrophotométrie (o-cresolphtaléine)', b'0', 'Calcémie', 10, 'Sang veineux', 'mmol/L', '2,15–2,55 mmol/L (albumine corrigée si besoin).'),
(42, 'Électrolytes', '2000-8', 'CALCEMIE_CORRIGEE', 24, 'Calcul (albumine, formule Payne ou équivalent)', b'0', 'Calcémie corrigée', 10, 'Sang veineux', 'mmol/L', '2,15–2,55 mmol/L équivalent total.'),
(43, 'Électrolytes', '2601-3', 'MAGNESEMIE', 24, 'Spectrophotométrie (xylidyl bleu)', b'0', 'Magnésémie', 12, 'Sang veineux', 'mmol/L', '0,75–1,00 mmol/L.'),
(44, 'Métabolisme osseux', '2731-8', 'PTH', 48, 'Chimiluminescence (ECLIA)', b'0', 'PTH', 45, 'Sang veineux', 'pg/mL', '15–65 pg/mL (selon méthode et laboratoire).'),
(45, 'Métabolisme osseux', '35365-6', 'VITAMINE_D_25OH', 48, 'LC-MS/MS ou immunoessai', b'0', 'Vitamine D (25-OH)', 38, 'Sang veineux', 'nmol/L', '75–125 nmol/L (suffisance) ; seuils selon recommandations locales.'),
(46, 'Métabolisme osseux', '1989-3', 'VITAMINE_D_1_25OH', 72, 'Immunoessai', b'0', 'Vitamine D (1-25-OH)', 55, 'Sang veineux', 'pmol/L', '40–160 pmol/L (selon méthode).'),
(47, 'Métabolisme osseux', '83192-0', 'FGF23', 72, 'ELISA / CLIA', b'0', 'FGF23', 65, 'Sang veineux', 'pg/mL', 'Interprétation selon contexte (hyperphosphatémie familiale, etc.).'),
(48, 'Hématologie', '58410-2', 'NFS', 24, 'Analyseur d’hématologie (flux / impedance)', b'0', 'NFS', 22, 'Sang veineux (EDTA)', 'Panel', 'Formule leucocytaire et numération selon normes d’âge (voir référentiel pédiatrique).'),
(49, 'Hématologie', '718-7', 'HEMOGLOBINE', 24, 'Spectrophotométrie (cyanméthémoglobine)', b'0', 'Hémoglobine', 8, 'Sang veineux (EDTA)', 'g/L', '120–160 g/L (homme) ; 110–150 g/L (femme) ; normes pédiatriques selon âge.'),
(50, 'Biochimie', '1751-7', 'ALBUMINEMIE', 24, 'Spectrophotométrie (vert de bromocrésol)', b'0', 'Albuminémie', 12, 'Sang veineux', 'g/L', '35–50 g/L.'),
(51, 'Urinaire', '2888-6', 'PROTEINURIE', 24, 'Rapport albumine-créatinine ou dosage protéines', b'0', 'Protéinurie', 15, 'Urine (spot ou 24 h)', 'g/g créat', '< 0,2 g/g créat (ACR) ; interprétation selon protocole.'),
(52, 'Immunologie', '24351-9', 'ELECTROPHORESE_PROTEINES', 48, 'Électrophorèse capillaire ou gel', b'0', 'Électrophorèse des protéines', 42, 'Sang veineux', 'Profil relatif', 'Profil normal : albumine dominante ; fractions alpha, bêta, gamma selon laboratoire.'),
(53, 'Biochimie', '24323-8', 'BILAN_HEPATIQUE', 24, 'Multiplex automatisé (ASAT, ALAT, GGT, PAL, bilirubines)', b'1', 'Bilan hépatique', 28, 'Sang veineux', 'Panel', 'ASAT/ALAT, bilirubines, PAL selon normes d’âge.'),
(54, 'Biochimie', '2345-7', 'GLYCEMIE', 24, 'Enzymatique (glucose oxydase / hexokinase)', b'1', 'Glycémie', 9, 'Sang veineux', 'mmol/L', '3,9–6,1 mmol/L à jeun ; objectifs selon contexte diabète.'),
(55, 'Inflammation', '1988-5', 'CRP', 24, 'Immunoturbidimétrie / néphélométrie', b'0', 'CRP', 14, 'Sang veineux', 'mg/L', '< 5 mg/L (faible risque inflammatoire) ; seuils selon méthode.'),
(56, 'Urinaire', '5794-3', 'HEMATURIE', 24, 'Bandelette / microscopie', b'0', 'Hématurie', 11, 'Urine', 'qualitatif', 'Absence d’hématurie significative ; interprétation clinique.'),
(57, 'Microbiologie', '630-4', 'CULTURE_URINE', 72, 'Culture sur milieux sélectifs', b'0', 'Culture d\'urine', 25, 'Urine (prélèvement propre)', 'UFC', 'Absence de croissance pathogène significative ; seuils CFU selon protocole.'),
(58, 'Autre', '99999-9', 'AUTRE', 48, 'Selon examen', b'0', 'Autre', 0, 'Selon prescription', 'variable', 'À préciser selon l’analyse demandée.');

-- --------------------------------------------------------

--
-- Structure de la table `user_app`
--

DROP TABLE IF EXISTS `user_app`;
CREATE TABLE IF NOT EXISTS `user_app` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `keycloak_subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKjw44mqi7mh8me9fw872m7sds7` (`keycloak_subject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `vaccinations`
--

DROP TABLE IF EXISTS `vaccinations`;
CREATE TABLE IF NOT EXISTS `vaccinations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `booster_date` datetime(6) DEFAULT NULL,
  `booster_taken` bit(1) NOT NULL,
  `infection_id` bigint DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `taken` bit(1) NOT NULL,
  `vaccination_date` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `vaccinations`
--

INSERT INTO `vaccinations` (`id`, `booster_date`, `booster_taken`, `infection_id`, `name`, `taken`, `vaccination_date`) VALUES
(1, '2026-04-15 09:38:56.000000', b'0', 1, 'Vaccine', b'0', '2026-04-02 09:38:56.000000');

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `constante_vitale`
--
ALTER TABLE `constante_vitale`
  ADD CONSTRAINT `FKs3mia8ys8g3uc8ugvkmrxn2gc` FOREIGN KEY (`indicateur_vital_id_indicateur_vital`) REFERENCES `indicateur_vital` (`id_indicateur_vital`);

--
-- Contraintes pour la table `consultation`
--
ALTER TABLE `consultation`
  ADD CONSTRAINT `FKf55w0tunl75pbui7v84hmbuus` FOREIGN KEY (`rendezvous_id_rendezvous`) REFERENCES `rendezvous` (`id_rendezvous`),
  ADD CONSTRAINT `FKft7nfrf9cw433dljyfeiymne3` FOREIGN KEY (`medecin_id_medecin`) REFERENCES `medecin` (`id_medecin`),
  ADD CONSTRAINT `FKopm3qrmj8r9i23t4rrj0fc715` FOREIGN KEY (`patient_id_patient`) REFERENCES `patient` (`id_patient`);

--
-- Contraintes pour la table `daily_report`
--
ALTER TABLE `daily_report`
  ADD CONSTRAINT `FKa0h6qm5hpt763ftyv8c6xki89` FOREIGN KEY (`hospitalization_id_hospitalization`) REFERENCES `hospitalization` (`id_hospitalization`);

--
-- Contraintes pour la table `dosage_adjustment`
--
ALTER TABLE `dosage_adjustment`
  ADD CONSTRAINT `FKnpq1rg4w1w41dmb2yhghuiif` FOREIGN KEY (`prescription_item_id`) REFERENCES `prescription_item` (`id`);

--
-- Contraintes pour la table `image_medicale`
--
ALTER TABLE `image_medicale`
  ADD CONSTRAINT `FKc2duo4hv54wgx13ftqj4p318b` FOREIGN KEY (`id_dossier_medical`) REFERENCES `dossier_medical` (`id_dossier_medical`);

--
-- Contraintes pour la table `medication_history`
--
ALTER TABLE `medication_history`
  ADD CONSTRAINT `FKnm25hs28gc5gslk4uvdyk7ww8` FOREIGN KEY (`prescription_item_id`) REFERENCES `prescription_item` (`id`);

--
-- Contraintes pour la table `medication_schedule`
--
ALTER TABLE `medication_schedule`
  ADD CONSTRAINT `FK3mu455wiw43jod0jmyvjpwq43` FOREIGN KEY (`prescription_item_id`) REFERENCES `prescription_item` (`id`);

--
-- Contraintes pour la table `message`
--
ALTER TABLE `message`
  ADD CONSTRAINT `FKjyavay9rc2derngq2bvsjcj1v` FOREIGN KEY (`id_dossier_medical`) REFERENCES `dossier_medical` (`id_dossier_medical`);

--
-- Contraintes pour la table `note_interne`
--
ALTER TABLE `note_interne`
  ADD CONSTRAINT `FKayjijwy42n1syyypyge6rbtcq` FOREIGN KEY (`id_dossier_medical`) REFERENCES `dossier_medical` (`id_dossier_medical`);

--
-- Contraintes pour la table `parametre_vital`
--
ALTER TABLE `parametre_vital`
  ADD CONSTRAINT `FK77pr94xku3ibcdfpmtjjq65i5` FOREIGN KEY (`constante_vitale_id_constante_vitale`) REFERENCES `constante_vitale` (`id_constante_vitale`);

--
-- Contraintes pour la table `prescription_bilan_examens`
--
ALTER TABLE `prescription_bilan_examens`
  ADD CONSTRAINT `FK3r9qd90li2l1qeryhfwj06b1i` FOREIGN KEY (`prescription_id`) REFERENCES `prescription_bilan` (`id`);

--
-- Contraintes pour la table `prescription_item`
--
ALTER TABLE `prescription_item`
  ADD CONSTRAINT `FKct6o91onjk12s6dvh8ajhvmso` FOREIGN KEY (`medication_id`) REFERENCES `medication` (`id`),
  ADD CONSTRAINT `FKeykn9e2g6nbmvwhqbrdm3jb2p` FOREIGN KEY (`prescription_id`) REFERENCES `prescription` (`id`);

--
-- Contraintes pour la table `rapport`
--
ALTER TABLE `rapport`
  ADD CONSTRAINT `FKixmyonkrjodrme79rier1vob2` FOREIGN KEY (`consultation_id_consultation`) REFERENCES `consultation` (`id_consultation`);

--
-- Contraintes pour la table `rapport_bi`
--
ALTER TABLE `rapport_bi`
  ADD CONSTRAINT `FK76o6fqej1tulnpihqkp0pu711` FOREIGN KEY (`id_resultat_laboratoire`) REFERENCES `resultat_laboratoire` (`id_resultat_laboratoire`),
  ADD CONSTRAINT `FKeru13c3xabofe59ll441nj0j9` FOREIGN KEY (`id_dossier_medical`) REFERENCES `dossier_medical` (`id_dossier_medical`);

--
-- Contraintes pour la table `rapport_bilan_resultats`
--
ALTER TABLE `rapport_bilan_resultats`
  ADD CONSTRAINT `FKa0hd5va15wj4qdlnefw6m8ndo` FOREIGN KEY (`rapport_id`) REFERENCES `rapport_bilan` (`id`);

--
-- Contraintes pour la table `rapport_bi_resultats`
--
ALTER TABLE `rapport_bi_resultats`
  ADD CONSTRAINT `FK896e6ahu3wi1vl90otprb7apx` FOREIGN KEY (`id_resultat_laboratoire`) REFERENCES `resultat_laboratoire` (`id_resultat_laboratoire`),
  ADD CONSTRAINT `FKb79wmkayj86ioujrtm7mw8n8c` FOREIGN KEY (`id_rapport_bi`) REFERENCES `rapport_bi` (`id_rapport_bilan`);

--
-- Contraintes pour la table `rendezvous`
--
ALTER TABLE `rendezvous`
  ADD CONSTRAINT `FKllapixy78kso97se158oe5xrr` FOREIGN KEY (`consultation_id_consultation`) REFERENCES `consultation` (`id_consultation`),
  ADD CONSTRAINT `FKrun15b47i4ilndu6g3ru85baw` FOREIGN KEY (`patient_id_patient`) REFERENCES `patient` (`id_patient`);

--
-- Contraintes pour la table `resultat_laboratoire`
--
ALTER TABLE `resultat_laboratoire`
  ADD CONSTRAINT `FKc993345smuqs8n7ruoaenuu8g` FOREIGN KEY (`id_dossier_medical`) REFERENCES `dossier_medical` (`id_dossier_medical`),
  ADD CONSTRAINT `FKgihq90m95r9jtmnauwcx1dvct` FOREIGN KEY (`id_test_laboratoire`) REFERENCES `test_laboratoire` (`id_test_laboratoire`);

--
-- Contraintes pour la table `suivi`
--
ALTER TABLE `suivi`
  ADD CONSTRAINT `FKhxl5aj7y705ouv91v3b3p14x2` FOREIGN KEY (`id_dossier_medical`) REFERENCES `dossier_medical` (`id_dossier_medical`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
