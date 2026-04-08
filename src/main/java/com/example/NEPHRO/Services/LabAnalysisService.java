package com.example.NEPHRO.Services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class LabAnalysisService {

    private final ObjectMapper objectMapper;

    @Value("${lab.analysis.python-exec:python}")
    private String pythonExec;

    @Value("${lab.analysis.script-path:../agent_analyse_labo.py}")
    private String scriptPath;

    @Value("${lab.analysis.timeout-seconds:45}")
    private long timeoutSeconds;

    /** Script extrait depuis le classpath (JAR) — réutilisé entre appels. */
    private volatile Path extractedClasspathScript;

    public Map<String, Object> analyze(Map<String, Object> payload) {
        Path script = resolveScriptPath();
        Path tmpDir = null;
        try {
            tmpDir = Files.createTempDirectory("lab-analysis-");
            Path inputPath = tmpDir.resolve("input.json");
            Path outputPath = tmpDir.resolve("output.json");
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(inputPath.toFile(), payload);

            IllegalStateException lastFailure = null;
            for (List<String> cmd : buildPythonCommands(script, inputPath, outputPath)) {
                try {
                    ProcessBuilder pb = new ProcessBuilder(cmd);
                    pb.redirectErrorStream(true);
                    Process process = pb.start();
                    boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
                    String processOutput = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

                    if (!finished) {
                        process.destroyForcibly();
                        lastFailure = new IllegalStateException(
                                "Timeout analyse labo Python après " + timeoutSeconds + "s (" + cmd.get(0) + ").");
                        continue;
                    }
                    if (process.exitValue() != 0) {
                        lastFailure = new IllegalStateException(
                                "Echec script Python (code " + process.exitValue() + ") [" + cmd.get(0) + "]: "
                                        + truncate(processOutput, 2000));
                        continue;
                    }
                    if (!Files.exists(outputPath)) {
                        lastFailure = new IllegalStateException(
                                "Pas de fichier de sortie après " + cmd.get(0) + ": " + truncate(processOutput, 1500));
                        continue;
                    }
                    return objectMapper.readValue(outputPath.toFile(), new TypeReference<>() {});
                } catch (IOException e) {
                    lastFailure = new IllegalStateException(
                            "Impossible d'exécuter Python (" + cmd.get(0) + "): " + e.getMessage(), e);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException("Analyse labo interrompue.", e);
                }
            }
            if (lastFailure != null) {
                throw lastFailure;
            }
            throw new IllegalStateException("Aucune commande Python n'a pu être exécutée.");
        } catch (IOException e) {
            throw new IllegalStateException("Erreur exécution analyse labo Python: " + e.getMessage(), e);
        } finally {
            if (tmpDir != null) {
                try {
                    Files.deleteIfExists(tmpDir.resolve("input.json"));
                    Files.deleteIfExists(tmpDir.resolve("output.json"));
                    Files.deleteIfExists(tmpDir);
                } catch (IOException ignored) {
                    // Nettoyage best-effort.
                }
            }
        }
    }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        String t = s.replace('\r', ' ').trim();
        return t.length() <= max ? t : t.substring(0, max) + "…";
    }

    /**
     * 1) Script embarqué dans le JAR ({@code classpath:lab/agent_analyse_labo.py}) — fiable en prod.
     * 2) Chemins configurés / répertoire de travail.
     */
    private Path resolveScriptPath() {
        try {
            Path fromClasspath = extractScriptFromClasspathIfPresent();
            if (fromClasspath != null) {
                return fromClasspath;
            }
        } catch (IOException e) {
            throw new IllegalStateException("Impossible d'extraire le script Python depuis le classpath.", e);
        }

        Path configured = Paths.get(scriptPath);
        if (configured.isAbsolute() && Files.exists(configured)) {
            return configured.normalize();
        }

        Path cwd = Paths.get("").toAbsolutePath();
        Path[] candidates = new Path[] {
                cwd.resolve(scriptPath),
                cwd.getParent() != null ? cwd.getParent().resolve(scriptPath) : null,
                cwd.resolve("..").resolve(scriptPath),
                cwd.resolve("..").resolve("..").resolve(scriptPath),
        };
        for (Path candidate : candidates) {
            if (candidate != null && Files.exists(candidate.normalize())) {
                return candidate.normalize();
            }
        }

        throw new IllegalStateException(
                "Script Python introuvable. Définissez lab.analysis.script-path ou vérifiez lab/agent_analyse_labo.py dans le JAR.");
    }

    private Path extractScriptFromClasspathIfPresent() throws IOException {
        if (extractedClasspathScript != null && Files.exists(extractedClasspathScript)) {
            return extractedClasspathScript;
        }
        synchronized (this) {
            if (extractedClasspathScript != null && Files.exists(extractedClasspathScript)) {
                return extractedClasspathScript;
            }
            ClassPathResource res = new ClassPathResource("lab/agent_analyse_labo.py");
            if (!res.exists()) {
                return null;
            }
            Path dir = Files.createDirectories(Paths.get(System.getProperty("java.io.tmpdir"), "nephro-lab-agent"));
            Path out = dir.resolve("agent_analyse_labo.py");
            try (InputStream in = res.getInputStream()) {
                Files.copy(in, out, StandardCopyOption.REPLACE_EXISTING);
            }
            extractedClasspathScript = out;
            return out;
        }
    }

    private List<List<String>> buildPythonCommands(Path script, Path inputPath, Path outputPath) {
        String in = inputPath.toAbsolutePath().toString();
        String out = outputPath.toAbsolutePath().toString();
        String sc = script.toAbsolutePath().toString();
        List<List<String>> cmds = new ArrayList<>();

        cmds.add(List.of(pythonExec, sc, "--input", in, "--output", out));

        boolean win = System.getProperty("os.name", "").toLowerCase().contains("win");
        if (win) {
            if (!"py".equalsIgnoreCase(pythonExec)) {
                cmds.add(List.of("py", "-3", sc, "--input", in, "--output", out));
            }
            if (!"python".equalsIgnoreCase(pythonExec)) {
                cmds.add(List.of("python", sc, "--input", in, "--output", out));
            }
        }
        if (!"python3".equalsIgnoreCase(pythonExec)) {
            cmds.add(List.of("python3", sc, "--input", in, "--output", out));
        }
        if (!"python".equalsIgnoreCase(pythonExec) && !win) {
            cmds.add(List.of("python", sc, "--input", in, "--output", out));
        }
        return cmds;
    }
}
