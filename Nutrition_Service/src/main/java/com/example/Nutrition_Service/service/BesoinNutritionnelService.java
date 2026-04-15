package com.example.Nutrition_Service.service;

import com.example.Nutrition_Service.dto.BesoinNutritionnelDTO;
import com.example.Nutrition_Service.entity.BesoinNutritionnel;
import com.example.Nutrition_Service.repository.BesoinNutritionnelRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BesoinNutritionnelService {

    private final BesoinNutritionnelRepository besoinRepository;

    // ═══════════════════ DONNÉES STATIQUES ENRICHIES ═══════════════════
    @PostConstruct
    public void initStaticData() {
        if (besoinRepository.count() == 0) {
            createPatientData();
        }
    }

    private void createPatientData() {

        // ═══════════════════════════════════════════════════════════════
        // PATIENT 1 : Emma Johnson (2 ans, sous Tacrolimus)
        // ═══════════════════════════════════════════════════════════════
        BesoinNutritionnel patient1 = new BesoinNutritionnel();
        patient1.setPatientId(1L);
        patient1.setPoidsKg(22.0);
        patient1.setAgeMois(24);
        patient1.setTraitementTacrolimus(true);
        patient1.setTraitementPrednisone(false);
        patient1.setPotassiumMaxMg(1800);
        patient1.setSodiumMaxMg(1200);
        patient1.setPhosphoreMaxMg(800);
        patient1.setProteinesMaxG(40.0);
        patient1.setSucreMaxG(35.0);
        patient1.setCaloriesJour(1200);
        patient1.setDateDebut(LocalDate.now());
        patient1.setDateFin(null);
        patient1.setRaisonCalcul("Calculé selon poids (22kg) + âge (2 ans) + Tacrolimus actif");
        patient1.setNotes(
                "📊 DONNÉES ANTHROPOMÉTRIQUES:\n" +
                        "- Poids: 22 kg\n" +
                        "- Taille: 85 cm\n" +
                        "- Périmètre crânien: 48 cm\n" +
                        "- IMC: 30.4 (surpoids)\n\n" +

                        "💊 TRAITEMENT IMMUNOSUPPRESSEUR:\n" +
                        "- Tacrolimus: 2mg matin + 2mg soir (0.18mg/kg/jour)\n" +
                        "- Début traitement: 15/08/2024\n\n" +

                        "🔬 DERNIERS BILANS (18/02/2026):\n" +
                        "- Potassium: 5.2 mmol/L [Normal: 3.5-5.0] ⚠️ ÉLEVÉ\n" +
                        "- Sodium: 138 mmol/L [Normal: 135-145] ✓\n" +
                        "- Phosphore: 1.45 mmol/L [Normal: 1.0-1.8] ✓\n" +
                        "- Créatinine: 52 µmol/L [Normal: 27-62] ✓\n" +
                        "- Urée: 4.2 mmol/L [Normal: 2.5-6.4] ✓\n" +
                        "- Tacrolimus sanguin: 8.5 ng/mL [Cible: 5-15] ✓\n" +
                        "- Hémoglobine: 115 g/L [Normal: 110-140] ✓\n" +
                        "- Leucocytes: 6.2 x10⁹/L [Normal: 5-15] ✓\n\n" +

                        "⚠️ RESTRICTIONS ACTIVES:\n" +
                        "- HYPERKALIÉMIE: Éviter banane, fruits secs, épinards\n" +
                        "- TACROLIMUS: Pamplemousse INTERDIT\n\n" +

                        "📅 SURVEILLANCE:\n" +
                        "- Bilan sanguin: Chaque semaine\n" +
                        "- Pesée: 2x/semaine\n" +
                        "- Contrôle tension: Quotidien"
        );
        besoinRepository.save(patient1);

        // ═══════════════════════════════════════════════════════════════
        // PATIENT 2 : Lucas Thompson (9 mois, pas de traitement)
        // ═══════════════════════════════════════════════════════════════
        BesoinNutritionnel patient2 = new BesoinNutritionnel();
        patient2.setPatientId(2L);
        patient2.setPoidsKg(9.0);
        patient2.setAgeMois(9);
        patient2.setTraitementTacrolimus(false);
        patient2.setTraitementPrednisone(false);
        patient2.setPotassiumMaxMg(1000);
        patient2.setSodiumMaxMg(800);
        patient2.setPhosphoreMaxMg(500);
        patient2.setProteinesMaxG(20.0);
        patient2.setSucreMaxG(25.0);
        patient2.setCaloriesJour(800);
        patient2.setDateDebut(LocalDate.now());
        patient2.setDateFin(null);
        patient2.setRaisonCalcul("Calculé selon âge (9 mois) et poids (9kg) - Pas de traitement immunosuppresseur");
        patient2.setNotes(
                "📊 DONNÉES ANTHROPOMÉTRIQUES:\n" +
                        "- Poids: 9 kg\n" +
                        "- Taille: 72 cm\n" +
                        "- Périmètre crânien: 45 cm\n" +
                        "- IMC: 17.4 (normal)\n\n" +

                        "💊 TRAITEMENT:\n" +
                        "- Aucun immunosuppresseur\n" +
                        "- Supplémentation vitamine D: 400 UI/jour\n" +
                        "- Fer: 2mg/kg/jour\n\n" +

                        "🔬 DERNIERS BILANS (18/02/2026):\n" +
                        "- Potassium: 4.5 mmol/L [Normal: 3.5-5.0] ✓\n" +
                        "- Sodium: 140 mmol/L [Normal: 135-145] ✓\n" +
                        "- Phosphore: 1.6 mmol/L [Normal: 1.0-1.8] ✓\n" +
                        "- Créatinine: 35 µmol/L [Normal: 18-35] ✓ Limite haute\n" +
                        "- Urée: 3.8 mmol/L [Normal: 1.8-6.4] ✓\n" +
                        "- Hémoglobine: 105 g/L [Normal: 95-130] ✓\n" +
                        "- Fer sérique: 8 µmol/L [Normal: 7-18] ✓\n\n" +

                        "⚠️ RESTRICTIONS ACTIVES:\n" +
                        "- ÂGE: Raisins secs interdits (< 12 mois)\n" +
                        "- ÂGE: Fruits à coques interdits (< 12 mois)\n" +
                        "- Surveillance créatinine (limite haute)\n\n" +

                        "📅 SURVEILLANCE:\n" +
                        "- Bilan sanguin: Chaque mois\n" +
                        "- Pesée: 1x/semaine\n" +
                        "- Croissance: Courbe OMS normale"
        );
        besoinRepository.save(patient2);

        // ═══════════════════════════════════════════════════════════════
        // PATIENT 3 : Mohammed Karim (12 ans, Tacrolimus + Prednisone)
        // ═══════════════════════════════════════════════════════════════
        BesoinNutritionnel patient3 = new BesoinNutritionnel();
        patient3.setPatientId(3L);
        patient3.setPoidsKg(38.0);
        patient3.setAgeMois(144);
        patient3.setTraitementTacrolimus(true);
        patient3.setTraitementPrednisone(true);
        patient3.setPotassiumMaxMg(2500);
        patient3.setSodiumMaxMg(1500);
        patient3.setPhosphoreMaxMg(1200);
        patient3.setProteinesMaxG(55.0);
        patient3.setSucreMaxG(45.0);
        patient3.setCaloriesJour(1800);
        patient3.setDateDebut(LocalDate.now());
        patient3.setDateFin(null);
        patient3.setRaisonCalcul("Calculé selon poids (38kg) + âge (12 ans) + Tacrolimus + Prednisone actifs");
        patient3.setNotes(
                "📊 DONNÉES ANTHROPOMÉTRIQUES:\n" +
                        "- Poids: 38 kg\n" +
                        "- Taille: 148 cm\n" +
                        "- Périmètre crânien: 54 cm\n" +
                        "- IMC: 17.3 (normal)\n\n" +

                        "💊 TRAITEMENT IMMUNOSUPPRESSEUR TRIPLE:\n" +
                        "- Tacrolimus: 3mg matin + 3mg soir (0.16mg/kg/jour)\n" +
                        "- Prednisone: 5mg/jour (0.13mg/kg/jour)\n" +
                        "- Mycophenolate: 500mg 2x/jour\n" +
                        "- Début traitement: 14/02/2024\n\n" +

                        "🔬 DERNIERS BILANS (18/02/2026):\n" +
                        "- Potassium: 4.8 mmol/L [Normal: 3.5-5.0] ✓\n" +
                        "- Sodium: 142 mmol/L [Normal: 135-145] ✓\n" +
                        "- Phosphore: 1.3 mmol/L [Normal: 1.0-1.8] ✓\n" +
                        "- Créatinine: 58 µmol/L [Normal: 44-88] ✓\n" +
                        "- Urée: 5.1 mmol/L [Normal: 2.5-6.4] ✓\n" +
                        "- Tacrolimus sanguin: 12.3 ng/mL [Cible: 5-15] ✓\n" +
                        "- Glycémie: 6.8 mmol/L [Normal: 3.9-5.6] ⚠️ ÉLEVÉ (Prednisone)\n" +
                        "- HbA1c: 5.9% [Normal: <5.7%] ⚠️ Prédiabète\n" +
                        "- Hémoglobine: 125 g/L [Normal: 115-155] ✓\n" +
                        "- Leucocytes: 8.5 x10⁹/L [Normal: 4.5-13.5] ✓\n" +
                        "- GFR: 85 mL/min/1.73m² [Normal: >90] ⚠️ Légère baisse\n\n" +

                        "⚠️ RESTRICTIONS ACTIVES:\n" +
                        "- DIABÈTE CORTICOÏDE: Limiter sucres rapides\n" +
                        "- TACROLIMUS: Pamplemousse INTERDIT\n" +
                        "- PREDNISONE: Surveillance glycémie renforcée\n\n" +

                        "📅 SURVEILLANCE:\n" +
                        "- Bilan sanguin: 2x/semaine\n" +
                        "- Glycémie capillaire: Quotidienne\n" +
                        "- Pesée: 1x/semaine\n" +
                        "- Contrôle tension: Quotidien\n" +
                        "- Dosage Tacrolimus: Hebdomadaire"
        );
        besoinRepository.save(patient3);
    }

    // ═══════════════════ CRUD ═══════════════════

    public BesoinNutritionnelDTO createBesoin(BesoinNutritionnelDTO dto) {
        // Clôturer l'ancien besoin actif s'il existe
        Optional<BesoinNutritionnel> ancien = besoinRepository.findActiveByPatientId(dto.getPatientId());
        ancien.ifPresent(b -> {
            b.setDateFin(LocalDate.now());
            besoinRepository.save(b);
        });

        BesoinNutritionnel besoin = toEntity(dto);
        BesoinNutritionnel saved = besoinRepository.save(besoin);
        return toDTO(saved);
    }

    public BesoinNutritionnelDTO updateBesoin(Long id, BesoinNutritionnelDTO dto) {
        BesoinNutritionnel besoin = besoinRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Besoin non trouvé"));
        updateEntityFromDTO(besoin, dto);
        BesoinNutritionnel updated = besoinRepository.save(besoin);
        return toDTO(updated);
    }

    @Transactional(readOnly = true)
    public List<BesoinNutritionnelDTO> getAllBesoins() {
        return besoinRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BesoinNutritionnelDTO getBesoinById(Long id) {
        BesoinNutritionnel besoin = besoinRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Besoin non trouvé"));
        return toDTO(besoin);
    }

    @Transactional(readOnly = true)
    public BesoinNutritionnelDTO getActiveBesoinForPatient(Long patientId) {
        BesoinNutritionnel besoin = besoinRepository.findActiveByPatientId(patientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aucun besoin actif pour ce patient"));
        return toDTO(besoin);
    }

    @Transactional(readOnly = true)
    public List<BesoinNutritionnelDTO> getHistoryForPatient(Long patientId) {
        return besoinRepository.findByPatientIdOrderByDateDebutDesc(patientId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public void deleteBesoin(Long id) {
        if (!besoinRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Besoin non trouvé");
        }
        besoinRepository.deleteById(id);
    }

    // ═══════════════════ CONVERSIONS ═══════════════════

    private BesoinNutritionnelDTO toDTO(BesoinNutritionnel entity) {
        BesoinNutritionnelDTO dto = new BesoinNutritionnelDTO();
        dto.setId(entity.getId());
        dto.setPatientId(entity.getPatientId());
        dto.setPotassiumMaxMg(entity.getPotassiumMaxMg());
        dto.setSodiumMaxMg(entity.getSodiumMaxMg());
        dto.setPhosphoreMaxMg(entity.getPhosphoreMaxMg());
        dto.setProteinesMaxG(entity.getProteinesMaxG());
        dto.setSucreMaxG(entity.getSucreMaxG());
        dto.setCaloriesJour(entity.getCaloriesJour());
        dto.setPoidsKg(entity.getPoidsKg());
        dto.setAgeMois(entity.getAgeMois());
        dto.setTraitementTacrolimus(entity.getTraitementTacrolimus());
        dto.setTraitementPrednisone(entity.getTraitementPrednisone());
        dto.setRaisonCalcul(entity.getRaisonCalcul());
        dto.setDateDebut(entity.getDateDebut());
        dto.setDateFin(entity.getDateFin());
        dto.setNotes(entity.getNotes());
        return dto;
    }

    private BesoinNutritionnel toEntity(BesoinNutritionnelDTO dto) {
        BesoinNutritionnel entity = new BesoinNutritionnel();
        updateEntityFromDTO(entity, dto);
        return entity;
    }

    private void updateEntityFromDTO(BesoinNutritionnel entity, BesoinNutritionnelDTO dto) {
        entity.setPatientId(dto.getPatientId());
        entity.setPotassiumMaxMg(dto.getPotassiumMaxMg());
        entity.setSodiumMaxMg(dto.getSodiumMaxMg());
        entity.setPhosphoreMaxMg(dto.getPhosphoreMaxMg());
        entity.setProteinesMaxG(dto.getProteinesMaxG());
        entity.setSucreMaxG(dto.getSucreMaxG());
        entity.setCaloriesJour(dto.getCaloriesJour());
        entity.setPoidsKg(dto.getPoidsKg());
        entity.setAgeMois(dto.getAgeMois());
        entity.setTraitementTacrolimus(dto.getTraitementTacrolimus());
        entity.setTraitementPrednisone(dto.getTraitementPrednisone());
        entity.setRaisonCalcul(dto.getRaisonCalcul());
        entity.setDateDebut(dto.getDateDebut());
        entity.setDateFin(dto.getDateFin());
        entity.setNotes(dto.getNotes());
    }
}