package com.trinofed.parser.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Database {

    @JsonProperty("id")
    private String id;

    @JsonProperty("name")
    private String name;

    @JsonProperty("type")
    private String type;

    @JsonProperty("host")
    private String host;

    @JsonProperty("port")
    private Integer port;

    @JsonProperty("status")
    private String status;

    @JsonProperty("schemas")
    @Builder.Default
    private List<Schema> schemas = new ArrayList<>();

    @JsonProperty("collections")
    @Builder.Default
    private List<Collection> collections = new ArrayList<>();

    @JsonProperty("metadata")
    private Map<String, Object> metadata;

    @JsonProperty("firstSeen")
    private Instant firstSeen;

    @JsonProperty("lastSeen")
    private Instant lastSeen;

    @JsonProperty("totalQueries")
    @Builder.Default
    private Integer totalQueries = 0;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Schema {

        @JsonProperty("name")
        private String name;

        @JsonProperty("tables")
        @Builder.Default
        private List<Table> tables = new ArrayList<>();

        @JsonProperty("metadata")
        private Map<String, Object> metadata;

        @JsonProperty("firstSeen")
        private Instant firstSeen;

        @JsonProperty("lastSeen")
        private Instant lastSeen;

        @JsonProperty("totalQueries")
        @Builder.Default
        private Integer totalQueries = 0;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Collection {

        @JsonProperty("name")
        private String name;

        @JsonProperty("documentCount")
        private Long documentCount;

        @JsonProperty("sizeBytes")
        private Long sizeBytes;

        @JsonProperty("fields")
        @Builder.Default
        private List<Field> fields = new ArrayList<>();

        @JsonProperty("metadata")
        private Map<String, Object> metadata;

        @JsonProperty("firstSeen")
        private Instant firstSeen;

        @JsonProperty("lastSeen")
        private Instant lastSeen;

        @JsonProperty("totalQueries")
        @Builder.Default
        private Integer totalQueries = 0;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Table {

        @JsonProperty("name")
        private String name;

        @JsonProperty("columns")
        @Builder.Default
        private List<Column> columns = new ArrayList<>();

        @JsonProperty("rowCount")
        private Long rowCount;

        @JsonProperty("sizeBytes")
        private Long sizeBytes;

        @JsonProperty("metadata")
        private Map<String, Object> metadata;

        @JsonProperty("firstSeen")
        private Instant firstSeen;

        @JsonProperty("lastSeen")
        private Instant lastSeen;

        @JsonProperty("totalQueries")
        @Builder.Default
        private Integer totalQueries = 0;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Column {

        @JsonProperty("name")
        private String name;

        @JsonProperty("type")
        private String type;

        @JsonProperty("nullable")
        private Boolean nullable;

        @JsonProperty("defaultValue")
        private String defaultValue;

        @JsonProperty("metadata")
        private Map<String, Object> metadata;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Field {

        @JsonProperty("name")
        private String name;

        @JsonProperty("type")
        private String type;

        @JsonProperty("nested")
        private Boolean nested;

        @JsonProperty("metadata")
        private Map<String, Object> metadata;
    }
}
