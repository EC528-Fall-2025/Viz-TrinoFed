package com.trinofed.parser.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIAnalysisRequest {

    @JsonProperty("queryId")
    private String queryId;

    @JsonProperty("query")
    private String query;

    @JsonProperty("executionTimeMs")
    private Long executionTimeMs;

    @JsonProperty("cpuTimeMs")
    private Long cpuTimeMs;

    @JsonProperty("wallTimeMs")
    private Long wallTimeMs;

    @JsonProperty("queuedTimeMs")
    private Long queuedTimeMs;

    @JsonProperty("peakMemoryBytes")
    private Long peakMemoryBytes;

    @JsonProperty("totalRows")
    private Long totalRows;

    @JsonProperty("totalBytes")
    private Long totalBytes;

    @JsonProperty("completedSplits")
    private Integer completedSplits;

    @JsonProperty("jsonPlan")
    private String jsonPlan;

    @JsonProperty("statistics")
    private Map<String, Object> statistics;

    @JsonProperty("state")
    private String state;

    @JsonProperty("catalogs")
    private java.util.List<String> catalogs;

    @JsonProperty("schemas")
    private java.util.List<String> schemas;

    @JsonProperty("errorMessage")
    private String errorMessage;
}

