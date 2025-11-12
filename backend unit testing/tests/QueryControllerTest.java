package com.trinofed.parser.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trinofed.parser.model.QueryTree;
import com.trinofed.parser.model.QueryTreeNode;
import com.trinofed.parser.service.QueryEventService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

/**
 * Unit tests for QueryController
 * Tests REST API endpoints for query retrieval
 */
@WebMvcTest(QueryController.class)
class QueryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private QueryEventService queryEventService;

    @Test
    @DisplayName("GET /api/queries - Should return all queries")
    void testGetAllQueries() throws Exception {
        // Given
        List<QueryTree> mockTrees = Arrays.asList(
                createMockQueryTree("query-1", "SELECT * FROM users"),
                createMockQueryTree("query-2", "SELECT * FROM orders")
        );
        when(queryEventService.getAllQueryTrees()).thenReturn(mockTrees);

        // When & Then
        mockMvc.perform(get("/api/queries")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].queryId", is("query-1")))
                .andExpect(jsonPath("$[1].queryId", is("query-2")));

        verify(queryEventService).getAllQueryTrees();
    }

    @Test
    @DisplayName("GET /api/queries - Should return empty list when no queries exist")
    void testGetAllQueriesEmpty() throws Exception {
        // Given
        when(queryEventService.getAllQueryTrees()).thenReturn(new ArrayList<>());

        // When & Then
        mockMvc.perform(get("/api/queries")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("GET /api/queries/{queryId} - Should return specific query")
    void testGetQueryById() throws Exception {
        // Given
        String queryId = "query-123";
        QueryTree mockTree = createMockQueryTree(queryId, "SELECT * FROM customers");
        when(queryEventService.getQueryTree(queryId)).thenReturn(mockTree);

        // When & Then
        mockMvc.perform(get("/api/queries/{queryId}", queryId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.queryId", is(queryId)))
                .andExpect(jsonPath("$.query", is("SELECT * FROM customers")))
                .andExpect(jsonPath("$.state", is("FINISHED")));

        verify(queryEventService).getQueryTree(queryId);
    }

    @Test
    @DisplayName("GET /api/queries/{queryId} - Should return 404 for non-existent query")
    void testGetQueryByIdNotFound() throws Exception {
        // Given
        String queryId = "non-existent-id";
        when(queryEventService.getQueryTree(queryId)).thenReturn(null);

        // When & Then
        mockMvc.perform(get("/api/queries/{queryId}", queryId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());

        verify(queryEventService).getQueryTree(queryId);
    }

    @Test
    @DisplayName("GET /api/queries/ids - Should return all query IDs")
    void testGetAllQueryIds() throws Exception {
        // Given
        List<String> mockIds = Arrays.asList("query-1", "query-2", "query-3");
        when(queryEventService.getAllQueryIds()).thenReturn(mockIds);

        // When & Then
        mockMvc.perform(get("/api/queries/ids")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0]", is("query-1")))
                .andExpect(jsonPath("$[1]", is("query-2")))
                .andExpect(jsonPath("$[2]", is("query-3")));

        verify(queryEventService).getAllQueryIds();
    }

    @Test
    @DisplayName("GET /api/queries/ids - Should return empty list when no queries exist")
    void testGetAllQueryIdsEmpty() throws Exception {
        // Given
        when(queryEventService.getAllQueryIds()).thenReturn(new ArrayList<>());

        // When & Then
        mockMvc.perform(get("/api/queries/ids")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("GET /api/queries/{queryId} - Should handle special characters in query ID")
    void testGetQueryWithSpecialCharacters() throws Exception {
        // Given
        String queryId = "query-123-abc";
        QueryTree mockTree = createMockQueryTree(queryId, "SELECT 1");
        when(queryEventService.getQueryTree(queryId)).thenReturn(mockTree);

        // When & Then
        mockMvc.perform(get("/api/queries/{queryId}", queryId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.queryId", is(queryId)));
    }

    @Test
    @DisplayName("Should handle CORS correctly")
    void testCorsConfiguration() throws Exception {
        // Given
        List<QueryTree> mockTrees = new ArrayList<>();
        when(queryEventService.getAllQueryTrees()).thenReturn(mockTrees);

        // When & Then
        mockMvc.perform(get("/api/queries")
                        .header("Origin", "http://localhost:5173")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(header().exists("Access-Control-Allow-Origin"));
    }

    // Helper method
    private QueryTree createMockQueryTree(String queryId, String query) {
        QueryTreeNode root = QueryTreeNode.builder()
                .id("root-node")
                .operatorType("Output")
                .nodeType("OPERATOR")
                .metadata(new HashMap<>())
                .build();

        return QueryTree.builder()
                .queryId(queryId)
                .query(query)
                .user("test-user")
                .state("FINISHED")
                .startTime(Instant.now())
                .endTime(Instant.now())
                .totalExecutionTime(1000L)
                .root(root)
                .events(new ArrayList<>())
                .build();
    }
}
