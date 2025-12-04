package com.trinofed.parser.controller;

import com.trinofed.parser.model.QueryTree;
import com.trinofed.parser.service.QueryEventService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@RestController
@RequestMapping("/api/queries")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:5173",
        "http://[::1]:5173"
})
public class QueryController {

    private final QueryEventService queryEventService;

    // Cache to store query results by queryId
    private final Map<String, Map<String, Object>> resultsCache = new java.util.concurrent.ConcurrentHashMap<>();

    // Track which QUERY TEXTS have been auto-cached to prevent infinite loops
    // Key is the query text (normalized), value is timestamp of last auto-cache
    private final Map<String, Long> processedQueryTexts = new java.util.concurrent.ConcurrentHashMap<>();

    // Minimum time (in milliseconds) between auto-caching the same query text
    private static final long MIN_CACHE_INTERVAL_MS = 3000; // 3 seconds

    @Autowired
    public QueryController(QueryEventService queryEventService) {
        this.queryEventService = queryEventService;
    }

    /**
     * Automatically cache results for a query (called when query completes in Kafka)
     * This ensures results are available before user clicks the button
     */
    public void cacheResultsForQuery(String queryId, String query) {
        if (query == null || query.trim().isEmpty()) {
            log.warn("Cannot cache results - query text is empty for queryId: {}", queryId);
            return;
        }

        // Normalize query text (trim and lowercase for comparison)
        String normalizedQuery = query.trim().toLowerCase();

        // CRITICAL GUARD: Check if this query TEXT was recently auto-cached (within 3 seconds)
        long currentTime = System.currentTimeMillis();
        if (processedQueryTexts.containsKey(normalizedQuery)) {
            long lastCacheTime = processedQueryTexts.get(normalizedQuery);
            long timeSinceLastCache = currentTime - lastCacheTime;

            if (timeSinceLastCache < MIN_CACHE_INTERVAL_MS) {
                // This is likely from auto-caching execution (infinite loop prevention)
                log.debug("Query text was cached {}ms ago, skipping (likely auto-cache execution): {}", timeSinceLastCache, queryId);
                return;
            } else {
                // This is a NEW user execution (enough time has passed)
                log.info("Query text was cached {}ms ago, this is a NEW execution: {}", timeSinceLastCache, queryId);
            }
        }

        // Mark this query text as processed with current timestamp
        processedQueryTexts.put(normalizedQuery, currentTime);
        log.info("Auto-caching results for queryId: {} at time {}", queryId, currentTime);

        try {
            ProcessBuilder pb = new ProcessBuilder(
                "docker", "exec", "trino", "trino",
                "--execute", query,
                "--output-format", "CSV_HEADER"
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }

            int exitCode = process.waitFor();
            String outputStr = output.toString();

            if (exitCode != 0) {
                log.error("Failed to auto-cache results for queryId: {} - execution failed: {}", queryId, outputStr);
                return;
            }

            // Parse CSV output
            String[] lines = outputStr.split("\n");
            List<String> columns = null;
            List<String[]> rows = new ArrayList<>();

            for (String csvLine : lines) {
                csvLine = csvLine.trim();
                if (csvLine.isEmpty() || csvLine.startsWith("WARNING:")) {
                    continue;
                }

                String[] parts = csvLine.replaceAll("\"", "").split(",");

                if (columns == null) {
                    columns = Arrays.asList(parts);
                } else {
                    rows.add(parts);
                }
            }

            if (columns == null) {
                columns = new ArrayList<>();
            }

            Map<String, Object> response = new HashMap<>();
            response.put("columns", columns);
            response.put("data", rows);
            response.put("queryId", queryId);
            response.put("cached", true);

            resultsCache.put(queryId, response);
            log.info("✓ Results auto-cached for queryId: {} ({} rows)", queryId, rows.size());

        } catch (Exception e) {
            log.error("Error auto-caching results for queryId: {}", queryId, e);
        }
    }

    @GetMapping
    public ResponseEntity<List<QueryTree>> getAllQueries() {
        log.info("Fetching all query trees");
        List<QueryTree> trees = queryEventService.getAllQueryTrees();
        return ResponseEntity.ok(trees);
    }

    @GetMapping("/{queryId}")
    public ResponseEntity<QueryTree> getQueryById(@PathVariable String queryId) {
        log.info("Fetching query tree for queryId: {}", queryId);
        QueryTree tree = queryEventService.getQueryTree(queryId);

        if (tree == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(tree);
    }

    @GetMapping("/ids")
    public ResponseEntity<List<String>> getAllQueryIds() {
        log.info("Fetching all query IDs");
        List<String> queryIds = queryEventService.getAllQueryIds();
        return ResponseEntity.ok(queryIds);
    }

    @GetMapping("/{queryId}/results")
    public ResponseEntity<Map<String, Object>> getQueryResults(@PathVariable String queryId) {
        log.info("Fetching cached results for queryId: {}", queryId);

        // Check if this queryId has cached results
        if (resultsCache.containsKey(queryId)) {
            log.info("✓ Returning cached results for queryId: {} (NO execution)", queryId);
            return ResponseEntity.ok(resultsCache.get(queryId));
        }

        // If not found, try to find results by query text (for auto-cache executions)
        QueryTree tree = queryEventService.getQueryTree(queryId);
        if (tree != null && tree.getQuery() != null) {
            String normalizedQuery = tree.getQuery().trim().toLowerCase();

            // Search for ANY queryId with the same query text that has cached results
            for (Map.Entry<String, Map<String, Object>> entry : resultsCache.entrySet()) {
                String cachedQueryId = entry.getKey();
                QueryTree cachedTree = queryEventService.getQueryTree(cachedQueryId);

                if (cachedTree != null && cachedTree.getQuery() != null) {
                    String cachedNormalizedQuery = cachedTree.getQuery().trim().toLowerCase();

                    if (normalizedQuery.equals(cachedNormalizedQuery)) {
                        log.info("✓ Found cached results for same query text, using queryId: {}", cachedQueryId);
                        return ResponseEntity.ok(entry.getValue());
                    }
                }
            }
        }

        // Results not cached
        log.warn("Results not available for queryId: {} - may still be processing or query hasn't completed yet", queryId);

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", "Query results are not yet available. Please wait a moment for the query to complete and results to be cached.");
        errorResponse.put("queryId", queryId);
        errorResponse.put("suggestion", "Results are automatically cached when the query completes. Try refreshing in a few seconds.");

        return ResponseEntity.status(404).body(errorResponse);
    }

    @PostMapping("/execute")
    public ResponseEntity<Map<String, Object>> executeQuery(@RequestBody Map<String, String> request) {
        String query = request.get("query");
        log.info("Executing query: {}", query);

        if (query == null || query.trim().isEmpty()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Query is required");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        try {
            // Execute query using docker exec
            ProcessBuilder pb = new ProcessBuilder(
                "docker", "exec", "trino", "trino",
                "--execute", query,
                "--output-format", "JSON"
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // Read output
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }

            int exitCode = process.waitFor();
            String outputStr = output.toString();

            if (exitCode != 0) {
                // Extract error message from output
                String errorMsg = outputStr;
                if (outputStr.contains("Error:")) {
                    errorMsg = outputStr.substring(outputStr.indexOf("Error:"));
                }

                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Query execution failed: " + errorMsg);
                return ResponseEntity.status(500).body(errorResponse);
            }

            // Parse JSON output from Trino
            List<String[]> rows = new ArrayList<>();
            List<String> columns = null;

            // Split output into lines and parse JSON
            String[] lines = outputStr.split("\n");
            for (String jsonLine : lines) {
                jsonLine = jsonLine.trim();
                if (jsonLine.isEmpty() || jsonLine.startsWith("WARNING:")) {
                    continue;
                }

                try {
                    // Parse JSON line - Trino outputs one JSON object per row
                    if (jsonLine.startsWith("{") && jsonLine.endsWith("}")) {
                        // Remove braces and split by comma
                        String content = jsonLine.substring(1, jsonLine.length() - 1);

                        // Extract column names and values
                        if (columns == null) {
                            columns = new ArrayList<>();
                            Pattern pattern = Pattern.compile("\"([^\"]+)\":");
                            Matcher matcher = pattern.matcher(content);
                            while (matcher.find()) {
                                columns.add(matcher.group(1));
                            }
                        }

                        // Extract values
                        List<String> values = new ArrayList<>();
                        Pattern valuePattern = Pattern.compile(":\"([^\"]*)\"");
                        Matcher valueMatcher = valuePattern.matcher(content);
                        while (valueMatcher.find()) {
                            values.add(valueMatcher.group(1));
                        }

                        if (!values.isEmpty()) {
                            rows.add(values.toArray(new String[0]));
                        }
                    }
                } catch (Exception e) {
                    log.warn("Failed to parse JSON line: {}", jsonLine, e);
                }
            }

            // If JSON parsing failed, try CSV format
            if (columns == null || rows.isEmpty()) {
                return executeQueryCSV(query);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("columns", columns);
            response.put("data", rows);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error executing query", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to execute query: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    private ResponseEntity<Map<String, Object>> executeQueryCSV(String query) {
        try {
            // Execute query using docker exec with CSV output
            ProcessBuilder pb = new ProcessBuilder(
                "docker", "exec", "trino", "trino",
                "--execute", query,
                "--output-format", "CSV_HEADER"
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // Read output
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }

            int exitCode = process.waitFor();
            String outputStr = output.toString();

            if (exitCode != 0) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Query execution failed: " + outputStr);
                return ResponseEntity.status(500).body(errorResponse);
            }

            // Parse CSV output
            String[] lines = outputStr.split("\n");
            List<String> columns = null;
            List<String[]> rows = new ArrayList<>();

            for (int i = 0; i < lines.length; i++) {
                String csvLine = lines[i].trim();
                if (csvLine.isEmpty() || csvLine.startsWith("WARNING:")) {
                    continue;
                }

                // Remove quotes and split by comma
                String[] parts = csvLine.replaceAll("\"", "").split(",");

                if (columns == null) {
                    // First line is header
                    columns = Arrays.asList(parts);
                } else {
                    rows.add(parts);
                }
            }

            if (columns == null) {
                columns = new ArrayList<>();
            }

            Map<String, Object> response = new HashMap<>();
            response.put("columns", columns);
            response.put("data", rows);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error executing query with CSV format", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to execute query: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}
