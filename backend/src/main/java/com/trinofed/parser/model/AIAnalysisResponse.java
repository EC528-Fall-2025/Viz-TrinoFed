package com.trinofed.parser.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIAnalysisResponse {

    @JsonProperty("queryId")
    private String queryId;

    @JsonProperty("originalQuery")
    private String originalQuery;

    @JsonProperty("optimizedQuery")
    private String optimizedQuery;

    @JsonProperty("bottleneckAnalysis")
    private String bottleneckAnalysis;

    @JsonProperty("suggestions")
    private List<String> suggestions;

    @JsonProperty("expectedImprovement")
    private String expectedImprovement;

    @JsonProperty("error")
    private String error;

    @JsonProperty("available")
    private boolean available;
}

