package com.trinofed.parser.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

/**
 * Wrapper model for Trino Kafka event messages.
 * Matches the actual nested structure from Trino's Kafka event listener.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class TrinoEventWrapper {

    @JsonProperty("eventPayload")
    private EventPayload eventPayload;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class EventPayload {

        @JsonProperty("metadata")
        private QueryMetadata metadata;

        @JsonProperty("context")
        private QueryContext context;

        @JsonProperty("createTime")
        private String createTime;

        @JsonProperty("endTime")
        private String endTime;

        @JsonProperty("statistics")
        private QueryStatistics statistics;

        @JsonProperty("ioMetadata")
        private IoMetadata ioMetadata;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class QueryMetadata {

        @JsonProperty("queryId")
        private String queryId;

        @JsonProperty("query")
        private String query;

        @JsonProperty("queryState")
        private String queryState;

        @JsonProperty("uri")
        private String uri;

        @JsonProperty("plan")
        private String plan;

        @JsonProperty("payload")
        private String payload;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class QueryContext {

        @JsonProperty("user")
        private String user;

        @JsonProperty("principal")
        private String principal;

        @JsonProperty("remoteClientAddress")
        private String remoteClientAddress;

        @JsonProperty("userAgent")
        private String userAgent;

        @JsonProperty("clientInfo")
        private String clientInfo;

        @JsonProperty("serverAddress")
        private String serverAddress;

        @JsonProperty("serverVersion")
        private String serverVersion;

        @JsonProperty("environment")
        private String environment;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class QueryStatistics {

        @JsonProperty("cpuTime")
        private String cpuTime;

        @JsonProperty("wallTime")
        private String wallTime;

        @JsonProperty("queuedTime")
        private String queuedTime;

        @JsonProperty("scheduledTime")
        private String scheduledTime;

        @JsonProperty("analysisTime")
        private String analysisTime;

        @JsonProperty("planningTime")
        private String planningTime;

        @JsonProperty("executionTime")
        private String executionTime;

        @JsonProperty("peakMemoryBytes")
        private Long peakMemoryBytes;

        @JsonProperty("totalBytes")
        private Long totalBytes;

        @JsonProperty("totalRows")
        private Long totalRows;

        @JsonProperty("completedSplits")
        private Integer completedSplits;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class IoMetadata {

        @JsonProperty("inputs")
        private java.util.List<InputMetadata> inputs;

        @JsonProperty("output")
        private OutputMetadata output;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class InputMetadata {

        @JsonProperty("catalogName")
        private String catalogName;

        @JsonProperty("schema")
        private String schema;

        @JsonProperty("table")
        private String table;

        @JsonProperty("columns")
        private java.util.List<ColumnInfo> columns;

        @JsonProperty("connectorName")
        private String connectorName;

        @JsonProperty("catalogVersion")
        private String catalogVersion;

        @JsonProperty("connectorMetrics")
        private Object connectorMetrics;

        @JsonProperty("physicalInputBytes")
        private Long physicalInputBytes;

        @JsonProperty("physicalInputRows")
        private Long physicalInputRows;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ColumnInfo {

        @JsonProperty("name")
        private String name;

        @JsonProperty("type")
        private String type;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OutputMetadata {

        @JsonProperty("catalogName")
        private String catalogName;

        @JsonProperty("schema")
        private String schema;

        @JsonProperty("table")
        private String table;
    }

    /**
     * Convert this wrapper to a QueryEvent for processing
     */
    public QueryEvent toQueryEvent() {
        if (eventPayload == null || eventPayload.getMetadata() == null) {
            return null;
        }

        QueryMetadata metadata = eventPayload.getMetadata();
        QueryStatistics stats = eventPayload.getStatistics();
        QueryContext ctx = eventPayload.getContext();
        IoMetadata ioMeta = eventPayload.getIoMetadata();

        // Parse timestamp from createTime or use current time
        Instant timestamp = Instant.now();
        if (eventPayload.getCreateTime() != null && !eventPayload.getCreateTime().isEmpty()) {
            try {
                timestamp = Instant.parse(eventPayload.getCreateTime());
            } catch (Exception e) {
                // Use current time if parsing fails
            }
        }

        // Extract database/catalog information from ioMetadata
        String primaryCatalog = null;
        String primarySchema = null;
        String primaryTable = null;
        java.util.List<String> catalogs = new java.util.ArrayList<>();
        java.util.List<String> schemas = new java.util.ArrayList<>();
        java.util.List<String> tables = new java.util.ArrayList<>();

        if (ioMeta != null && ioMeta.getInputs() != null) {
            for (InputMetadata input : ioMeta.getInputs()) {
                if (input.getCatalogName() != null) {
                    catalogs.add(input.getCatalogName());
                    if (primaryCatalog == null) {
                        primaryCatalog = input.getCatalogName();
                    }
                }
                if (input.getSchema() != null) {
                    schemas.add(input.getSchema());
                    if (primarySchema == null) {
                        primarySchema = input.getSchema();
                    }
                }
                if (input.getTable() != null) {
                    tables.add(input.getTable());
                    if (primaryTable == null) {
                        primaryTable = input.getTable();
                    }
                }
            }
        }

        // Build inputs metadata for processing
        java.util.Map<String, Object> inputsMap = new java.util.HashMap<>();
        if (ioMeta != null && ioMeta.getInputs() != null) {
            java.util.List<java.util.Map<String, Object>> inputsList = new java.util.ArrayList<>();
            for (InputMetadata input : ioMeta.getInputs()) {
                java.util.Map<String, Object> inputMap = new java.util.HashMap<>();
                inputMap.put("catalogName", input.getCatalogName());
                inputMap.put("connectorName", input.getConnectorName());
                inputMap.put("schema", input.getSchema());
                inputMap.put("table", input.getTable());
                
                // Convert column objects to map format for processing
                if (input.getColumns() != null) {
                    java.util.List<java.util.Map<String, Object>> columnsList = new java.util.ArrayList<>();
                    for (ColumnInfo col : input.getColumns()) {
                        java.util.Map<String, Object> colMap = new java.util.HashMap<>();
                        colMap.put("name", col.getName());
                        colMap.put("type", col.getType());
                        columnsList.add(colMap);
                    }
                    inputMap.put("columns", columnsList);
                }
                
                inputsList.add(inputMap);
            }
            inputsMap.put("inputs", inputsList);
        }

        return QueryEvent.builder()
                .queryId(metadata.getQueryId())
                .query(metadata.getQuery())
                .state(metadata.getQueryState())
                .user(ctx != null ? ctx.getUser() : null)
                .timestamp(timestamp)
                .createTime(eventPayload.getCreateTime())
                .endTime(eventPayload.getEndTime())
                .cpuTimeMs(stats != null && stats.getCpuTime() != null ? parseDuration(stats.getCpuTime()) : null)
                .wallTimeMs(stats != null && stats.getWallTime() != null ? parseDuration(stats.getWallTime()) : null)
                .queuedTimeMs(stats != null && stats.getQueuedTime() != null ? parseDuration(stats.getQueuedTime()) : null)
                .peakMemoryBytes(stats != null ? stats.getPeakMemoryBytes() : null)
                .totalBytes(stats != null ? stats.getTotalBytes() : null)
                .totalRows(stats != null ? stats.getTotalRows() : null)
                .completedSplits(stats != null ? stats.getCompletedSplits() : null)
                .plan(metadata.getPlan())
                .eventType(determineEventType(metadata.getQueryState()))
                .catalog(primaryCatalog)
                .schema(primarySchema)
                .tableName(primaryTable)
                .catalogs(catalogs)
                .schemas(schemas)
                .tables(tables)
                .inputs(inputsMap)
                .ioMetadata(ioMeta)
                .build();
    }

    /**
     * Parse duration string like "1.23s" or "123.45ms" to milliseconds
     */
    private Long parseDuration(String duration) {
        if (duration == null || duration.isEmpty()) {
            return null;
        }
        try {
            if (duration.endsWith("ms")) {
                return Long.parseLong(duration.substring(0, duration.length() - 2).split("\\.")[0]);
            } else if (duration.endsWith("s")) {
                return (long) (Double.parseDouble(duration.substring(0, duration.length() - 1)) * 1000);
            } else if (duration.endsWith("m")) {
                return (long) (Double.parseDouble(duration.substring(0, duration.length() - 1)) * 60000);
            }
        } catch (NumberFormatException e) {
            return null;
        }
        return null;
    }

    /**
     * Determine event type from query state
     */
    private String determineEventType(String queryState) {
        if (queryState == null) {
            return "UNKNOWN";
        }
        switch (queryState) {
            case "QUEUED":
            case "PLANNING":
            case "STARTING":
            case "RUNNING":
                return "CREATED";
            case "FINISHED":
            case "FAILED":
            case "CANCELED":
                return "COMPLETED";
            default:
                return queryState;
        }
    }
}
