package com.trinofed.parser.service;

import com.trinofed.parser.model.Fragment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service to parse Trino text-based query execution plans into Fragment objects.
 */
@Slf4j
@Service
public class TextPlanParser {

    // 💡 FIX 1: Pattern to match fragment headers. Changed from [A-Z_:]+ to [^]]+ 
    // to allow any character (including numbers) inside the brackets.
    private static final Pattern FRAGMENT_HEADER_PATTERN = Pattern.compile("^Fragment (\\d+) \\[([^]]+)]");
    
    // Pattern to extract metrics from the fragment info line
    private static final Pattern CPU_PATTERN = Pattern.compile("CPU: ([0-9.]+)(ms|s)");
    private static final Pattern SCHEDULED_PATTERN = Pattern.compile("Scheduled: ([0-9.]+)(ms|s)");
    private static final Pattern BLOCKED_PATTERN = Pattern.compile("Blocked ([0-9.]+)(ms|s)");
    private static final Pattern INPUT_PATTERN = Pattern.compile("Input: (\\d+) rows \\(([^)]+)\\)");
    private static final Pattern OUTPUT_PATTERN = Pattern.compile("Output: (\\d+) rows \\(([^)]+)\\)");
    private static final Pattern PEAK_MEMORY_PATTERN = Pattern.compile("Peak Memory: ([^,]+)");
    private static final Pattern TASKS_PATTERN = Pattern.compile("Tasks count: (\\d+)");
    private static final Pattern OUTPUT_LAYOUT_PATTERN = Pattern.compile("Output layout: \\[([^\\]]+)]");
    private static final Pattern OUTPUT_PARTITIONING_PATTERN = Pattern.compile("Output partitioning: (.+)");

    /**
     * Parses a text-based execution plan into a list of Fragment objects.
     *
     * @param planText The raw plan text from Trino
     * @return List of Fragment objects, sorted by fragmentId in descending order
     */
    public List<Fragment> parseTextPlan(String planText) {
        if (planText == null || planText.trim().isEmpty()) {
            log.warn("Plan text is null or empty");
            return Collections.emptyList();
        }

        List<Fragment> fragments = new ArrayList<>();
        String[] lines = planText.split("\n");
        
        Fragment currentFragment = null;
        List<String> currentOperators = new ArrayList<>();

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            Matcher fragmentMatcher = FRAGMENT_HEADER_PATTERN.matcher(line.trim());

            if (fragmentMatcher.find()) {
                // Save the previous fragment if exists
                if (currentFragment != null) {
                    currentFragment.setOperators(new ArrayList<>(currentOperators));
                    fragments.add(currentFragment);
                }

                // Start a new fragment
                int fragmentId = Integer.parseInt(fragmentMatcher.group(1));
                String partitioningType = fragmentMatcher.group(2);

                currentFragment = Fragment.builder()
                        .fragmentId(fragmentId)
                        .partitioningType(partitioningType)
                        .build();
                
                currentOperators.clear();

                // Next line typically contains metrics
                if (i + 1 < lines.length) {
                    String metricsLine = lines[i + 1];
                    parseFragmentMetrics(currentFragment, metricsLine);
                    // 💡 FIX 2: Skip the metrics line since it was just processed
                    i++; 
                }
            } else if (currentFragment != null) {
                String trimmedLine = line.trim();
                
                // Skip empty or purely informative lines in between blocks
                if (trimmedLine.isEmpty() || trimmedLine.startsWith("Input avg.:") || trimmedLine.startsWith("Output avg.:")) {
                    continue;
                }
                
                // Check for additional metadata lines
                if (trimmedLine.startsWith("Output layout:")) {
                    Matcher layoutMatcher = OUTPUT_LAYOUT_PATTERN.matcher(line);
                    if (layoutMatcher.find()) {
                        currentFragment.setOutputLayout(layoutMatcher.group(1));
                    }
                } else if (trimmedLine.startsWith("Output partitioning:")) {
                    Matcher partitioningMatcher = OUTPUT_PARTITIONING_PATTERN.matcher(line);
                    if (partitioningMatcher.find()) {
                        currentFragment.setOutputPartitioning(partitioningMatcher.group(1));
                    }
                } 
                // Only include lines that are clearly part of the operator tree for the raw text
                else if (trimmedLine.startsWith("Output[") || 
                           trimmedLine.startsWith("└─") || 
                           trimmedLine.startsWith("│") ||
                           // Catch any other operator/keyword that starts the line
                           trimmedLine.startsWith("LocalMerge") ||
                           trimmedLine.startsWith("Aggregate") ||
                           trimmedLine.startsWith("TableScan") ||
                           trimmedLine.startsWith("RemoteSource") ||
                           trimmedLine.startsWith("RemoteMerge") ||
                           trimmedLine.startsWith("PartialSort") || 
                           trimmedLine.startsWith("Project") ||
                           trimmedLine.startsWith("InnerJoin") ||
                           trimmedLine.startsWith("ScanFilter")) {
                    // This is part of the operator tree
                    currentOperators.add(line);
                }
            }
        }

        // Add the last fragment
        if (currentFragment != null) {
            currentFragment.setOperators(new ArrayList<>(currentOperators));
            fragments.add(currentFragment);
        }

        // Sort by fragment ID in descending order (for visualization flow)
        fragments.sort((a, b) -> Integer.compare(b.getFragmentId(), a.getFragmentId()));

        log.info("Parsed {} fragments from plan text", fragments.size());
        return fragments;
    }

    /**
     * Parses the metrics line of a fragment to extract timing and resource information.
     */
    private void parseFragmentMetrics(Fragment fragment, String metricsLine) {
        // Parse CPU time
        Matcher cpuMatcher = CPU_PATTERN.matcher(metricsLine);
        if (cpuMatcher.find()) {
            String value = cpuMatcher.group(1);
            String unit = cpuMatcher.group(2);
            fragment.setCpuTime(value + unit);
            fragment.setCpuTimeMs(parseTimeToMs(value, unit));
        }

        // Parse Scheduled time
        Matcher scheduledMatcher = SCHEDULED_PATTERN.matcher(metricsLine);
        if (scheduledMatcher.find()) {
            String value = scheduledMatcher.group(1);
            String unit = scheduledMatcher.group(2);
            fragment.setScheduledTime(value + unit);
            fragment.setScheduledTimeMs(parseTimeToMs(value, unit));
        }

        // Parse Blocked time
        Matcher blockedMatcher = BLOCKED_PATTERN.matcher(metricsLine);
        if (blockedMatcher.find()) {
            String value = blockedMatcher.group(1);
            String unit = blockedMatcher.group(2);
            fragment.setBlockedTime(value + unit);
            fragment.setBlockedTimeMs(parseTimeToMs(value, unit));
        } else if (metricsLine.contains("Blocked")) {
            // Check for format "Blocked 1.66m (Input: 36.23s, Output: 0.00ns)" where unit isn't next to value
            Pattern blockedWithoutUnitPattern = Pattern.compile("Blocked\\s+([0-9.]+)(ms|s|m)");
            Matcher partialBlockedMatcher = blockedWithoutUnitPattern.matcher(metricsLine);
            if (partialBlockedMatcher.find()) {
                String value = partialBlockedMatcher.group(1);
                String unit = partialBlockedMatcher.group(2);
                fragment.setBlockedTime(value + unit);
                fragment.setBlockedTimeMs(parseTimeToMs(value, unit));
            }
        }


        // Parse Input
        Matcher inputMatcher = INPUT_PATTERN.matcher(metricsLine);
        if (inputMatcher.find()) {
            fragment.setInputRows(Long.parseLong(inputMatcher.group(1)));
            String bytesStr = inputMatcher.group(2);
            fragment.setInputBytes(bytesStr);
            fragment.setInputBytesValue(parseBytesToLong(bytesStr));
        }

        // Parse Output
        Matcher outputMatcher = OUTPUT_PATTERN.matcher(metricsLine);
        if (outputMatcher.find()) {
            fragment.setOutputRows(Long.parseLong(outputMatcher.group(1)));
            String bytesStr = outputMatcher.group(2);
            fragment.setOutputBytes(bytesStr);
            fragment.setOutputBytesValue(parseBytesToLong(bytesStr));
        }

        // Parse Peak Memory
        Matcher memoryMatcher = PEAK_MEMORY_PATTERN.matcher(metricsLine);
        if (memoryMatcher.find()) {
            String memoryStr = memoryMatcher.group(1).trim();
            fragment.setPeakMemory(memoryStr);
            fragment.setPeakMemoryBytes(parseBytesToLong(memoryStr));
        }

        // Parse Tasks count
        Matcher tasksMatcher = TASKS_PATTERN.matcher(metricsLine);
        if (tasksMatcher.find()) {
            fragment.setTaskCount(Integer.parseInt(tasksMatcher.group(1)));
        }
    }

    /**
     * Converts a time value with unit to milliseconds.
     */
    private double parseTimeToMs(String value, String unit) {
        double val = Double.parseDouble(value);
        return switch (unit) {
            case "s" -> val * 1000.0;
            case "m" -> val * 60.0 * 1000.0; // handle minutes (1.66m)
            default -> val; // already in ms
        };
    }

    /**
     * Parses byte size strings like "45B", "352.59kB", "1.23MB", "2.5GB" to bytes.
     */
    private long parseBytesToLong(String bytesStr) {
        if (bytesStr == null || bytesStr.trim().isEmpty() || bytesStr.trim().equalsIgnoreCase("null")) {
            return 0L;
        }

        bytesStr = bytesStr.trim().toUpperCase();
        
        // Match number and unit (including optional space)
        Pattern pattern = Pattern.compile("([0-9.]+|NaN)\\s*([KMGT]?B)");
        Matcher matcher = pattern.matcher(bytesStr);
        
        if (!matcher.find()) {
            return 0L;
        }

        String valueStr = matcher.group(1);
        if (valueStr.equalsIgnoreCase("NAN")) {
            return 0L;
        }
        
        double value = Double.parseDouble(valueStr);
        String unit = matcher.group(2);

        return switch (unit) {
            case "B" -> (long) value;
            case "KB" -> (long) (value * 1024);
            case "MB" -> (long) (value * 1024 * 1024);
            case "GB" -> (long) (value * 1024 * 1024 * 1024);
            case "TB" -> (long) (value * 1024L * 1024 * 1024 * 1024);
            default -> 0L;
        };
    }
}