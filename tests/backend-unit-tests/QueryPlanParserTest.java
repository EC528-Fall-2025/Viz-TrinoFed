package com.trinofed.parser.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trinofed.parser.model.QueryTreeNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for QueryPlanParser
 * Tests JSON plan parsing, tree node conversion, and operator extraction
 */
class QueryPlanParserTest {

    private QueryPlanParser parser;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        parser = new QueryPlanParser(objectMapper);
    }

    @Test
    @DisplayName("Should parse simple SELECT query plan successfully")
    void testParseSimpleSelectQuery() {
        // Given
        String jsonPlan = """
            {
              "0": {
                "id": "0",
                "name": "Output",
                "descriptor": {},
                "outputs": [
                  {"name": "customer_id", "type": "integer"},
                  {"name": "customer_name", "type": "varchar"}
                ],
                "details": [],
                "estimates": [
                  {
                    "outputRowCount": 1000.0,
                    "outputSizeInBytes": 50000.0,
                    "cpuCost": 50000.0,
                    "memoryCost": 0.0,
                    "networkCost": 0.0
                  }
                ],
                "children": [
                  {
                    "id": "1",
                    "name": "TableScan",
                    "descriptor": {"table": "postgres:public.customers"},
                    "outputs": [
                      {"name": "customer_id", "type": "integer"},
                      {"name": "customer_name", "type": "varchar"}
                    ],
                    "details": ["Layout: postgres:public.customers"],
                    "estimates": [
                      {
                        "outputRowCount": 1000.0,
                        "outputSizeInBytes": 50000.0,
                        "cpuCost": 50000.0,
                        "memoryCost": 0.0,
                        "networkCost": 0.0
                      }
                    ],
                    "children": []
                  }
                ]
              }
            }
            """;

        // When
        QueryTreeNode root = parser.parseJsonPlan(jsonPlan);

        // Then
        assertThat(root).isNotNull();
        assertThat(root.getId()).isEqualTo("0");
        assertThat(root.getOperatorType()).isEqualTo("Output");
        assertThat(root.getNodeType()).isEqualTo("OPERATOR");
        assertThat(root.getChildren()).hasSize(1);

        // Check child node
        QueryTreeNode child = root.getChildren().get(0);
        assertThat(child.getId()).isEqualTo("1");
        assertThat(child.getOperatorType()).isEqualTo("TableScan");
        assertThat(child.getMetadata()).containsKey("table");
        assertThat(child.getMetadata().get("table")).isEqualTo("postgres:public.customers");
    }

    @Test
    @DisplayName("Should parse JOIN query plan with multiple children")
    void testParseJoinQuery() {
        // Given
        String jsonPlan = """
            {
              "0": {
                "id": "0",
                "name": "Output",
                "descriptor": {},
                "outputs": [{"name": "result", "type": "varchar"}],
                "details": [],
                "estimates": [{"outputRowCount": 5000.0, "outputSizeInBytes": 250000.0, "cpuCost": 300000.0, "memoryCost": 100000.0, "networkCost": 50000.0}],
                "children": [
                  {
                    "id": "1",
                    "name": "InnerJoin",
                    "descriptor": {"criteria": "orders.customer_id = customers.id"},
                    "outputs": [],
                    "details": ["Join Distribution: PARTITIONED"],
                    "estimates": [{"outputRowCount": 5000.0, "outputSizeInBytes": 250000.0, "cpuCost": 300000.0, "memoryCost": 100000.0, "networkCost": 50000.0}],
                    "children": [
                      {
                        "id": "2",
                        "name": "TableScan",
                        "descriptor": {"table": "postgres:public.orders"},
                        "outputs": [],
                        "details": [],
                        "estimates": [{"outputRowCount": 5000.0, "outputSizeInBytes": 150000.0, "cpuCost": 150000.0, "memoryCost": 0.0, "networkCost": 0.0}],
                        "children": []
                      },
                      {
                        "id": "3",
                        "name": "TableScan",
                        "descriptor": {"table": "mongodb:sales.customers"},
                        "outputs": [],
                        "details": [],
                        "estimates": [{"outputRowCount": 1000.0, "outputSizeInBytes": 50000.0, "cpuCost": 50000.0, "memoryCost": 0.0, "networkCost": 0.0}],
                        "children": []
                      }
                    ]
                  }
                ]
              }
            }
            """;

        // When
        QueryTreeNode root = parser.parseJsonPlan(jsonPlan);

        // Then
        assertThat(root).isNotNull();
        assertThat(root.getOperatorType()).isEqualTo("Output");
        assertThat(root.getChildren()).hasSize(1);

        QueryTreeNode joinNode = root.getChildren().get(0);
        assertThat(joinNode.getOperatorType()).isEqualTo("InnerJoin");
        assertThat(joinNode.getChildren()).hasSize(2);

        assertThat(joinNode.getChildren().get(0).getOperatorType()).isEqualTo("TableScan");
        assertThat(joinNode.getChildren().get(1).getOperatorType()).isEqualTo("TableScan");
    }

    @Test
    @DisplayName("Should handle null input gracefully")
    void testParseNullInput() {
        // When
        QueryTreeNode result = parser.parseJsonPlan(null);

        // Then
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("Should handle empty string input")
    void testParseEmptyString() {
        // When
        QueryTreeNode result = parser.parseJsonPlan("");

        // Then
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("Should handle whitespace-only input")
    void testParseWhitespaceInput() {
        // When
        QueryTreeNode result = parser.parseJsonPlan("   \n\t  ");

        // Then
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("Should handle malformed JSON gracefully")
    void testParseMalformedJson() {
        // Given
        String malformedJson = "{\"0\": {\"id\": \"0\", \"name\": \"Output\" // missing closing braces";

        // When
        QueryTreeNode result = parser.parseJsonPlan(malformedJson);

        // Then
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("Should extract cost estimates correctly")
    void testExtractCostEstimates() {
        // Given
        String jsonPlan = """
            {
              "0": {
                "id": "0",
                "name": "Output",
                "descriptor": {},
                "outputs": [],
                "details": [],
                "estimates": [
                  {
                    "outputRowCount": 2500.0,
                    "outputSizeInBytes": 125000.0,
                    "cpuCost": 75000.0,
                    "memoryCost": 25000.0,
                    "networkCost": 10000.0
                  }
                ],
                "children": []
              }
            }
            """;

        // When
        QueryTreeNode root = parser.parseJsonPlan(jsonPlan);

        // Then
        assertThat(root).isNotNull();
        assertThat(root.getMetadata()).containsKey("estimates");

        @SuppressWarnings("unchecked")
        Map<String, Object> estimates = (Map<String, Object>) root.getMetadata().get("estimates");
        assertThat(estimates.get("outputRowCount")).asString().isEqualTo("2500.0");
        assertThat(estimates.get("outputSizeInBytes")).asString().isEqualTo("125000.0");
        assertThat(estimates.get("cpuCost")).asString().isEqualTo("75000.0");
        assertThat(estimates.get("memoryCost")).asString().isEqualTo("25000.0");
        assertThat(estimates.get("networkCost")).asString().isEqualTo("10000.0");
    }

    @Test
    @DisplayName("Should extract operator list from simple query")
    void testExtractOperatorListSimple() {
        // Given
        String jsonPlan = """
            {
              "0": {
                "id": "0",
                "name": "Output",
                "descriptor": {},
                "outputs": [],
                "details": [],
                "estimates": [],
                "children": [
                  {
                    "id": "1",
                    "name": "TableScan",
                    "descriptor": {},
                    "outputs": [],
                    "details": [],
                    "estimates": [],
                    "children": []
                  }
                ]
              }
            }
            """;

        // When
        List<String> operators = parser.extractOperatorList(jsonPlan);

        // Then
        assertThat(operators).hasSize(2);
        assertThat(operators).containsExactly("Output", "TableScan");
    }

    @Test
    @DisplayName("Should extract operator list from complex query")
    void testExtractOperatorListComplex() {
        // Given
        String jsonPlan = """
            {
              "0": {
                "id": "0",
                "name": "Output",
                "descriptor": {},
                "outputs": [],
                "details": [],
                "estimates": [],
                "children": [
                  {
                    "id": "1",
                    "name": "InnerJoin",
                    "descriptor": {},
                    "outputs": [],
                    "details": [],
                    "estimates": [],
                    "children": [
                      {
                        "id": "2",
                        "name": "TableScan",
                        "descriptor": {},
                        "outputs": [],
                        "details": [],
                        "estimates": [],
                        "children": []
                      },
                      {
                        "id": "3",
                        "name": "Filter",
                        "descriptor": {},
                        "outputs": [],
                        "details": [],
                        "estimates": [],
                        "children": [
                          {
                            "id": "4",
                            "name": "TableScan",
                            "descriptor": {},
                            "outputs": [],
                            "details": [],
                            "estimates": [],
                            "children": []
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            }
            """;

        // When
        List<String> operators = parser.extractOperatorList(jsonPlan);

        // Then
        assertThat(operators).hasSize(5);
        assertThat(operators).contains("Output", "InnerJoin", "TableScan", "Filter");
    }

    @Test
    @DisplayName("Should return empty list for null input in extractOperatorList")
    void testExtractOperatorListNullInput() {
        // When
        List<String> operators = parser.extractOperatorList(null);

        // Then
        assertThat(operators).isEmpty();
    }

    @Test
    @DisplayName("Should extract table information from TableScan nodes")
    void testExtractTableInformation() {
        // Given
        String jsonPlan = """
            {
              "0": {
                "id": "0",
                "name": "TableScan",
                "descriptor": {
                  "table": "postgres:public.users"
                },
                "outputs": [],
                "details": [],
                "estimates": [],
                "children": []
              }
            }
            """;

        // When
        QueryTreeNode root = parser.parseJsonPlan(jsonPlan);

        // Then
        assertThat(root).isNotNull();
        assertThat(root.getMetadata()).containsEntry("table", "postgres:public.users");
    }

    @Test
    @DisplayName("Should handle missing fragment '0' by using first available")
    void testMissingFragmentZero() {
        // Given
        String jsonPlan = """
            {
              "1": {
                "id": "1",
                "name": "Output",
                "descriptor": {},
                "outputs": [],
                "details": [],
                "estimates": [],
                "children": []
              }
            }
            """;

        // When
        QueryTreeNode root = parser.parseJsonPlan(jsonPlan);

        // Then
        assertThat(root).isNotNull();
        assertThat(root.getOperatorType()).isEqualTo("Output");
    }
}
