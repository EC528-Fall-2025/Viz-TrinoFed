package com.trinofed.parser.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueryTree {

    @JsonProperty("queryId")
    private String queryId;

    @JsonProperty("query")
    private String query;

    @JsonProperty("user")
    private String user;

    @JsonProperty("state")
    private String state;

    @JsonProperty("startTime")
    private Instant startTime;

    @JsonProperty("endTime")
    private Instant endTime;

    @JsonProperty("totalExecutionTime")
    private Long totalExecutionTime;

    @JsonProperty("errorMessage")
    private String errorMessage;

    @JsonProperty("root")
    private QueryTreeNode root;

    @JsonProperty("events")
    @Builder.Default
    private List<QueryEvent> events = new ArrayList<>();
}
