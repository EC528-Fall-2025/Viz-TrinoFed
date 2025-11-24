package com.trinofed.parser.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Represents a single fragment from a Trino query execution plan.
 * Fragments are the execution units that run on workers.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Fragment {

    @JsonProperty("fragmentId")
    private Integer fragmentId;

    @JsonProperty("partitioningType")
    private String partitioningType;

    @JsonProperty("cpuTime")
    private String cpuTime;

    @JsonProperty("cpuTimeMs")
    private Double cpuTimeMs;

    @JsonProperty("scheduledTime")
    private String scheduledTime;

    @JsonProperty("scheduledTimeMs")
    private Double scheduledTimeMs;

    @JsonProperty("blockedTime")
    private String blockedTime;

    @JsonProperty("blockedTimeMs")
    private Double blockedTimeMs;

    @JsonProperty("inputRows")
    private Long inputRows;

    @JsonProperty("inputBytes")
    private String inputBytes;

    @JsonProperty("inputBytesValue")
    private Long inputBytesValue;

    @JsonProperty("outputRows")
    private Long outputRows;

    @JsonProperty("outputBytes")
    private String outputBytes;

    @JsonProperty("outputBytesValue")
    private Long outputBytesValue;

    @JsonProperty("peakMemory")
    private String peakMemory;

    @JsonProperty("peakMemoryBytes")
    private Long peakMemoryBytes;

    @JsonProperty("taskCount")
    private Integer taskCount;

    @JsonProperty("outputLayout")
    private String outputLayout;

    @JsonProperty("outputPartitioning")
    private String outputPartitioning;

    @JsonProperty("operators")
    @Builder.Default
    private List<String> operators = List.of();

    @JsonProperty("rawText")
    private String rawText;
}

