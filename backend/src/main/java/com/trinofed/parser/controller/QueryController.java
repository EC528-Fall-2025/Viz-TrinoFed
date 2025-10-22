package com.trinofed.parser.controller;

import com.trinofed.parser.model.QueryTree;
import com.trinofed.parser.service.QueryEventService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/queries")
@CrossOrigin(origins = "http://localhost:5173")
public class QueryController {

    private final QueryEventService queryEventService;

    @Autowired
    public QueryController(QueryEventService queryEventService) {
        this.queryEventService = queryEventService;
    }

    @GetMapping
    public ResponseEntity<List<QueryTree>> getAllQueries() {
        log.info("Fetching all query trees");
        List<QueryTree> trees = queryEventService.getAllQueryTrees();
        return ResponseEntity.ok(trees);
    }

    @GetMapping("/{queryId}")
    public ResponseEntity<QueryTree> getQueryById(@PathVariable String queryId) {
        log.info("Fetching query tree for queryId: {}", queryId);
        QueryTree tree = queryEventService.getQueryTree(queryId);

        if (tree == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(tree);
    }

    @GetMapping("/ids")
    public ResponseEntity<List<String>> getAllQueryIds() {
        log.info("Fetching all query IDs");
        List<String> queryIds = queryEventService.getAllQueryIds();
        return ResponseEntity.ok(queryIds);
    }
}
