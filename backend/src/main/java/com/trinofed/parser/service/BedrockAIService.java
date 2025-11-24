package com.trinofed.parser.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trinofed.parser.model.AIAnalysisRequest;
import com.trinofed.parser.model.AIAnalysisResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelRequest;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelResponse;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class BedrockAIService {

    @Value("${aws.bedrock.enabled:false}")
    private boolean enabled;

    @Value("${aws.bedrock.region:us-east-1}")
    private String region;

    @Value("${aws.bedrock.model-id:anthropic.claude-3-5-sonnet-20241022-v2:0}")
    private String modelId;

    @Value("${aws.bedrock.access-key-id:}")
    private String accessKeyId;

    @Value("${aws.bedrock.secret-access-key:}")
    private String secretAccessKey;

    private BedrockRuntimeClient bedrockClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public boolean isAvailable() {
        if (!enabled) {
            log.debug("Bedrock AI feature is disabled");
            return false;
        }

        // Check if we have credentials
        boolean hasCredentials = (accessKeyId != null && !accessKeyId.isEmpty() && 
                                  secretAccessKey != null && !secretAccessKey.isEmpty());
        
        if (!hasCredentials) {
            log.debug("No explicit AWS credentials found, checking default credentials provider");
        }

        return enabled;
    }

    private BedrockRuntimeClient getBedrockClient() {
        if (bedrockClient == null) {
            AwsCredentialsProvider credentialsProvider;
            
            // Use explicit credentials if provided, otherwise use default credentials chain
            if (accessKeyId != null && !accessKeyId.isEmpty() && 
                secretAccessKey != null && !secretAccessKey.isEmpty()) {
                log.info("Using explicit AWS credentials from configuration");
                credentialsProvider = StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(accessKeyId, secretAccessKey)
                );
            } else {
                log.info("Using default AWS credentials provider chain");
                credentialsProvider = DefaultCredentialsProvider.create();
            }

            bedrockClient = BedrockRuntimeClient.builder()
                    .region(Region.of(region))
                    .credentialsProvider(credentialsProvider)
                    .build();
        }
        return bedrockClient;
    }

    public AIAnalysisResponse analyzeQuery(AIAnalysisRequest request) {
        if (!isAvailable()) {
            return AIAnalysisResponse.builder()
                    .queryId(request.getQueryId())
                    .originalQuery(request.getQuery())
                    .available(false)
                    .error("Bedrock AI feature is not enabled or configured. Please set AWS credentials and enable the feature.")
                    .build();
        }

        try {
            log.info("Analyzing query {} with Bedrock AI", request.getQueryId());
            
            // Build the prompt
            String prompt = buildPrompt(request);
            
            // Call Bedrock API
            String responseText = callBedrockAPI(prompt);
            
            // Parse the response
            return parseAIResponse(request, responseText);
            
        } catch (Exception e) {
            log.error("Error analyzing query with Bedrock AI", e);
            return AIAnalysisResponse.builder()
                    .queryId(request.getQueryId())
                    .originalQuery(request.getQuery())
                    .available(true)
                    .error("Failed to analyze query: " + e.getMessage())
                    .build();
        }
    }

    private String buildPrompt(AIAnalysisRequest request) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("You are an expert database query optimization consultant specializing in Trino/Presto SQL queries. ");
        prompt.append("Analyze the following query execution data and provide optimization recommendations.\n\n");
        
        prompt.append("## Original Query\n```sql\n");
        prompt.append(request.getQuery());
        prompt.append("\n```\n\n");
        
        prompt.append("## Execution Statistics\n");
        prompt.append(String.format("- State: %s\n", request.getState()));
        if (request.getExecutionTimeMs() != null) {
            prompt.append(String.format("- Total Execution Time: %d ms\n", request.getExecutionTimeMs()));
        }
        if (request.getCpuTimeMs() != null) {
            prompt.append(String.format("- CPU Time: %d ms\n", request.getCpuTimeMs()));
        }
        if (request.getWallTimeMs() != null) {
            prompt.append(String.format("- Wall Time: %d ms\n", request.getWallTimeMs()));
        }
        if (request.getQueuedTimeMs() != null) {
            prompt.append(String.format("- Queued Time: %d ms\n", request.getQueuedTimeMs()));
        }
        if (request.getPeakMemoryBytes() != null) {
            prompt.append(String.format("- Peak Memory: %d bytes (%.2f MB)\n", 
                request.getPeakMemoryBytes(), request.getPeakMemoryBytes() / (1024.0 * 1024.0)));
        }
        if (request.getTotalRows() != null) {
            prompt.append(String.format("- Total Rows Processed: %d\n", request.getTotalRows()));
        }
        if (request.getTotalBytes() != null) {
            prompt.append(String.format("- Total Data Processed: %d bytes (%.2f MB)\n", 
                request.getTotalBytes(), request.getTotalBytes() / (1024.0 * 1024.0)));
        }
        if (request.getCompletedSplits() != null) {
            prompt.append(String.format("- Completed Splits: %d\n", request.getCompletedSplits()));
        }
        
        if (request.getCatalogs() != null && !request.getCatalogs().isEmpty()) {
            prompt.append(String.format("- Catalogs: %s\n", String.join(", ", request.getCatalogs())));
        }
        if (request.getSchemas() != null && !request.getSchemas().isEmpty()) {
            prompt.append(String.format("- Schemas: %s\n", String.join(", ", request.getSchemas())));
        }
        
        if (request.getErrorMessage() != null) {
            prompt.append(String.format("- Error: %s\n", request.getErrorMessage()));
        }
        
        if (request.getJsonPlan() != null && !request.getJsonPlan().isEmpty()) {
            prompt.append("\n## Query Plan\n");
            // Truncate plan if too long to avoid token limits
            String plan = request.getJsonPlan();
            if (plan.length() > 3000) {
                plan = plan.substring(0, 3000) + "\n... (truncated)";
            }
            prompt.append(plan);
            prompt.append("\n\n");
        }
        
        prompt.append("\n## Required Analysis\n");
        prompt.append("Please provide your analysis in the following JSON format (respond ONLY with valid JSON, no markdown):\n\n");
        prompt.append("{\n");
        prompt.append("  \"optimizedQuery\": \"<the optimized SQL query>\",\n");
        prompt.append("  \"bottleneckAnalysis\": \"<detailed analysis of performance bottlenecks>\",\n");
        prompt.append("  \"suggestions\": [\"<suggestion 1>\", \"<suggestion 2>\", ...],\n");
        prompt.append("  \"expectedImprovement\": \"<expected performance improvement description>\"\n");
        prompt.append("}\n\n");
        prompt.append("Focus on:\n");
        prompt.append("1. Query structure optimization (JOIN order, WHERE clauses, etc.)\n");
        prompt.append("2. Predicate pushdown opportunities\n");
        prompt.append("3. Data filtering improvements\n");
        prompt.append("4. Index usage suggestions\n");
        prompt.append("5. Memory and CPU bottlenecks\n");
        prompt.append("6. Partition pruning opportunities\n");
        
        return prompt.toString();
    }

    private String callBedrockAPI(String prompt) throws Exception {
        BedrockRuntimeClient client = getBedrockClient();
        
        // Build request body based on model type
        Map<String, Object> requestBody = new HashMap<>();
        
        if (modelId.contains("anthropic.claude")) {
            // Claude model format
            requestBody.put("anthropic_version", "bedrock-2023-05-31");
            requestBody.put("max_tokens", 4000);
            
            List<Map<String, String>> messages = new ArrayList<>();
            Map<String, String> message = new HashMap<>();
            message.put("role", "user");
            message.put("content", prompt);
            messages.add(message);
            
            requestBody.put("messages", messages);
            
        } else {
            // Generic format for other models
            requestBody.put("prompt", prompt);
            requestBody.put("max_tokens", 4000);
            requestBody.put("temperature", 0.3);
        }
        
        String jsonBody = objectMapper.writeValueAsString(requestBody);
        
        InvokeModelRequest invokeRequest = InvokeModelRequest.builder()
                .modelId(modelId)
                .body(SdkBytes.fromUtf8String(jsonBody))
                .build();
        
        log.debug("Invoking Bedrock model: {}", modelId);
        InvokeModelResponse response = client.invokeModel(invokeRequest);
        
        String responseBody = response.body().asUtf8String();
        log.debug("Received response from Bedrock");
        
        // Parse response based on model type
        JsonNode responseJson = objectMapper.readTree(responseBody);
        
        if (modelId.contains("anthropic.claude")) {
            // Claude response format
            JsonNode content = responseJson.get("content");
            if (content != null && content.isArray() && content.size() > 0) {
                return content.get(0).get("text").asText();
            }
        } else {
            // Generic format
            if (responseJson.has("completion")) {
                return responseJson.get("completion").asText();
            } else if (responseJson.has("generations")) {
                return responseJson.get("generations").get(0).get("text").asText();
            }
        }
        
        throw new Exception("Unable to parse response from model: " + responseBody);
    }

    private AIAnalysisResponse parseAIResponse(AIAnalysisRequest request, String aiResponse) {
        try {
            // Try to extract JSON from the response (in case there's markdown formatting)
            String jsonStr = aiResponse.trim();
            
            // Remove markdown code blocks if present
            if (jsonStr.startsWith("```json")) {
                jsonStr = jsonStr.substring(7);
            } else if (jsonStr.startsWith("```")) {
                jsonStr = jsonStr.substring(3);
            }
            if (jsonStr.endsWith("```")) {
                jsonStr = jsonStr.substring(0, jsonStr.length() - 3);
            }
            jsonStr = jsonStr.trim();
            
            JsonNode jsonNode = objectMapper.readTree(jsonStr);
            
            String optimizedQuery = jsonNode.has("optimizedQuery") ? 
                jsonNode.get("optimizedQuery").asText() : request.getQuery();
            
            String bottleneckAnalysis = jsonNode.has("bottleneckAnalysis") ? 
                jsonNode.get("bottleneckAnalysis").asText() : "";
            
            List<String> suggestions = new ArrayList<>();
            if (jsonNode.has("suggestions") && jsonNode.get("suggestions").isArray()) {
                jsonNode.get("suggestions").forEach(node -> suggestions.add(node.asText()));
            }
            
            String expectedImprovement = jsonNode.has("expectedImprovement") ? 
                jsonNode.get("expectedImprovement").asText() : "";
            
            return AIAnalysisResponse.builder()
                    .queryId(request.getQueryId())
                    .originalQuery(request.getQuery())
                    .optimizedQuery(optimizedQuery)
                    .bottleneckAnalysis(bottleneckAnalysis)
                    .suggestions(suggestions)
                    .expectedImprovement(expectedImprovement)
                    .available(true)
                    .build();
            
        } catch (Exception e) {
            log.error("Error parsing AI response", e);
            
            // Fallback: return the raw response as bottleneck analysis
            return AIAnalysisResponse.builder()
                    .queryId(request.getQueryId())
                    .originalQuery(request.getQuery())
                    .bottleneckAnalysis(aiResponse)
                    .suggestions(Arrays.asList("Unable to parse structured response from AI"))
                    .available(true)
                    .build();
        }
    }
}

