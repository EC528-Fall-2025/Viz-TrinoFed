package com.trinofed.parser.controller;

import com.trinofed.parser.model.Database;
import com.trinofed.parser.model.Database.Schema;
import com.trinofed.parser.service.DatabaseCatalogService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Slf4j
@RestController
@RequestMapping("/api/databases")
@CrossOrigin(origins = "http://localhost:5173")
public class DatabaseController {

    private final DatabaseCatalogService databaseCatalogService;

    @Autowired
    public DatabaseController(DatabaseCatalogService databaseCatalogService) {
        this.databaseCatalogService = databaseCatalogService;
    }

    @GetMapping
    public ResponseEntity<List<Database>> getAllDatabases() {
        log.info("Fetching all databases");
        try {
            List<Database> databases = databaseCatalogService.getAllDatabases();
            log.info("Returning {} databases", databases.size());
            return ResponseEntity.ok(databases);
        } catch (Exception e) {
            log.error("Error fetching databases", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/immediate")
    public ResponseEntity<List<Database>> getDatabasesImmediate() {
        log.info("Fetching databases with immediate refresh");
        try {
            // Force refresh and return immediately
            databaseCatalogService.invalidateCache();
            List<Database> databases = databaseCatalogService.getAllDatabases();
            log.info("Returning {} databases (immediate)", databases.size());
            return ResponseEntity.ok(databases);
        } catch (Exception e) {
            log.error("Error fetching databases immediately", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Database> getDatabaseById(@PathVariable String id) {
        log.info("Fetching database with id: {}", id);
        try {
            Database database = databaseCatalogService.getDatabaseById(id);
            
            if (database == null) {
                log.warn("Database with id {} not found", id);
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(database);
        } catch (Exception e) {
            log.error("Error fetching database with id: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}/schemas")
    public ResponseEntity<List<Schema>> getSchemas(@PathVariable String id) {
        log.info("Fetching schemas for database: {}", id);
        try {
            Database database = databaseCatalogService.getDatabaseById(id);
            
            if (database == null) {
                log.warn("Database with id {} not found", id);
                return ResponseEntity.notFound().build();
            }
            
            List<Schema> schemas = database.getSchemas();
            return ResponseEntity.ok(schemas);
        } catch (Exception e) {
            log.error("Error fetching schemas for database: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<String> refreshDatabases() {
        log.info("Manual refresh of database catalog requested");
        try {
            databaseCatalogService.refreshCatalogCache();
            return ResponseEntity.ok("Database catalog refreshed successfully");
        } catch (Exception e) {
            log.error("Error refreshing database catalog", e);
            return ResponseEntity.internalServerError().body("Error refreshing database catalog");
        }
    }

    @GetMapping("/debug")
    public ResponseEntity<Map<String, Object>> getDebugInfo() {
        log.info("Getting database debug info");
        try {
            Map<String, Object> debugInfo = new HashMap<>();
            debugInfo.put("totalCatalogs", databaseCatalogService.getTotalCatalogs());
            debugInfo.put("catalogExists", databaseCatalogService.catalogExists("mongodb"));
            debugInfo.put("allDatabases", databaseCatalogService.getAllDatabases().stream()
                    .map(db -> Map.of("id", db.getId(), "type", db.getType(), "name", db.getName()))
                    .collect(java.util.stream.Collectors.toList()));
            return ResponseEntity.ok(debugInfo);
        } catch (Exception e) {
            log.error("Error getting debug info", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
