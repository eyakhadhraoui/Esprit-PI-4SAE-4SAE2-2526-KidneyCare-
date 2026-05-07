package com.example.NEPHRO.Enum;

/**
 * Catalogue des tests laboratoire pour la néphrologie pédiatrique.
 * Tous les champs sont renseignés (aucune valeur nulle en base après synchronisation).
 */
public enum TypeTestLaboratoire {

    // ——— Biochimie rénale / Fonction rénale ———
    CREATININEMIE(meta("Créatininémie", "Biochimie rénale", "2160-0", "µmol/L", "Sang veineux", 24,
            "Enzymatique (Jaffé ou enzymatique)", 18.5, "53–97 µmol/L (adulte) ; normes pédiatriques selon âge/poids.", false)),
    DFG_ESTIME_SCHWARTZ(meta("DFG estimé (Schwartz)", "Biochimie rénale", "48642-3", "mL/min/1.73m²", "Calculé (sang)", 24,
            "Formule Schwartz / CKD-EPI pédiatrique", 0.0, "> 90 mL/min/1,73 m² (interprétation selon âge).", false)),
    UREE(meta("Urée", "Biochimie rénale", "3094-0", "mmol/L", "Sang veineux", 24,
            "Enzymatique (uréase-GDH)", 12.0, "2,5–7,5 mmol/L (adulte) ; normes pédiatriques selon laboratoire.", false)),
    ACIDE_URIQUE(meta("Acide urique", "Biochimie rénale", "3084-1", "µmol/L", "Sang veineux", 24,
            "Enzymatique", 14.0, "150–420 µmol/L (homme) ; 120–360 µmol/L (femme).", false)),
    CYSTATINE_C(meta("Cystatine C", "Biochimie rénale", "33914-3", "mg/L", "Sang veineux", 48,
            "Immunonéphélométrie / turbidimétrie", 35.0, "0,53–0,95 mg/L (adulte) ; normes selon âge.", false)),
    DFG_CYSTATINE_C(meta("DFG cystatine C", "Biochimie rénale", "76633-7", "mL/min/1.73m²", "Calculé (sang)", 48,
            "Formule basée sur cystatine C", 0.0, "> 90 mL/min/1,73 m² selon formule validée.", false)),

    // ——— Électrolytes / Ionogramme ———
    NATREMIE(meta("Natrémie", "Électrolytes", "2951-2", "mmol/L", "Sang veineux", 24,
            "Électrode ion-sélective indirecte", 10.0, "136–145 mmol/L.", false)),
    KALIEMIE(meta("Kaliémie", "Électrolytes", "2823-3", "mmol/L", "Sang veineux", 24,
            "Électrode ion-sélective indirecte", 10.0, "3,5–5,1 mmol/L.", false)),
    CHLOREMIE(meta("Chloremie", "Électrolytes", "2075-0", "mmol/L", "Sang veineux", 24,
            "Électrode ion-sélective indirecte", 10.0, "98–107 mmol/L.", false)),
    BICARBONATES(meta("Bicarbonates", "Électrolytes", "1963-8", "mmol/L", "Sang veineux", 24,
            "Calcul sur gaz du sang / enzymatique", 12.0, "22–29 mmol/L.", false)),
    PHOSPHOREMIE(meta("Phosphorémie", "Électrolytes", "2777-1", "mmol/L", "Sang veineux", 24,
            "Spectrophotométrie (molybdate)", 10.0, "0,81–1,45 mmol/L (adulte) ; fortement âge-dépendant en pédiatrie.", false)),
    CALCEMIE(meta("Calcémie", "Électrolytes", "2000-8", "mmol/L", "Sang veineux", 24,
            "Spectrophotométrie (o-cresolphtaléine)", 10.0, "2,15–2,55 mmol/L (albumine corrigée si besoin).", false)),
    CALCEMIE_CORRIGEE(meta("Calcémie corrigée", "Électrolytes", "2000-8", "mmol/L", "Sang veineux", 24,
            "Calcul (albumine, formule Payne ou équivalent)", 10.0, "2,15–2,55 mmol/L équivalent total.", false)),
    MAGNESEMIE(meta("Magnésémie", "Électrolytes", "2601-3", "mmol/L", "Sang veineux", 24,
            "Spectrophotométrie (xylidyl bleu)", 12.0, "0,75–1,00 mmol/L.", false)),

    // ——— Métabolisme osseux ———
    PTH(meta("PTH", "Métabolisme osseux", "2731-8", "pg/mL", "Sang veineux", 48,
            "Chimiluminescence (ECLIA)", 45.0, "15–65 pg/mL (selon méthode et laboratoire).", false)),
    VITAMINE_D_25OH(meta("Vitamine D (25-OH)", "Métabolisme osseux", "35365-6", "nmol/L", "Sang veineux", 48,
            "LC-MS/MS ou immunoessai", 38.0, "75–125 nmol/L (suffisance) ; seuils selon recommandations locales.", false)),
    VITAMINE_D_1_25OH(meta("Vitamine D (1-25-OH)", "Métabolisme osseux", "1989-3", "pmol/L", "Sang veineux", 72,
            "Immunoessai", 55.0, "40–160 pmol/L (selon méthode).", false)),
    FGF23(meta("FGF23", "Métabolisme osseux", "83192-0", "pg/mL", "Sang veineux", 72,
            "ELISA / CLIA", 65.0, "Interprétation selon contexte (hyperphosphatémie familiale, etc.).", false)),

    // ——— Autres ———
    NFS(meta("NFS", "Hématologie", "58410-2", "Panel", "Sang veineux (EDTA)", 24,
            "Analyseur d’hématologie (flux / impedance)", 22.0, "Formule leucocytaire et numération selon normes d’âge (voir référentiel pédiatrique).", false)),
    HEMOGLOBINE(meta("Hémoglobine", "Hématologie", "718-7", "g/L", "Sang veineux (EDTA)", 24,
            "Spectrophotométrie (cyanméthémoglobine)", 8.0, "120–160 g/L (homme) ; 110–150 g/L (femme) ; normes pédiatriques selon âge.", false)),
    ALBUMINEMIE(meta("Albuminémie", "Biochimie", "1751-7", "g/L", "Sang veineux", 24,
            "Spectrophotométrie (vert de bromocrésol)", 12.0, "35–50 g/L.", false)),
    PROTEINURIE(meta("Protéinurie", "Urinaire", "2888-6", "g/g créat", "Urine (spot ou 24 h)", 24,
            "Rapport albumine-créatinine ou dosage protéines", 15.0, "< 0,2 g/g créat (ACR) ; interprétation selon protocole.", false)),
    ELECTROPHORESE_PROTEINES(meta("Électrophorèse des protéines", "Immunologie", "24351-9", "Profil relatif", "Sang veineux", 48,
            "Électrophorèse capillaire ou gel", 42.0, "Profil normal : albumine dominante ; fractions alpha, bêta, gamma selon laboratoire.", false)),
    BILAN_HEPATIQUE(meta("Bilan hépatique", "Biochimie", "24323-8", "Panel", "Sang veineux", 24,
            "Multiplex automatisé (ASAT, ALAT, GGT, PAL, bilirubines)", 28.0, "ASAT/ALAT, bilirubines, PAL selon normes d’âge.", true)),
    GLYCEMIE(meta("Glycémie", "Biochimie", "2345-7", "mmol/L", "Sang veineux", 24,
            "Enzymatique (glucose oxydase / hexokinase)", 9.0, "3,9–6,1 mmol/L à jeun ; objectifs selon contexte diabète.", true)),
    CRP(meta("CRP", "Inflammation", "1988-5", "mg/L", "Sang veineux", 24,
            "Immunoturbidimétrie / néphélométrie", 14.0, "< 5 mg/L (faible risque inflammatoire) ; seuils selon méthode.", false)),
    HEMATURIE(meta("Hématurie", "Urinaire", "5794-3", "qualitatif", "Urine", 24,
            "Bandelette / microscopie", 11.0, "Absence d’hématurie significative ; interprétation clinique.", false)),
    CULTURE_URINE(meta("Culture d'urine", "Microbiologie", "630-4", "UFC", "Urine (prélèvement propre)", 72,
            "Culture sur milieux sélectifs", 25.0, "Absence de croissance pathogène significative ; seuils CFU selon protocole.", false)),
    AUTRE(meta("Autre", "Autre", "99999-9", "variable", "Selon prescription", 48,
            "Selon examen", 0.0, "À préciser selon l’analyse demandée.", false));

    private final String nom;
    private final String categorie;
    private final String codeLoinc;
    private final String unite;
    private final String typeEchantillon;
    private final int delaiRenduHeures;
    private final String methodeAnalyse;
    private final double prix;
    private final String valeursNormales;
    private final boolean necessiteJeune;

    TypeTestLaboratoire(TestMeta m) {
        this.nom = m.nom;
        this.categorie = m.categorie;
        this.codeLoinc = m.codeLoinc;
        this.unite = m.unite;
        this.typeEchantillon = m.typeEchantillon;
        this.delaiRenduHeures = m.delaiRenduHeures;
        this.methodeAnalyse = m.methodeAnalyse;
        this.prix = m.prix;
        this.valeursNormales = m.valeursNormales;
        this.necessiteJeune = m.necessiteJeune;
    }

    private static TestMeta meta(String nom, String categorie, String codeLoinc, String unite, String typeEchantillon,
                                 int delaiRenduHeures, String methodeAnalyse, double prix, String valeursNormales,
                                 boolean necessiteJeune) {
        return new TestMeta(nom, categorie, codeLoinc, unite, typeEchantillon, delaiRenduHeures, methodeAnalyse, prix,
                valeursNormales, necessiteJeune);
    }

    private static final class TestMeta {
        final String nom;
        final String categorie;
        final String codeLoinc;
        final String unite;
        final String typeEchantillon;
        final int delaiRenduHeures;
        final String methodeAnalyse;
        final double prix;
        final String valeursNormales;
        final boolean necessiteJeune;

        TestMeta(String nom, String categorie, String codeLoinc, String unite, String typeEchantillon,
                 int delaiRenduHeures, String methodeAnalyse, double prix, String valeursNormales, boolean necessiteJeune) {
            this.nom = nom;
            this.categorie = categorie;
            this.codeLoinc = codeLoinc;
            this.unite = unite;
            this.typeEchantillon = typeEchantillon;
            this.delaiRenduHeures = delaiRenduHeures;
            this.methodeAnalyse = methodeAnalyse;
            this.prix = prix;
            this.valeursNormales = valeursNormales;
            this.necessiteJeune = necessiteJeune;
        }
    }

    public String getNom() {
        return nom;
    }

    public String getCategorie() {
        return categorie;
    }

    public String getCodeLoinc() {
        return codeLoinc;
    }

    public String getUnite() {
        return unite;
    }

    public String getTypeEchantillon() {
        return typeEchantillon;
    }

    public int getDelaiRenduHeures() {
        return delaiRenduHeures;
    }

    public String getMethodeAnalyse() {
        return methodeAnalyse;
    }

    public double getPrix() {
        return prix;
    }

    public String getValeursNormales() {
        return valeursNormales;
    }

    public boolean isNecessiteJeune() {
        return necessiteJeune;
    }

    /** Code du test (nom de l'enum) pour codeTest en base. */
    public String getCode() {
        return name();
    }
}
