package com.trinofed.parser.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class QueryEvent {

    @JsonProperty("queryId")
    private String queryId;

    @JsonProperty("eventType")
    private String eventType;

    @JsonProperty("timestamp")
    private Instant timestamp;

    @JsonProperty("query")
    private String query;

    @JsonProperty("state")
    private String state;

    @JsonProperty("user")
    private String user;

    @JsonProperty("source")
    private String source;

    @JsonProperty("catalog")
    private String catalog;

    @JsonProperty("schema")
    private String schema;

    @JsonProperty("tableName")
    private String tableName;

    @JsonProperty("catalogs")
    private java.util.List<String> catalogs;

    @JsonProperty("schemas")  
    private java.util.List<String> schemas;

    @JsonProperty("tables")
    private java.util.List<String> tables;

    @JsonProperty("ioMetadata")
    private Object ioMetadata;

    @JsonProperty("executionTime")
    private Long executionTime;

    @JsonProperty("createTime")
    private String createTime;

    @JsonProperty("endTime")
    private String endTime;

    @JsonProperty("cpuTime")
    private Long cpuTime;

    @JsonProperty("cpuTimeMs")
    private Long cpuTimeMs;

    @JsonProperty("wallTime")
    private Long wallTime;

    @JsonProperty("wallTimeMs")
    private Long wallTimeMs;

    @JsonProperty("queuedTime")
    private Long queuedTime;

    @JsonProperty("queuedTimeMs")
    private Long queuedTimeMs;

    @JsonProperty("peakMemoryBytes")
    private Long peakMemoryBytes;

    @JsonProperty("totalBytes")
    private Long totalBytes;

    @JsonProperty("totalRows")
    private Long totalRows;

    @JsonProperty("completedSplits")
    private Integer completedSplits;

    @JsonProperty("plan")
    private String plan;

    @JsonProperty("errorCode")
    private String errorCode;

    @JsonProperty("errorMessage")
    private String errorMessage;

    @JsonProperty("stageStats")
    private Map<String, Object> stageStats;

    @JsonProperty("operatorStats")
    private Map<String, Object> operatorStats;

    @JsonProperty("inputs")
    private Map<String, Object> inputs;

    @JsonProperty("metadata")
    private Map<String, Object> metadata;
}
