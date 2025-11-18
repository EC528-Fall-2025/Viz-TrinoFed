package com.trinofed.parser.model;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for QueryTreeNode model
 * Tests serialization, deserialization, and builder pattern
 */
class QueryTreeNodeTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("Should create QueryTreeNode using builder")
    void testBuilderPattern() {
        // When
        QueryTreeNode node = QueryTreeNode.builder()
                .id("node-1")
                .queryId("query-123")
                .nodeType("OPERATOR")
                .operatorType("TableScan")
                .sourceSystem("postgres")
                .state("FINISHED")
                .executionTime(1000L)
                .inputRows(100L)
                .outputRows(50L)
                .build();

        // Then
        assertThat(node.getId()).isEqualTo("node-1");
        assertThat(node.getQueryId()).isEqualTo("query-123");
        assertThat(node.getNodeType()).isEqualTo("OPERATOR");
        assertThat(node.getOperatorType()).isEqualTo("TableScan");
        assertThat(node.getSourceSystem()).isEqualTo("postgres");
        assertThat(node.getState()).isEqualTo("FINISHED");
        assertThat(node.getExecutionTime()).isEqualTo(1000L);
    }

    @Test
    @DisplayName("Should serialize to JSON correctly")
    void testSerialization() throws Exception {
        // Given
        QueryTreeNode node = QueryTreeNode.builder()
                .id("node-1")
                .operatorType("TableScan")
                .nodeType("OPERATOR")
                .metadata(Map.of("table", "postgres:public.users"))
                .build();

        // When
        String json = objectMapper.writeValueAsString(node);

        // Then
        assertThat(json).contains("\"id\":\"node-1\"");
        assertThat(json).contains("\"operatorType\":\"TableScan\"");
        assertThat(json).contains("\"nodeType\":\"OPERATOR\"");
    }

    @Test
    @DisplayName("Should deserialize from JSON correctly")
    void testDeserialization() throws Exception {
        // Given
        String json = """
            {
              "id": "node-1",
              "queryId": "query-123",
              "operatorType": "TableScan",
              "nodeType": "OPERATOR",
              "executionTime": 1500
            }
            """;

        // When
        QueryTreeNode node = objectMapper.readValue(json, QueryTreeNode.class);

        // Then
        assertThat(node.getId()).isEqualTo("node-1");
        assertThat(node.getQueryId()).isEqualTo("query-123");
        assertThat(node.getOperatorType()).isEqualTo("TableScan");
        assertThat(node.getExecutionTime()).isEqualTo(1500L);
    }

    @Test
    @DisplayName("Should handle children nodes")
    void testChildrenNodes() {
        // Given
        QueryTreeNode child1 = QueryTreeNode.builder()
                .id("child-1")
                .operatorType("Filter")
                .build();

        QueryTreeNode child2 = QueryTreeNode.builder()
                .id("child-2")
                .operatorType("Project")
                .build();

        List<QueryTreeNode> children = new ArrayList<>();
        children.add(child1);
        children.add(child2);

        // When
        QueryTreeNode parent = QueryTreeNode.builder()
                .id("parent")
                .operatorType("Join")
                .children(children)
                .build();

        // Then
        assertThat(parent.getChildren()).hasSize(2);
        assertThat(parent.getChildren().get(0).getId()).isEqualTo("child-1");
        assertThat(parent.getChildren().get(1).getId()).isEqualTo("child-2");
    }

    @Test
    @DisplayName("Should have empty children list by default")
    void testDefaultChildren() {
        // When
        QueryTreeNode node = QueryTreeNode.builder()
                .id("node-1")
                .build();

        // Then
        assertThat(node.getChildren()).isNotNull();
        assertThat(node.getChildren()).isEmpty();
    }

    @Test
    @DisplayName("Should handle metadata map")
    void testMetadata() {
        // Given
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("table", "postgres:public.orders");
        metadata.put("rowCount", 1000);
        metadata.put("columns", List.of("id", "name", "price"));

        // When
        QueryTreeNode node = QueryTreeNode.builder()
                .id("node-1")
                .metadata(metadata)
                .build();

        // Then
        assertThat(node.getMetadata()).containsEntry("table", "postgres:public.orders");
        assertThat(node.getMetadata()).containsEntry("rowCount", 1000);
        assertThat(node.getMetadata()).containsKey("columns");
    }

    @Test
    @DisplayName("Should support equals and hashCode")
    void testEqualsAndHashCode() {
        // Given
        QueryTreeNode node1 = QueryTreeNode.builder()
                .id("node-1")
                .operatorType("TableScan")
                .build();

        QueryTreeNode node2 = QueryTreeNode.builder()
                .id("node-1")
                .operatorType("TableScan")
                .build();

        QueryTreeNode node3 = QueryTreeNode.builder()
                .id("node-2")
                .operatorType("Filter")
                .build();

        // Then
        assertThat(node1).isEqualTo(node2);
        assertThat(node1).isNotEqualTo(node3);
        assertThat(node1.hashCode()).isEqualTo(node2.hashCode());
    }

    @Test
    @DisplayName("Should handle null values gracefully")
    void testNullValues() {
        // When
        QueryTreeNode node = QueryTreeNode.builder()
                .id("node-1")
                .errorMessage(null)
                .warnings(null)
                .metadata(null)
                .build();

        // Then
        assertThat(node.getId()).isEqualTo("node-1");
        assertThat(node.getErrorMessage()).isNull();
        assertThat(node.getWarnings()).isNull();
        assertThat(node.getMetadata()).isNull();
    }
}
