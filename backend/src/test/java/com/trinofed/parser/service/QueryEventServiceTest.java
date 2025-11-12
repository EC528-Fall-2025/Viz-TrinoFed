package com.trinofed.parser.service;

import com.trinofed.parser.model.QueryEvent;
import com.trinofed.parser.model.QueryTree;
import com.trinofed.parser.model.QueryTreeNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for QueryEventService
 * Tests event processing, query tree building, and data retrieval
 */
@ExtendWith(MockitoExtension.class)
class QueryEventServiceTest {

    @Mock(lenient = true)
    private SimpMessagingTemplate messagingTemplate;

    @Mock(lenient = true)
    private DatabaseService databaseService;

    @Mock(lenient = true)
    private QueryPlanParser queryPlanParser;

    private QueryEventService service;

    @BeforeEach
    void setUp() {
        service = new QueryEventService(messagingTemplate, databaseService, queryPlanParser);
        // Setup lenient default behavior
        lenient().when(queryPlanParser.parseJsonPlan(any())).thenReturn(createSampleTreeNode());
    }

    @Test
    @DisplayName("Should store and retrieve query event by ID")
    void testStoreAndRetrieveQueryEvent() {
        // Given
        QueryEvent event = createSampleEvent("query-123", "RUNNING");

        // When
        service.processEvent(event);
        QueryTree tree = service.getQueryTree("query-123");

        // Then
        assertThat(tree).isNotNull();
        assertThat(tree.getQueryId()).isEqualTo("query-123");
        assertThat(tree.getState()).isEqualTo("RUNNING");
        assertThat(tree.getQuery()).isEqualTo("SELECT * FROM users");
        verify(messagingTemplate, atLeastOnce()).convertAndSend(eq("/topic/query-updates"), any(QueryTree.class));
    }

    @Test
    @DisplayName("Should return null for non-existent query ID")
    void testGetNonExistentQuery() {
        // When
        QueryTree tree = service.getQueryTree("non-existent-id");

        // Then
        assertThat(tree).isNull();
    }

    @Test
    @DisplayName("Should track multiple events for same query")
    void testMultipleEventsForSameQuery() {
        // Given
        QueryEvent event1 = createSampleEvent("query-123", "QUEUED");
        QueryEvent event2 = createSampleEvent("query-123", "RUNNING");
        QueryEvent event3 = createSampleEvent("query-123", "FINISHED");

        // When
        service.processEvent(event1);
        service.processEvent(event2);
        service.processEvent(event3);
        QueryTree tree = service.getQueryTree("query-123");

        // Then
        assertThat(tree).isNotNull();
        assertThat(tree.getState()).isEqualTo("FINISHED");
        assertThat(tree.getEvents()).hasSize(3);
        verify(messagingTemplate, times(3)).convertAndSend(eq("/topic/query-updates"), any(QueryTree.class));
    }

    @Test
    @DisplayName("Should retrieve all query IDs")
    void testGetAllQueryIds() {
        // Given
        QueryEvent event1 = createSampleEvent("query-1", "FINISHED");
        QueryEvent event2 = createSampleEvent("query-2", "RUNNING");
        QueryEvent event3 = createSampleEvent("query-3", "FAILED");

        // When
        service.processEvent(event1);
        service.processEvent(event2);
        service.processEvent(event3);
        List<String> queryIds = service.getAllQueryIds();

        // Then
        assertThat(queryIds).hasSize(3);
        assertThat(queryIds).containsExactlyInAnyOrder("query-1", "query-2", "query-3");
    }

    @Test
    @DisplayName("Should retrieve all query trees")
    void testGetAllQueryTrees() {
        // Given
        QueryEvent event1 = createSampleEvent("query-1", "FINISHED");
        QueryEvent event2 = createSampleEvent("query-2", "RUNNING");

        // When
        service.processEvent(event1);
        service.processEvent(event2);
        List<QueryTree> trees = service.getAllQueryTrees();

        // Then
        assertThat(trees).hasSize(2);
        assertThat(trees.stream().map(QueryTree::getQueryId))
                .containsExactlyInAnyOrder("query-1", "query-2");
    }

    @Test
    @DisplayName("Should track queries by catalog")
    void testGetQueriesByCatalog() {
        // Given
        QueryEvent event1 = createEventWithCatalog("query-1", "postgres");
        QueryEvent event2 = createEventWithCatalog("query-2", "postgres");
        QueryEvent event3 = createEventWithCatalog("query-3", "mongodb");

        // When
        service.processEvent(event1);
        service.processEvent(event2);
        service.processEvent(event3);
        List<QueryTree> postgresTrees = service.getQueriesByCatalog("postgres");
        List<QueryTree> mongoTrees = service.getQueriesByCatalog("mongodb");

        // Then
        assertThat(postgresTrees).hasSize(2);
        assertThat(mongoTrees).hasSize(1);
    }

    @Test
    @DisplayName("Should track queries by schema")
    void testGetQueriesBySchema() {
        // Given
        QueryEvent event1 = createEventWithSchema("query-1", "postgres", "public");
        QueryEvent event2 = createEventWithSchema("query-2", "postgres", "public");
        QueryEvent event3 = createEventWithSchema("query-3", "postgres", "analytics");

        // When
        service.processEvent(event1);
        service.processEvent(event2);
        service.processEvent(event3);
        List<QueryTree> publicTrees = service.getQueriesBySchema("postgres.public");

        // Then
        assertThat(publicTrees).hasSize(2);
    }

    @Test
    @DisplayName("Should track queries by table")
    void testGetQueriesByTable() {
        // Given
        QueryEvent event1 = createEventWithTable("query-1", "postgres", "public", "users");
        QueryEvent event2 = createEventWithTable("query-2", "postgres", "public", "users");
        QueryEvent event3 = createEventWithTable("query-3", "postgres", "public", "orders");

        // When
        service.processEvent(event1);
        service.processEvent(event2);
        service.processEvent(event3);
        List<QueryTree> usersTrees = service.getQueriesByTable("postgres.public.users");

        // Then
        assertThat(usersTrees).hasSize(2);
    }

    @Test
    @DisplayName("Should provide database summary")
    void testGetDatabaseSummary() {
        // Given
        QueryEvent event1 = createEventWithTable("query-1", "postgres", "public", "users");
        QueryEvent event2 = createEventWithTable("query-2", "mongodb", "sales", "customers");

        // When
        service.processEvent(event1);
        service.processEvent(event2);
        Map<String, Object> summary = service.getDatabaseSummary();

        // Then
        assertThat(summary).containsKeys("catalogs", "schemas", "tables", "totalQueries", "catalogQueryCounts");

        @SuppressWarnings("unchecked")
        List<String> catalogs = (List<String>) summary.get("catalogs");
        assertThat(catalogs).hasSize(2);
        assertThat(catalogs).containsExactlyInAnyOrder("postgres", "mongodb");

        assertThat(summary.get("totalQueries")).isEqualTo(2);
    }

    @Test
    @DisplayName("Should call database service when processing event")
    void testDatabaseServiceIntegration() {
        // Given
        QueryEvent event = createSampleEvent("query-123", "RUNNING");

        // When
        service.processEvent(event);

        // Then
        verify(databaseService, atLeastOnce()).processEvent(event);
    }

    @Test
    @DisplayName("Should parse JSON plan when available")
    void testJsonPlanParsing() {
        // Given
        String jsonPlan = "{\"0\": {\"id\": \"0\", \"name\": \"Output\"}}";
        QueryEvent event = createSampleEvent("query-123", "RUNNING");
        event.setJsonPlan(jsonPlan);

        QueryTreeNode mockNode = createSampleTreeNode();
        when(queryPlanParser.parseJsonPlan(jsonPlan)).thenReturn(mockNode);

        // When
        service.processEvent(event);
        QueryTree tree = service.getQueryTree("query-123");

        // Then
        verify(queryPlanParser, atLeastOnce()).parseJsonPlan(jsonPlan);
        assertThat(tree.getRoot()).isNotNull();
        assertThat(tree.getRoot().getOperatorType()).isEqualTo("TableScan");
    }

    @Test
    @DisplayName("Should handle events without JSON plan gracefully")
    void testEventWithoutJsonPlan() {
        // Given
        QueryEvent event = createSampleEvent("query-123", "RUNNING");
        event.setJsonPlan(null);

        // When
        service.processEvent(event);
        QueryTree tree = service.getQueryTree("query-123");

        // Then
        assertThat(tree).isNotNull();
        assertThat(tree.getQueryId()).isEqualTo("query-123");
    }

    @Test
    @DisplayName("Should return empty list for non-existent catalog")
    void testGetQueriesByNonExistentCatalog() {
        // When
        List<QueryTree> trees = service.getQueriesByCatalog("non-existent");

        // Then
        assertThat(trees).isEmpty();
    }

    // Helper methods

    private QueryEvent createSampleEvent(String queryId, String state) {
        return QueryEvent.builder()
                .queryId(queryId)
                .query("SELECT * FROM users")
                .user("test-user")
                .state(state)
                .eventType("QueryCreated")
                .timestamp(Instant.now())
                .executionTime(1000L)
                .cpuTime(500L)
                .wallTime(800L)
                .peakMemoryBytes(1024L * 1024L)
                .totalRows(100L)
                .totalBytes(5000L)
                .metadata(new HashMap<>())
                .build();
    }

    private QueryEvent createEventWithCatalog(String queryId, String catalog) {
        QueryEvent event = createSampleEvent(queryId, "FINISHED");
        event.setCatalog(catalog);
        return event;
    }

    private QueryEvent createEventWithSchema(String queryId, String catalog, String schema) {
        QueryEvent event = createSampleEvent(queryId, "FINISHED");
        event.setCatalog(catalog);
        event.setSchema(schema);
        return event;
    }

    private QueryEvent createEventWithTable(String queryId, String catalog, String schema, String table) {
        QueryEvent event = createSampleEvent(queryId, "FINISHED");
        event.setCatalog(catalog);
        event.setSchema(schema);
        event.setTableName(table);
        return event;
    }

    private QueryTreeNode createSampleTreeNode() {
        return QueryTreeNode.builder()
                .id("node-1")
                .operatorType("TableScan")
                .nodeType("OPERATOR")
                .metadata(new HashMap<>())
                .build();
    }
}
