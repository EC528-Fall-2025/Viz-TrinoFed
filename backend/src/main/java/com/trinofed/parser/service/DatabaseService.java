package com.trinofed.parser.service;

import com.trinofed.parser.model.Database;
import com.trinofed.parser.model.Database.Schema;
import com.trinofed.parser.model.Database.Table;
import com.trinofed.parser.model.Database.Column;
import com.trinofed.parser.model.QueryEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
public class DatabaseService {

    private final Map<String, Database> databases = new ConcurrentHashMap<>();
    private final Map<String, Integer> queryCountsByDatabase = new ConcurrentHashMap<>();

    public void processEvent(QueryEvent event) {
        if (event == null || event.getQueryId() == null) {
            return;
        }

        // Extract database information from inputs
        if (event.getInputs() != null) {
            processInputs(event.getInputs(), event.getTimestamp());
        }

        // Extract from io metadata
        if (event.getMetadata() != null && event.getMetadata().containsKey("inputs")) {
            try {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> inputs = (List<Map<String, Object>>) event.getMetadata().get("inputs");
                if (inputs != null) {
                    for (Map<String, Object> input : inputs) {
                        processInputMetadata(input, event.getTimestamp());
                    }
                }
            } catch (ClassCastException e) {
                log.warn("Failed to process input metadata: {}", e.getMessage());
            }
        }

        // Try to extract from Trino plan if available
        if (event.getPlan() != null) {
            extractDatabasesFromPlan(event.getPlan(), event.getTimestamp());
        }

        // Extract from primary catalog/schema/table fields
        if (event.getCatalog() != null) {
            Map<String, Object> syntheticInput = new HashMap<>();
            syntheticInput.put("catalogName", event.getCatalog());
            if (event.getSchema() != null) {
                syntheticInput.put("schema", event.getSchema());
            }
            if (event.getTableName() != null) {
                syntheticInput.put("table", event.getTableName());
            }
            processInputMetadata(syntheticInput, event.getTimestamp());
        }
    }

    @SuppressWarnings("unchecked")
    private void processInputs(Map<String, Object> inputs, Instant timestamp) {
        try {
            if (inputs.containsKey("inputs") && inputs.get("inputs") instanceof List) {
                List<Map<String, Object>> inputsList = (List<Map<String, Object>>) inputs.get("inputs");

                for (Map<String, Object> input : inputsList) {
                    processInputMetadata(input, timestamp);
                }
            }
        } catch (Exception e) {
            log.warn("Error processing inputs: {}", e.getMessage());
        }
    }

    private void processInputMetadata(Map<String, Object> input, Instant timestamp) {
        try {
            String catalogName = getStringValue(input, "catalogName", "connectorName");
            String schemaName = getStringValue(input, "schema");
            String tableName = getStringValue(input, "table");

            if (catalogName != null) {
                String dbType = guessDbType(catalogName);
                
                Database database = databases.computeIfAbsent(catalogName, k ->
                        Database.builder()
                                .id(catalogName)
                                .name(catalogName)
                                .type(dbType)
                                .firstSeen(timestamp)
                                .lastSeen(timestamp)
                                .totalQueries(0)
                                .status("ACTIVE")
                                .build()
                );

                database.setLastSeen(timestamp);
                database.setTotalQueries(database.getTotalQueries() + 1);
                incrementQueryCount(catalogName);

                // Handle MongoDB differently - use collections instead of schemas/tables
                if ("mongodb".equals(dbType)) {
                    handleMongoDatabase(database, schemaName, tableName, input, timestamp);
                } else {
                    handleRelationalDatabase(database, schemaName, tableName, input, timestamp);
                }
            }
        } catch (Exception e) {
            log.warn("Error processing input metadata: {}", e.getMessage());
        }
    }

    private void handleMongoDatabase(Database database, String schemaName, String tableName, 
                                   Map<String, Object> input, Instant timestamp) {
        // For MongoDB in Trino:
        // - "schema" often represents the MongoDB database name (like "sample_db")
        // - "table" represents the collection name (like "products", "reviews")
        // We should ONLY create collections for MongoDB, never schemas
        
        String collectionName = null;
        
        // Priority order for determining collection name:
        // 1. tableName is the collection
        // 2. If no tableName but schemaName exists and isn't a system db, use schemaName as collection
        if (tableName != null && !tableName.isEmpty()) {
            collectionName = tableName;
        } else if (schemaName != null && !schemaName.isEmpty() && !isMongoSystemDatabase(schemaName)) {
            collectionName = schemaName;
        }
        
        log.debug("MongoDB processing - schema: '{}', table: '{}', resolved collection: '{}'", 
                 schemaName, tableName, collectionName);
        
        if (collectionName != null) {
            Database.Collection collection = database.getCollections().stream()
                    .filter(c -> collectionName.equals(c.getName()))
                    .findFirst()
                    .orElseGet(() -> {
                        Database.Collection newCollection = Database.Collection.builder()
                                .name(collectionName)
                                .firstSeen(timestamp)
                                .lastSeen(timestamp)
                                .totalQueries(0)
                                .build();
                        database.getCollections().add(newCollection);
                        log.info("Created MongoDB collection: '{}' in database: '{}'", collectionName, database.getId());
                        return newCollection;
                    });

            collection.setLastSeen(timestamp);
            collection.setTotalQueries(collection.getTotalQueries() + 1);

            // Process MongoDB fields if available
            if (input.containsKey("columns")) {
                processMongoFields(collection, input.get("columns"));
            }
        }
        
        // IMPORTANT: For MongoDB, we do NOT create schemas at all
        // This ensures MongoDB databases only show collections in the UI
    }

    private void handleRelationalDatabase(Database database, String schemaName, String tableName, 
                                        Map<String, Object> input, Instant timestamp) {
        // For relational databases, maintain the schema -> table hierarchy
        // PostgreSQL will have schemas like "public", "information_schema", etc.
        
        if (schemaName != null && !schemaName.isEmpty()) {
            // Skip system schemas for cleaner display (but keep "public" as it's the default)
            if (isSystemSchema(schemaName) && !schemaName.equals("public")) {
                log.debug("Skipping system schema: '{}'", schemaName);
                return;
            }
            
            Schema schema = database.getSchemas().stream()
                    .filter(s -> schemaName.equals(s.getName()))
                    .findFirst()
                    .orElseGet(() -> {
                        Schema newSchema = Schema.builder()
                                .name(schemaName)
                                .firstSeen(timestamp)
                                .lastSeen(timestamp)
                                .totalQueries(0)
                                .build();
                        database.getSchemas().add(newSchema);
                        log.info("Created schema: '{}' in database: '{}'", schemaName, database.getId());
                        return newSchema;
                    });

            schema.setLastSeen(timestamp);
            schema.setTotalQueries(schema.getTotalQueries() + 1);

            if (tableName != null && !tableName.isEmpty()) {
                // Skip system tables
                if (isSystemTable(tableName)) {
                    log.debug("Skipping system table: '{}'", tableName);
                    return;
                }
                
                Table table = schema.getTables().stream()
                        .filter(t -> tableName.equals(t.getName()))
                        .findFirst()
                        .orElseGet(() -> {
                            Table newTable = Table.builder()
                                    .name(tableName)
                                    .firstSeen(timestamp)
                                    .lastSeen(timestamp)
                                    .totalQueries(0)
                                    .build();
                            schema.getTables().add(newTable);
                            log.info("Created table: '{}' in schema: '{}' in database: '{}'", 
                                   tableName, schemaName, database.getId());
                            return newTable;
                        });

                table.setLastSeen(timestamp);
                table.setTotalQueries(table.getTotalQueries() + 1);

                // Process columns if available
                if (input.containsKey("columns")) {
                    processTableColumns(table, input.get("columns"));
                }
            }
        }
    }

    private boolean isMongoSystemDatabase(String databaseName) {
        if (databaseName == null) return false;
        String lower = databaseName.toLowerCase();
        return lower.equals("admin") || 
               lower.equals("local") || 
               lower.equals("config") ||
               lower.startsWith("system");
    }

    private boolean isSystemSchema(String schemaName) {
        if (schemaName == null) return false;
        String lower = schemaName.toLowerCase();
        return lower.equals("information_schema") || 
               lower.equals("pg_catalog") || 
               lower.equals("sys") || 
               lower.startsWith("pg_") ||
               lower.startsWith("mysql_") ||
               lower.startsWith("performance_");
    }

    private boolean isSystemTable(String tableName) {
        if (tableName == null) return false;
        String lower = tableName.toLowerCase();
        return lower.startsWith("pg_") || 
               lower.startsWith("information_") ||
               lower.startsWith("sys_") ||
               lower.startsWith("mysql_");
    }

    private void processMongoFields(Database.Collection collection, Object fieldsObj) {
        try {
            if (fieldsObj instanceof List) {
                List<?> fieldsList = (List<?>) fieldsObj;
                for (Object fieldObj : fieldsList) {
                    if (fieldObj instanceof Map) {
                        Map<?, ?> fieldMap = (Map<?, ?>) fieldObj;
                        String fieldName = fieldMap.get("name") != null ? fieldMap.get("name").toString() :
                                fieldMap.get("column") != null ? fieldMap.get("column").toString() : null;
                        String fieldType = fieldMap.get("type") != null ? fieldMap.get("type").toString() : null;

                        if (fieldName != null && !collection.getFields().stream().anyMatch(f -> fieldName.equals(f.getName()))) {
                            collection.getFields().add(Database.Field.builder()
                                    .name(fieldName)
                                    .type(fieldType)
                                    .nested(isNestedType(fieldType))
                                    .build());
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error processing MongoDB fields: {}", e.getMessage());
        }
    }

    private void processTableColumns(Table table, Object columnsObj) {
        try {
            if (columnsObj instanceof List) {
                List<?> columnsList = (List<?>) columnsObj;
                for (Object columnObj : columnsList) {
                    if (columnObj instanceof Map) {
                        Map<?, ?> columnMap = (Map<?, ?>) columnObj;
                        String columnName = columnMap.get("name") != null ? columnMap.get("name").toString() :
                                columnMap.get("column") != null ? columnMap.get("column").toString() : null;
                        String columnType = columnMap.get("type") != null ? columnMap.get("type").toString() : null;

                        if (columnName != null && !table.getColumns().stream().anyMatch(c -> columnName.equals(c.getName()))) {
                            table.getColumns().add(Column.builder()
                                    .name(columnName)
                                    .type(columnType)
                                    .build());
                        }
                    }
                }
            } else if (columnsObj instanceof Map) {
                Map<?, ?> columnsMap = (Map<?, ?>) columnsObj;
                for (Object key : columnsMap.keySet()) {
                    String columnName = key.toString();
                    Object value = columnsMap.get(key);
                    String columnType = value != null ? value.toString() : null;

                    if (!table.getColumns().stream().anyMatch(c -> columnName.equals(c.getName()))) {
                        table.getColumns().add(Column.builder()
                                .name(columnName)
                                .type(columnType)
                                .build());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error processing table columns: {}", e.getMessage());
        }
    }

    private void extractDatabasesFromPlan(String plan, Instant timestamp) {
        // Look for catalog.schema.table patterns in the plan
        if (plan == null || plan.isEmpty()) {
            return;
        }

        try {
            // Simple pattern matching for common formats in Trino plans
            // Format: catalog:schema.table or catalog.schema.table
            String[] lines = plan.split("\n");
            for (String line : lines) {
                // Skip lines too short to contain catalog info
                if (line.length() < 5) continue;

                for (String pattern : Arrays.asList("FROM ", "JOIN ", "TABLE: ")) {
                    int idx = line.indexOf(pattern);
                    if (idx >= 0) {
                        String afterPattern = line.substring(idx + pattern.length());
                        // Look for catalog:schema.table pattern
                        String[] parts = afterPattern.split("[:\\.]");
                        if (parts.length >= 2) {
                            String catalog = parts[0].trim();
                            String schema = parts.length > 1 ? parts[1].trim() : null;
                            String table = parts.length > 2 ? parts[2].trim() : null;

                            // Create a simple input metadata map to reuse existing logic
                            Map<String, Object> inputMeta = new HashMap<>();
                            inputMeta.put("catalogName", catalog);
                            if (schema != null) {
                                inputMeta.put("schema", schema);
                            }
                            if (table != null) {
                                inputMeta.put("table", table);
                            }

                            processInputMetadata(inputMeta, timestamp);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error extracting database info from plan: {}", e.getMessage());
        }
    }

    private String getStringValue(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            if (map.containsKey(key) && map.get(key) instanceof String) {
                return (String) map.get(key);
            }
        }
        return null;
    }

    private boolean isNestedType(String type) {
        if (type == null) return false;
        String lowerType = type.toLowerCase();
        return lowerType.contains("array") || lowerType.contains("map") || 
               lowerType.contains("row") || lowerType.contains("json");
    }

    private String guessDbType(String catalogName) {
        if (catalogName == null) return "unknown";

        catalogName = catalogName.toLowerCase();

        if (catalogName.contains("postgres")) return "postgresql";
        if (catalogName.contains("mysql")) return "mysql";
        if (catalogName.contains("mongo")) return "mongodb";
        if (catalogName.contains("cassandra")) return "cassandra";
        if (catalogName.contains("redis")) return "redis";
        if (catalogName.contains("elastic")) return "elasticsearch";
        if (catalogName.contains("hive")) return "hive";
        if (catalogName.contains("kafka")) return "kafka";
        if (catalogName.contains("s3") || catalogName.contains("minio")) return "s3";

        return catalogName; // Use the catalog name as type if no match
    }

    public List<Database> getAllDatabases() {
        List<Database> allDatabases = new ArrayList<>(databases.values());
        
        // Log database summary for debugging
        for (Database db : allDatabases) {
            if ("mongodb".equals(db.getType())) {
                log.debug("MongoDB database: '{}' has {} collections, {} schemas", 
                         db.getId(), db.getCollections().size(), db.getSchemas().size());
                db.getCollections().forEach(col -> 
                    log.debug("  Collection: '{}' with {} fields", col.getName(), col.getFields().size())
                );
                // MongoDB should have 0 schemas
                if (!db.getSchemas().isEmpty()) {
                    log.warn("MongoDB database '{}' incorrectly has {} schemas!", db.getId(), db.getSchemas().size());
                }
            } else {
                log.debug("Relational database: '{}' has {} schemas, {} collections", 
                         db.getId(), db.getSchemas().size(), db.getCollections().size());
                db.getSchemas().forEach(schema -> 
                    log.debug("  Schema: '{}' with {} tables", schema.getName(), schema.getTables().size())
                );
            }
        }
        
        return allDatabases;
    }

    public Database getDatabaseById(String id) {
        log.debug("Getting database by id: {}", id);
        return databases.get(id);
    }

    public List<Schema> getSchemas(String databaseId) {
        log.debug("Getting schemas for database: {}", databaseId);
        Database database = databases.get(databaseId);
        if (database != null && database.getSchemas() != null) {
            return new ArrayList<>(database.getSchemas());
        }
        return new ArrayList<>();
    }

    public Schema getSchema(String databaseId, String schemaName) {
        log.debug("Getting schema {} in database {}", schemaName, databaseId);
        Database database = databases.get(databaseId);
        if (database != null && database.getSchemas() != null) {
            return database.getSchemas().stream()
                    .filter(schema -> schemaName.equals(schema.getName()))
                    .findFirst()
                    .orElse(null);
        }
        return null;
    }

    public List<Table> getTables(String databaseId, String schemaName) {
        log.debug("Getting tables for schema {} in database {}", schemaName, databaseId);
        Schema schema = getSchema(databaseId, schemaName);
        if (schema != null && schema.getTables() != null) {
            return new ArrayList<>(schema.getTables());
        }
        return new ArrayList<>();
    }

    public Table getTable(String databaseId, String schemaName, String tableName) {
        log.debug("Getting table {} in schema {} in database {}", tableName, schemaName, databaseId);
        Schema schema = getSchema(databaseId, schemaName);
        if (schema != null && schema.getTables() != null) {
            return schema.getTables().stream()
                    .filter(table -> tableName.equals(table.getName()))
                    .findFirst()
                    .orElse(null);
        }
        return null;
    }

    public Map<String, Integer> getDatabaseQueryCounts() {
        log.debug("Getting database query counts");
        return new HashMap<>(queryCountsByDatabase);
    }

    public void incrementQueryCount(String databaseId) {
        queryCountsByDatabase.merge(databaseId, 1, Integer::sum);
    }

    public void addDatabase(Database database) {
        if (database != null && database.getId() != null) {
            databases.put(database.getId(), database);
            log.info("Added database: {}", database.getId());
        }
    }

    public void removeDatabase(String databaseId) {
        databases.remove(databaseId);
        queryCountsByDatabase.remove(databaseId);
        log.info("Removed database: {}", databaseId);
    }

    public boolean databaseExists(String databaseId) {
        return databases.containsKey(databaseId);
    }

    public int getTotalDatabases() {
        return databases.size();
    }
}
