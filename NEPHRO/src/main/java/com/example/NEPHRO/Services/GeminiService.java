package com.example.NEPHRO.Services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Google Gemini (AI Studio) — génération de texte via REST.
 * Doc officielle : https://ai.google.dev/gemini-api/docs
 */
@Service
@RequiredArgsConstructor
public class GeminiService {

    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:}")
    private String apiKey;

    /** Base URL sans le suffixe :generateContent (ex. https://generativelanguage.googleapis.com/v1beta) */
    @Value("${gemini.api.base-url:https://generativelanguage.googleapis.com/v1beta}")
    private String baseUrl;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String model;

    @Value("${gemini.max-output-tokens:1400}")
    private int maxOutputTokens;

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean isConfigured() {
        return apiKey != null && !apiKey.trim().isEmpty();
    }

    public String generateConclusionFromAnalysis(Map<String, Object> analysis) {
        if (!isConfigured()) {
            throw new IllegalStateException("Gemini non configuré (gemini.api.key manquante).");
        }
        String prompt = buildPromptFromAnalysis(analysis);

        String url = UriComponentsBuilder
                .fromHttpUrl(baseUrl + "/models/" + model + ":generateContent")
                .queryParam("key", apiKey)
                .build()
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> userPart = new HashMap<>();
        userPart.put("text", prompt);

        Map<String, Object> userContent = new HashMap<>();
        userContent.put("role", "user");
        userContent.put("parts", List.of(userPart));

        Map<String, Object> body = new HashMap<>();
        body.put("contents", List.of(userContent));

        Map<String, Object> genCfg = new HashMap<>();
        genCfg.put("maxOutputTokens", maxOutputTokens);
        body.put("generationConfig", genCfg);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new IllegalStateException("Erreur Gemini: HTTP " + response.getStatusCode());
        }

        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode candidates = root.get("candidates");
            if (candidates != null && candidates.isArray() && candidates.size() > 0) {
                JsonNode content = candidates.get(0).get("content");
                if (content != null) {
                    JsonNode parts = content.get("parts");
                    if (parts != null && parts.isArray() && parts.size() > 0) {
                        JsonNode text = parts.get(0).get("text");
                        if (text != null) return text.asText();
                    }
                }
            }
            throw new IllegalStateException("Réponse Gemini inattendue: structure candidates/content/parts/text absente.");
        } catch (Exception e) {
            throw new IllegalStateException("Impossible de parser la réponse Gemini.", e);
        }
    }

    private String buildPromptFromAnalysis(Map<String, Object> analysis) {
        String patientBlock = "";
        Object patientObj = analysis.get("patient");
        if (patientObj != null) {
            patientBlock = "Patient (si fourni): " + patientObj + "\n";
        }

        String rowsBlock = "";
        Object rowsObj = analysis.get("rows");
        if (rowsObj != null) {
            rowsBlock = "Rows (analyses): " + rowsObj + "\n";
        }

        String valuesBlock = "";
        Object submitted = analysis.get("submitted_values");
        if (submitted != null) {
            valuesBlock = "Valeurs saisies (toutes clés, y compris hors grille automatique): " + submitted + "\n";
        }

        String risk = String.valueOf(analysis.getOrDefault("risk_level", ""));

        String analysisContext = "";
        Object analysisText = analysis.get("analysis_text");
        if (analysisText != null) {
            String at = String.valueOf(analysisText);
            if (at.length() > 2800) {
                at = at.substring(0, 2800) + "\n[…tronqué]";
            }
            analysisContext = "Synthèse lignes à lignes (agent): \n" + at + "\n";
        }

        return """
Tu es un biologiste medical senior. Redige une CONCLUSION PROFESSIONNELLE destinee aux MEDECINS PRESCRIPTEURS (ton sec, factuel, sans langage grand public).

Structure obligatoire (titres courts en ligne, pas de puces JSON):
1) SYNTHESE — Preciser si le bilan est globalement dans les limites de reference ou s'il comporte des anomalies significatives (score de risque heuristique de l'agent: %s).
2) PARAMETRES — Pour chaque examen pertinent (rows + valeurs saisies): libelle, valeur, unite si connue, statut explicite NORMAL / BAS / ELEVE vs reference si disponible; sinon « interpretation qualitative a confirmer ». Ne pas inventer de valeurs.
3) INTERPRETATION CLINIQUE — Hypotheses courtes UNIQUEMENT pour les parametres hors normes ou incoherents.
4) CONDUITE A TENIR — Examens complementaires; toute piste therapeutique: « a adapter au contexte clinique et a discuter en consultation » (aucune prescription directe).
5) CLOTURE — Correlation avec antecedents, traitements, examen clinique et suivi.

Style: francais medical correct, phrases completes, vouvoiement implicite (compte-rendu), pas de marketing.
Sortie: rediger le texte final en francais avec accents (é, è, à, etc.), registre professionnel a l'usage des medecins.

Donnees fournies:
Niveau de risque (heuristique agent): %s
%s%s%s%s
""".formatted(risk, risk, patientBlock, rowsBlock, valuesBlock, analysisContext);
    }
}
