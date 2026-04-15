package com.example.NEPHRO.Services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.util.ByteArrayDataSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.mail.from-name}")
    private String fromName;

    @Value("${notification.suivi.patient.actif:true}")
    private boolean notificationActive;

    /**
     * Appelé par SuiviService après création d'un suivi.
     * Envoie un email HTML au patient de manière asynchrone.
     * Si cheminPieceJointe est renseigné (ex: uploads/suivis/xxx.pdf), le fichier est joint à l'email.
     */
    @Async
    public void envoyerSuiviAjouteAuPatient(String toEmail,
                                            String patientName,
                                            Long idDossier,
                                            String dateSuivi,
                                            String resultat,
                                            String notes,
                                            String cheminPieceJointe) {
        if (!notificationActive) {
            log.info("Notifications désactivées — email non envoyé à {}", toEmail);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject("📋 Nouveau suivi médical — KidneyCare");
            helper.setText(buildEmailHtml(patientName, idDossier, dateSuivi, resultat, notes, cheminPieceJointe), true);

            // Joindre le PDF ou l'image si présent
            if (cheminPieceJointe != null && !cheminPieceJointe.isBlank()) {
                Path filePath = Paths.get(cheminPieceJointe).toAbsolutePath().normalize();
                if (Files.isRegularFile(filePath)) {
                    String attachmentName = filePath.getFileName().toString();
                    helper.addAttachment(attachmentName, new FileSystemResource(filePath.toFile()));
                    log.info("📎 Pièce jointe ajoutée à l'email : {}", attachmentName);
                } else {
                    log.warn("Fichier pièce jointe introuvable : {}", filePath);
                }
            }

            mailSender.send(message);
            log.info("✅ Email suivi envoyé à {} (dossier #{})", toEmail, idDossier);

        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("❌ Échec envoi email à {} : {}", toEmail, e.getMessage());
        }
    }

    /**
     * Notifie le patient qu’un rapport de bilan a été rédigé par son médecin (module labo).
     */
    @Async
    public void envoyerRapportBilanAuPatient(String toEmail,
                                             String patientName,
                                             Long dossierId,
                                             Long rapportId,
                                             LocalDate periodeDebut,
                                             LocalDate periodeFin,
                                             String commentaireMedecin,
                                             String signatureDataUrl) {
        if (!notificationActive) {
            log.info("Notifications désactivées — email rapport non envoyé à {}", toEmail);
            return;
        }
        try {
            byte[] signaturePng = null;
            try {
                signaturePng = decodeSignaturePng(signatureDataUrl);
            } catch (IllegalArgumentException ex) {
                log.warn("Signature rapport : base64 invalide — {}", ex.getMessage());
            }
            boolean inlineSig = signaturePng != null && signaturePng.length > 0;

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Nouveau rapport de laboratoire — KidneyCare");

            String htmlBody = buildRapportBilanEmailHtml(
                    patientName,
                    dossierId,
                    rapportId,
                    periodeDebut,
                    periodeFin,
                    commentaireMedecin,
                    inlineSig
            );
            String plainBody = buildRapportBilanEmailPlain(
                    patientName,
                    dossierId,
                    rapportId,
                    periodeDebut,
                    periodeFin,
                    commentaireMedecin,
                    inlineSig
            );
            /*
             * Important : setText (HTML + texte brut) AVANT addInline.
             * L’inverse casse souvent la structure MIME (corps vide dans Gmail / Outlook).
             */
            helper.setText(plainBody, htmlBody);

            if (inlineSig) {
                ByteArrayDataSource sigDs = new ByteArrayDataSource(signaturePng, "image/png");
                sigDs.setName("signature-medecin.png");
                helper.addInline("rapportSignature", sigDs);
                helper.addAttachment("signature-medecin.png", new ByteArrayResource(signaturePng));
            }

            mailSender.send(message);
            log.info("✅ Email rapport bilan envoyé à {} (rapport #{}, inline={}, pj={})",
                    toEmail, rapportId, inlineSig, inlineSig);
        } catch (Exception e) {
            log.error("❌ Échec envoi email rapport à {} : {}", toEmail, e.getMessage(), e);
        }
    }

    /** Extrait les octets PNG depuis une data URL ou base64 brut ; null si absent ou invalide. */
    private static byte[] decodeSignaturePng(String signatureDataUrl) {
        if (signatureDataUrl == null) {
            return null;
        }
        String s = signatureDataUrl.trim();
        if (s.isBlank()) return null;

        // Cas 1: data URL "data:image/png;base64,AAAA..."
        if (s.startsWith("data:image")) {
            int comma = s.indexOf(',');
            if (comma < 0 || comma >= s.length() - 1) return null;
            s = s.substring(comma + 1).trim();
        }

        // Cas 2: base64 brut (sans préfixe data URL)
        // (Certains fronts envoient uniquement les octets base64.)
        try {
            return Base64.getMimeDecoder().decode(s);
        } catch (IllegalArgumentException ignored) {
            // Support base64 sans sauts de lignes / avec espaces
            return Base64.getDecoder().decode(s.replaceAll("\\s+", ""));
        }
    }

    private static String buildRapportBilanEmailPlain(String patientName,
                                                      Long dossierId,
                                                      Long rapportId,
                                                      LocalDate periodeDebut,
                                                      LocalDate periodeFin,
                                                      String commentaireMedecin,
                                                      boolean hasSignatureImage) {
        String nom = patientName != null ? patientName : "Patient";
        StringBuilder sb = new StringBuilder();
        sb.append("Bonjour ").append(nom).append(",\n\n");
        sb.append("Votre médecin a enregistré un rapport de bilan dans KidneyCare.\n\n");
        sb.append("Dossier médical : #").append(dossierId != null ? dossierId : "—").append('\n');
        sb.append("Référence rapport : #").append(rapportId != null ? rapportId : "—").append('\n');
        if (periodeDebut != null && periodeFin != null) {
            sb.append("Période couverte : ").append(periodeDebut).append(" -> ").append(periodeFin).append('\n');
        }
        sb.append("\n--- Commentaire du médecin ---\n");
        if (commentaireMedecin != null && !commentaireMedecin.isBlank()) {
            sb.append(commentaireMedecin.trim()).append('\n');
        } else {
            sb.append("(aucun commentaire texte)\n");
        }
        sb.append('\n');
        if (hasSignatureImage) {
            sb.append("La signature est en image jointe (signature-medecin.png) et affichée dans la version HTML de ce message.\n");
        } else {
            sb.append("Une signature numérique a été enregistrée dans l'application.\n");
        }
        sb.append("\n---\nMessage automatique — merci de ne pas répondre directement à cet e-mail.\n");
        return sb.toString();
    }

    private String buildRapportBilanEmailHtml(String patientName,
                                              Long dossierId,
                                              Long rapportId,
                                              LocalDate periodeDebut,
                                              LocalDate periodeFin,
                                              String commentaireMedecin,
                                              boolean inlineSignatureImage) {
        String periode = (periodeDebut != null && periodeFin != null)
                ? HtmlUtils.htmlEscape(periodeDebut.toString() + " → " + periodeFin.toString())
                : "—";
        String commentHtml = (commentaireMedecin != null && !commentaireMedecin.isBlank())
                ? "<p style='margin:0;color:#2d3748;font-size:14px;line-height:1.7;white-space:pre-wrap;'>"
                + HtmlUtils.htmlEscape(commentaireMedecin) + "</p>"
                : "<p style='margin:0;color:#a0aec0;font-size:14px;'><em>Aucun commentaire texte.</em></p>";
        String sigBlock;
        if (inlineSignatureImage) {
            sigBlock = """
                    <p style="margin:16px 0 4px;color:#718096;font-size:12px;text-transform:uppercase;letter-spacing:1px;">
                      Signature du médecin
                    </p>
                    <img src="cid:rapportSignature" alt="Signature" style="max-width:280px;height:auto;border:1px solid #e2e8f0;border-radius:8px;background:#fff;"/>
                    """;
        } else {
            sigBlock = "<p style='margin-top:12px;color:#718096;font-size:13px;'>Une signature numérique a été enregistrée dans votre dossier.</p>";
        }
        return """
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
            <body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 16px;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;">
                    <tr>
                      <td style="background:linear-gradient(135deg,#0d9488 0%%,#0f766e 100%%);padding:28px 32px;text-align:center;">
                        <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">KidneyCare</h1>
                        <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Nouveau rapport de laboratoire</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:28px 32px;">
                        <p style="margin:0 0 12px;color:#2d3748;font-size:17px;font-weight:600;">Bonjour %s,</p>
                        <p style="margin:0 0 20px;color:#4a5568;font-size:15px;line-height:1.6;">
                          Votre médecin a enregistré un <strong>rapport de bilan</strong> lié à votre dossier. Vous pouvez le consulter dans l’application KidneyCare.
                        </p>
                        <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f7fafc;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:16px;">
                          <tr><td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                            <span style="color:#718096;font-size:12px;text-transform:uppercase;">Dossier</span><br/>
                            <strong style="color:#2d3748;">#%d</strong>
                          </td></tr>
                          <tr><td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                            <span style="color:#718096;font-size:12px;text-transform:uppercase;">Référence rapport</span><br/>
                            <strong style="color:#2d3748;">#%d</strong>
                          </td></tr>
                          <tr><td style="padding:16px 20px;">
                            <span style="color:#718096;font-size:12px;text-transform:uppercase;">Période couverte</span><br/>
                            <strong style="color:#2d3748;">%s</strong>
                          </td></tr>
                        </table>
                        <p style="margin:0 0 8px;color:#718096;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Commentaire du médecin</p>
                        %s
                        %s
                        <p style="margin:24px 0 0;color:#744210;font-size:13px;line-height:1.6;background:#fffbeb;border-left:4px solid #f6ad55;padding:12px 16px;border-radius:0 8px 8px 0;">
                          En cas de question, contactez votre équipe soignante.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#f7fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
                        <p style="margin:0;color:#a0aec0;font-size:12px;">Message automatique — merci de ne pas répondre directement à cet email.</p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(
                HtmlUtils.htmlEscape(patientName != null ? patientName : "Patient"),
                dossierId != null ? dossierId : 0,
                rapportId != null ? rapportId : 0,
                periode,
                commentHtml,
                sigBlock
        );
    }

    private String buildEmailHtml(String patientName,
                                  Long idDossier,
                                  String dateSuivi,
                                  String resultat,
                                  String notes,
                                  String cheminPieceJointe) {

        // Couleur badge selon résultat
        String badgeColor = switch (resultat != null ? resultat.toUpperCase() : "") {
            case "STABLE"     -> "#38a169"; // vert
            case "AMELIORE"   -> "#3182ce"; // bleu
            case "DETERIORE"  -> "#e53e3e"; // rouge
            default           -> "#718096"; // gris
        };

        String resultatLabel = switch (resultat != null ? resultat.toUpperCase() : "") {
            case "STABLE"     -> "✅ Stable";
            case "AMELIORE"   -> "📈 Amélioré";
            case "DETERIORE"  -> "⚠️ Détérioré";
            default           -> resultat != null ? resultat : "Non renseigné";
        };

        String notesHtml = (notes != null && !notes.isBlank())
                ? notes
                : "<em style='color:#a0aec0;'>Aucune note ajoutée</em>";

        String pieceJointeHtml = (cheminPieceJointe != null && !cheminPieceJointe.isBlank())
                ? "<p style='margin-top:12px;color:#3182ce;font-size:13px;'>📎 Une pièce jointe (PDF ou image) est incluse dans cet email.</p>"
                : "";

        return """
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8"/>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            </head>
            <body style="margin:0;padding:0;background:#f0f4f8;
                         font-family:'Segoe UI',Arial,sans-serif;">

              <table width="100%%" cellpadding="0" cellspacing="0"
                     style="background:#f0f4f8;padding:40px 20px;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0"
                         style="background:#ffffff;border-radius:16px;overflow:hidden;
                                box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;">

                    <!-- ══ HEADER ══ -->
                    <tr>
                      <td style="background:linear-gradient(135deg,#667eea 0%%,#764ba2 100%%);
                                 padding:36px 40px;text-align:center;">
                        <div style="font-size:48px;margin-bottom:8px;">🫘</div>
                        <h1 style="margin:0;color:#ffffff;font-size:26px;
                                   font-weight:700;letter-spacing:1px;">KidneyCare</h1>
                        <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
                            Système de Suivi Néphrologique
                        </p>
                      </td>
                    </tr>

                    <!-- ══ BADGE ══ -->
                    <tr>
                      <td style="padding:28px 40px 0;text-align:center;">
                        <span style="display:inline-block;background:#ebf4ff;color:#3182ce;
                                     padding:8px 22px;border-radius:50px;font-size:13px;
                                     font-weight:600;border:1px solid #bee3f8;">
                          📋 Nouveau suivi médical enregistré
                        </span>
                      </td>
                    </tr>

                    <!-- ══ BODY ══ -->
                    <tr>
                      <td style="padding:28px 40px;">
                        <p style="margin:0 0 8px;color:#2d3748;font-size:17px;font-weight:600;">
                          Bonjour %s,
                        </p>
                        <p style="margin:0 0 24px;color:#4a5568;font-size:15px;line-height:1.6;">
                          Votre médecin a enregistré un nouveau suivi médical vous concernant.
                          Voici le récapitulatif :
                        </p>

                        <!-- CARD INFOS -->
                        <table width="100%%" cellpadding="0" cellspacing="0"
                               style="background:#f7fafc;border-radius:12px;
                                      border:1px solid #e2e8f0;margin-bottom:24px;">
                          <tr>
                            <td style="padding:0;">

                              <!-- Dossier -->
                              <table width="100%%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="padding:16px 24px;border-bottom:1px solid #e2e8f0;">
                                    <span style="color:#718096;font-size:12px;
                                                 text-transform:uppercase;letter-spacing:1px;">
                                      Dossier médical
                                    </span><br/>
                                    <strong style="color:#2d3748;font-size:15px;">
                                      #%d
                                    </strong>
                                  </td>
                                </tr>

                                <!-- Date -->
                                <tr>
                                  <td style="padding:16px 24px;border-bottom:1px solid #e2e8f0;">
                                    <span style="color:#718096;font-size:12px;
                                                 text-transform:uppercase;letter-spacing:1px;">
                                      Date du suivi
                                    </span><br/>
                                    <strong style="color:#2d3748;font-size:15px;">
                                      📅 %s
                                    </strong>
                                  </td>
                                </tr>

                                <!-- Résultat -->
                                <tr>
                                  <td style="padding:16px 24px;border-bottom:1px solid #e2e8f0;">
                                    <span style="color:#718096;font-size:12px;
                                                 text-transform:uppercase;letter-spacing:1px;">
                                      État / Résultat
                                    </span><br/>
                                    <span style="display:inline-block;margin-top:6px;
                                                 padding:4px 14px;border-radius:50px;
                                                 background:%s;color:#fff;
                                                 font-size:13px;font-weight:600;">
                                      %s
                                    </span>
                                  </td>
                                </tr>

                                <!-- Notes -->
                                <tr>
                                  <td style="padding:16px 24px;">
                                    <span style="color:#718096;font-size:12px;
                                                 text-transform:uppercase;letter-spacing:1px;">
                                      Notes du médecin
                                    </span><br/>
                                    <span style="color:#4a5568;font-size:14px;
                                                 line-height:1.7;display:block;margin-top:6px;">
                                      %s
                                    </span>
                                    %s
                                  </td>
                                </tr>
                              </table>

                            </td>
                          </tr>
                        </table>

                        <!-- ALERTE -->
                        <table width="100%%" cellpadding="0" cellspacing="0"
                               style="background:#fffbeb;border-left:4px solid #f6ad55;
                                      border-radius:0 8px 8px 0;margin-bottom:8px;">
                          <tr>
                            <td style="padding:14px 18px;color:#744210;
                                       font-size:13px;line-height:1.6;">
                              ⚠️ Si vous avez des questions concernant ce suivi,
                              contactez directement votre médecin ou l'établissement médical.
                            </td>
                          </tr>
                        </table>

                      </td>
                    </tr>

                    <!-- ══ FOOTER ══ -->
                    <tr>
                      <td style="background:#f7fafc;border-top:1px solid #e2e8f0;
                                 padding:24px 40px;text-align:center;">
                        <p style="margin:0;color:#a0aec0;font-size:12px;line-height:1.6;">
                          Cet email est généré automatiquement par KidneyCare.<br/>
                          Merci de ne pas y répondre directement.
                        </p>
                        <p style="margin:12px 0 0;color:#cbd5e0;font-size:11px;">
                          © 2025 KidneyCare — Système de Suivi Néphrologique
                        </p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(
                patientName,
                idDossier,
                dateSuivi,
                badgeColor,
                resultatLabel,
                notesHtml,
                pieceJointeHtml
        );
    }
}