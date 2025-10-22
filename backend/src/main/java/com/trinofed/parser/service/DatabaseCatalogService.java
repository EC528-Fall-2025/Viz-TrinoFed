package com.trinofed.parser.service;

import com.trinofed.parser.model.Database;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class DatabaseCatalogService {

    private final DatabaseService databaseService;
    private final Map<String, Database> catalogCache = new ConcurrentHashMap<>();
    private long lastRefreshTime = 0;
    private static final long CACHE_REFRESH_INTERVAL = 5000; // Reduced to 5 seconds

    @Autowired
    public DatabaseCatalogService(DatabaseService databaseService) {
        this.databaseService = databaseService;
    }

    public List<Database> getAllDatabases() {
        log.info("Getting all databases from catalog service");
        
        // Always get fresh data from DatabaseService since it's already cached there
        List<Database> databases = databaseService.getAllDatabases().stream()
            .filter(db -> !isSystemCatalog(db.getId()))
            .collect(java.util.stream.Collectors.toList());
        
        log.info("Returning {} databases (excluding system)", databases.size());
        return databases;
    }

    public Database getDatabaseById(String catalogId) {
        log.debug("Getting database by catalog id: {}", catalogId);
        
        // Get directly from DatabaseService for immediate results
        return databaseService.getDatabaseById(catalogId);
    }

    public void refreshCatalogCache() {
        log.info("Refreshing catalog cache from discovered databases");
        
        try {
            // Get all discovered databases from DatabaseService
            List<Database> discoveredDatabases = databaseService.getAllDatabases();
            
            // Update cache with discovered databases
            catalogCache.clear();
            for (Database database : discoveredDatabases) {
                if (database.getId() != null) {
                    catalogCache.put(database.getId(), database);
                }
            }
            
            lastRefreshTime = System.currentTimeMillis();
            log.info("Catalog cache refreshed with {} discovered catalogs", catalogCache.size());
            
        } catch (Exception e) {
            log.error("Error refreshing catalog cache", e);
        }
    }

    private boolean shouldRefreshCache() {
        return (System.currentTimeMillis() - lastRefreshTime) > CACHE_REFRESH_INTERVAL;
    }

    private boolean isSystemCatalog(String catalogId) {
        if (catalogId == null) return false;
        String lowerCatalogId = catalogId.toLowerCase();
        return lowerCatalogId.equals("system") || 
               lowerCatalogId.equals("information_schema") ||
               lowerCatalogId.startsWith("$");
    }

    public void addCatalog(Database catalog) {
        if (catalog != null && catalog.getId() != null) {
            catalogCache.put(catalog.getId(), catalog);
            databaseService.addDatabase(catalog);
            log.info("Added catalog: {}", catalog.getId());
        }
    }

    public void removeCatalog(String catalogId) {
        catalogCache.remove(catalogId);
        databaseService.removeDatabase(catalogId);
        log.info("Removed catalog: {}", catalogId);
    }

    public boolean catalogExists(String catalogId) {
        return catalogCache.containsKey(catalogId);
    }

    public int getTotalCatalogs() {
        return catalogCache.size();
    }

    // Force refresh when new data is discovered
    public void invalidateCache() {
        lastRefreshTime = 0;
        log.debug("Catalog cache invalidated");
    }
}
