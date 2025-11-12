package com.trinofed.parser.controller;

import com.trinofed.parser.model.AIAnalysisRequest;
import com.trinofed.parser.model.AIAnalysisResponse;
import com.trinofed.parser.model.QueryEvent;
import com.trinofed.parser.model.QueryTree;
import com.trinofed.parser.service.BedrockAIService;
import com.trinofed.parser.service.QueryEventService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "http://localhost:5173")
public class AIAnalysisController {

    private final BedrockAIService bedrockAIService;
    private final QueryEventService queryEventService;

    @Autowired
    public AIAnalysisController(BedrockAIService bedrockAIService, QueryEventService queryEventService) {
        this.bedrockAIService = bedrockAIService;
        this.queryEventService = queryEventService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        log.info("Checking AI feature status");
        
        Map<String, Object> status = new HashMap<>();
        status.put("available", bedrockAIService.isAvailable());
        status.put("feature", "bedrock-ai-analysis");
        
        return ResponseEntity.ok(status);
    }

    @PostMapping("/analyze/{queryId}")
    public ResponseEntity<AIAnalysisResponse> analyzeQuery(@PathVariable String queryId) {
        log.info("Received AI analysis request for query: {}", queryId);
        
        // Fetch the query tree
        QueryTree queryTree = queryEventService.getQueryTree(queryId);
        
        if (queryTree == null) {
            log.warn("Query not found: {}", queryId);
            return ResponseEntity.notFound().build();
        }
        
        // Build analysis request from query tree
        AIAnalysisRequest request = buildAnalysisRequest(queryTree);
        
        // Call AI service
        AIAnalysisResponse response = bedrockAIService.analyzeQuery(request);
        
        return ResponseEntity.ok(response);
    }

    private AIAnalysisRequest buildAnalysisRequest(QueryTree queryTree) {
        // Extract statistics from events
        Long cpuTimeMs = null;
        Long wallTimeMs = null;
        Long queuedTimeMs = null;
        Long peakMemoryBytes = null;
        Long totalRows = null;
        Long totalBytes = null;
        Integer completedSplits = null;
        String jsonPlan = null;
        Map<String, Object> statistics = null;
        
        // Aggregate statistics from events
        if (queryTree.getEvents() != null && !queryTree.getEvents().isEmpty()) {
            for (QueryEvent event : queryTree.getEvents()) {
                if (event.getCpuTimeMs() != null) {
                    cpuTimeMs = (cpuTimeMs == null) ? event.getCpuTimeMs() : cpuTimeMs + event.getCpuTimeMs();
                }
                if (event.getWallTimeMs() != null) {
                    wallTimeMs = (wallTimeMs == null) ? event.getWallTimeMs() : wallTimeMs + event.getWallTimeMs();
                }
                if (event.getQueuedTimeMs() != null) {
                    queuedTimeMs = (queuedTimeMs == null) ? event.getQueuedTimeMs() : queuedTimeMs + event.getQueuedTimeMs();
                }
                if (event.getPeakMemoryBytes() != null) {
                    peakMemoryBytes = (peakMemoryBytes == null || event.getPeakMemoryBytes() > peakMemoryBytes) ? 
                        event.getPeakMemoryBytes() : peakMemoryBytes;
                }
                if (event.getTotalRows() != null) {
                    totalRows = event.getTotalRows();
                }
                if (event.getTotalBytes() != null) {
                    totalBytes = event.getTotalBytes();
                }
                if (event.getCompletedSplits() != null) {
                    completedSplits = event.getCompletedSplits();
                }
                if (event.getJsonPlan() != null && !event.getJsonPlan().isEmpty()) {
                    jsonPlan = event.getJsonPlan();
                }
                if (event.getStatistics() != null) {
                    statistics = event.getStatistics();
                }
            }
        }
        
        // Extract catalogs and schemas
        Set<String> catalogSet = new HashSet<>();
        Set<String> schemaSet = new HashSet<>();
        
        if (queryTree.getEvents() != null) {
            for (QueryEvent event : queryTree.getEvents()) {
                if (event.getCatalog() != null) {
                    catalogSet.add(event.getCatalog());
                }
                if (event.getSchema() != null) {
                    schemaSet.add(event.getSchema());
                }
            }
        }
        
        return AIAnalysisRequest.builder()
                .queryId(queryTree.getQueryId())
                .query(queryTree.getQuery())
                .executionTimeMs(queryTree.getTotalExecutionTime())
                .cpuTimeMs(cpuTimeMs)
                .wallTimeMs(wallTimeMs)
                .queuedTimeMs(queuedTimeMs)
                .peakMemoryBytes(peakMemoryBytes)
                .totalRows(totalRows)
                .totalBytes(totalBytes)
                .completedSplits(completedSplits)
                .jsonPlan(jsonPlan)
                .statistics(statistics)
                .state(queryTree.getState())
                .catalogs(new ArrayList<>(catalogSet))
                .schemas(new ArrayList<>(schemaSet))
                .errorMessage(queryTree.getErrorMessage())
                .build();
    }
}

