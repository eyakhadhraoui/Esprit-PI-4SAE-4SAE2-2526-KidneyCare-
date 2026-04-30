package com.example.NEPHRO.Services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnthropicService {

    private final ObjectMapper objectMapper;

    @Value("${anthropic.api.key:}")
    private String apiKey;

    @Value("${anthropic.api.url:https://api.anthropic.com/v1/messages}")
    private String apiUrl;

    @Value("${anthropic.model:claude-3-5-sonnet-latest}")
    private String model;

    @Value("${anthropic.max-tokens:900}")
    private int maxTokens;

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean isConfigured() {
        return apiKey != null && !apiKey.trim().isEmpty();
    }

    /**
     * Génère une conclusion clinique (informatif) à partir de l'analyse structurée (rows/status/ref).
     * Retourne un texte en français.
     */
    public String generateConclusionFromAnalysis(Map<String, Object> analysis) {
        if (!isConfigured()) {
            throw new IllegalStateException("Anthropic non configuré (anthropic.api.key manquante).");
        }
        String prompt = buildPromptFromAnalysis(analysis);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);
        headers.set("anthropic-version", "2023-06-01");

        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("max_tokens", maxTokens);
        body.put("messages", List.of(message));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, request, String.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new IllegalStateException("Erreur Anthropic: HTTP " + response.getStatusCode());
        }

        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode content = root.get("content");
            if (content != null && content.isArray() && content.size() > 0) {
                JsonNode first = content.get(0);
                JsonNode text = first.get("text");
                if (text != null) return text.asText();
            }
            throw new IllegalStateException("Réponse Anthropic inattendue: champ content/text absent.");
        } catch (Exception e) {
            throw new IllegalStateException("Impossible de parser la réponse Anthropic.", e);
        }
    }

    private String buildPromptFromAnalysis(Map<String, Object> analysis) {
        // On envoie un résumé + toutes les lignes structurées afin de couvrir *tous* les tests.
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

