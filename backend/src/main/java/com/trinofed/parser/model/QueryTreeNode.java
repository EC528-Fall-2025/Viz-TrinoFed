package com.trinofed.parser.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueryTreeNode {

    @JsonProperty("id")
    private String id;

    @JsonProperty("queryId")
    private String queryId;

    @JsonProperty("nodeType")
    private String nodeType;

    @JsonProperty("operatorType")
    private String operatorType;

    @JsonProperty("sourceSystem")
    private String sourceSystem;

    @JsonProperty("state")
    private String state;

    @JsonProperty("executionTime")
    private Long executionTime;

    @JsonProperty("inputRows")
    private Long inputRows;

    @JsonProperty("outputRows")
    private Long outputRows;

    @JsonProperty("inputBytes")
    private Long inputBytes;

    @JsonProperty("outputBytes")
    private Long outputBytes;

    @JsonProperty("cpuTime")
    private Long cpuTime;

    @JsonProperty("wallTime")
    private Long wallTime;

    @JsonProperty("memoryBytes")
    private Long memoryBytes;

    @JsonProperty("errorMessage")
    private String errorMessage;

    @JsonProperty("warnings")
    private List<String> warnings;

    @JsonProperty("metadata")
    private Map<String, Object> metadata;

    @JsonProperty("children")
    @Builder.Default
    private List<QueryTreeNode> children = new ArrayList<>();

    @JsonProperty("parentId")
    private String parentId;
}
