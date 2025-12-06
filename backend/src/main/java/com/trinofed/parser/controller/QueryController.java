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
    /**
     * Cache results on-demand (called when user clicks "View Results" button)
     * This method is NO LONGER called automatically when queries complete
     */
    public void cacheResultsForQuery(String queryId, String query) {
        if (query == null || query.trim().isEmpty()) {
            log.warn("Cannot cache results - query text is empty for queryId: {}", queryId);
            return;
        }

        // Check if already cached - if so, no need to re-execute
        if (resultsCache.containsKey(queryId)) {
            log.info("Results already cached for queryId: {}, skipping re-execution", queryId);
            return;
        }

        log.info("Caching results for queryId: {} (user requested via View Results button)", queryId);

        try {
            // Execute query to get results (only happens when user explicitly requests it)
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
                log.error("Failed to cache results for queryId: {}", queryId);
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
            log.info("✓ Results cached for queryId: {} ({} rows)", queryId, rows.size());

        } catch (Exception e) {
            log.error("Error caching results for queryId: {}", queryId, e);
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
        log.info("View Results feature disabled - queryId: {}", queryId);

        // VIEW RESULTS FEATURE DISABLED
        // This feature has been disabled to prevent duplicate query entries in history.
        // Re-executing queries to fetch results causes them to appear as new queries with different IDs.

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", "View Results feature is disabled");
        errorResponse.put("queryId", queryId);
        errorResponse.put("reason", "This feature has been disabled to prevent duplicate query entries in history");
        errorResponse.put("suggestion", "Execute queries from the Trino interface to view results directly");

        return ResponseEntity.status(501).body(errorResponse); // 501 Not Implemented
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
