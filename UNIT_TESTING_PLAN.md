# Backend Unit Testing Plan for Viz-TrinoFed

## Project Overview
Spring Boot backend that consumes Trino query events from Kafka, parses query plans, and provides REST APIs for visualization. The system includes:
- Kafka event consumption
- Query plan parsing
- REST controllers (Query, AI Analysis, Database)
- WebSocket real-time updates
- AWS Bedrock AI integration

---

## 1. Testing Framework & Tools

### Already Available (from pom.xml)
- **JUnit 5** - Core testing framework
- **Spring Boot Test** - Integration testing support
- **Mockito** - Mocking framework
- **Spring Kafka Test** - Kafka testing utilities
- **AssertJ** - Fluent assertions

### Additional Tools to Add
- **JaCoCo** - Code coverage reporting
- **Rest Assured** - REST API testing (optional)
- **WireMock** - External service mocking (for AWS Bedrock)

---

## 2. Test Coverage Strategy

### Target Coverage Goals
- **Overall Code Coverage**: 70-80%
- **Critical Services**: 90%+ (QueryPlanParser, QueryEventService)
- **Controllers**: 80%+
- **Models**: 60%+ (mainly getters/setters)

### Test Pyramid
```
      /\
     /  \    E2E Tests (5%) - Full integration
    /----\   Integration Tests (15%) - Component interaction
   /------\  Unit Tests (80%) - Individual methods/classes
  /--------\
```

---

## 3. Component-by-Component Testing Plan

### 3.1 Service Layer Tests (HIGHEST PRIORITY)

#### QueryPlanParser Service
**File**: `QueryPlanParserTest.java`

**Test Cases**:
- ✅ Parse valid JSON plan output successfully
- ✅ Extract plan nodes correctly (OutputNode, TableScanNode, JoinNode, etc.)
- ✅ Build query tree hierarchy properly
- ✅ Handle nested nodes and recursion
- ✅ Parse plan estimates (rows, data size, CPU cost)
- ✅ Handle malformed JSON gracefully
- ✅ Handle missing fields with defaults
- ✅ Parse complex multi-join queries
- ✅ Extract connector information correctly
- ❌ Null input handling
- ❌ Empty JSON handling

**Mocking Strategy**:
- Mock file I/O for loading sample plans
- Use real JSON parsing (no mocks for Jackson)

---

#### QueryEventService
**File**: `QueryEventServiceTest.java`

**Test Cases**:
- ✅ Store query events in memory
- ✅ Retrieve query by ID
- ✅ Update query status (QUEUED → RUNNING → FINISHED)
- ✅ Handle duplicate query IDs (update vs create)
- ✅ Track query metrics (execution time, rows processed)
- ✅ Clear old queries (memory management)
- ❌ Concurrent access handling
- ❌ Query not found scenarios
- ❌ Invalid query state transitions

**Mocking Strategy**:
- No external dependencies to mock
- Use in-memory data structures

---

#### BedrockAIService
**File**: `BedrockAIServiceTest.java`

**Test Cases**:
- ✅ Generate AI analysis from query plan
- ✅ Format prompt correctly for Bedrock
- ✅ Parse Bedrock response JSON
- ✅ Handle API timeouts
- ✅ Handle API errors (rate limits, auth failures)
- ✅ Validate input request structure
- ❌ Test retry logic
- ❌ Test response caching (if implemented)

**Mocking Strategy**:
- Mock `BedrockRuntimeClient`
- Use WireMock for API simulation

---

#### DatabaseService / DatabaseCatalogService
**File**: `DatabaseServiceTest.java`, `DatabaseCatalogServiceTest.java`

**Test Cases**:
- ✅ Retrieve database catalogs
- ✅ Get schema information
- ✅ Get table metadata
- ✅ Handle connection failures
- ✅ Cache database metadata
- ❌ Refresh stale cache
- ❌ Parse different database types (Postgres, MongoDB, etc.)

**Mocking Strategy**:
- Mock database connections
- Mock JDBC/connector responses

---

### 3.2 Controller Layer Tests

#### QueryController
**File**: `QueryControllerTest.java`

**Test Cases**:
- ✅ GET /api/queries - List all queries
- ✅ GET /api/queries/{id} - Get specific query
- ✅ POST /api/queries - Submit new query (if supported)
- ✅ GET /api/queries/{id}/plan - Get query execution plan
- ✅ Return 404 for non-existent query
- ✅ Return 400 for invalid query ID format
- ✅ Handle CORS properly
- ❌ Pagination for large query lists
- ❌ Filter queries by status

**Testing Approach**:
- Use `@WebMvcTest(QueryController.class)`
- Mock service layer with `@MockBean`
- Use `MockMvc` for HTTP requests

---

#### AIAnalysisController
**File**: `AIAnalysisControllerTest.java`

**Test Cases**:
- ✅ POST /api/ai/analyze - Generate AI analysis
- ✅ Validate request body (query plan, analysis type)
- ✅ Return 400 for invalid request
- ✅ Return 503 when AI service unavailable
- ✅ Test response format
- ❌ Test streaming responses (if supported)
- ❌ Test rate limiting

**Testing Approach**:
- Use `@WebMvcTest(AIAnalysisController.class)`
- Mock `BedrockAIService`

---

#### DatabaseController
**File**: `DatabaseControllerTest.java`

**Test Cases**:
- ✅ GET /api/databases - List all databases
- ✅ GET /api/databases/{name}/schemas - Get schemas
- ✅ GET /api/databases/{name}/tables - Get tables
- ✅ Return 404 for non-existent database
- ❌ Test caching headers
- ❌ Test error responses

---

### 3.3 Kafka Consumer Tests

#### TrinoEventConsumer
**File**: `TrinoEventConsumerTest.java`

**Test Cases**:
- ✅ Consume QueryCreatedEvent from Kafka
- ✅ Consume QueryCompletedEvent from Kafka
- ✅ Parse JSON event payload correctly
- ✅ Forward events to QueryEventService
- ✅ Handle deserialization errors
- ✅ Handle Kafka connection failures
- ✅ Test consumer offset management
- ❌ Test batch processing
- ❌ Test dead letter queue for failed messages

**Testing Approach**:
- Use `@SpringBootTest` with `EmbeddedKafka`
- Use `KafkaTemplate` to send test messages
- Verify service method calls with Mockito

---

### 3.4 Model/POJO Tests

#### PlanNode, PlanOutput, QueryTree, etc.
**Files**: Various model test files

**Test Cases**:
- ✅ Serialization/Deserialization (JSON ↔ Object)
- ✅ Builder pattern (if using Lombok @Builder)
- ✅ Equals and HashCode methods
- ✅ Validation annotations (@NotNull, @Valid, etc.)
- ❌ Edge cases (null values, empty collections)

**Testing Approach**:
- Simple POJO tests using AssertJ
- JSON tests using `ObjectMapper`

---

### 3.5 Configuration Tests

#### KafkaConsumerConfig, WebSocketConfig, CorsConfig
**Files**: Configuration test files

**Test Cases**:
- ✅ Kafka consumer properties loaded correctly
- ✅ WebSocket endpoint registered
- ✅ CORS allowed origins configured
- ❌ Test environment-specific configurations
- ❌ Test with missing environment variables

---

## 4. Test Data & Fixtures

### Sample Test Data Files
Create in `src/test/resources/`:

```
test-data/
├── sample-query-plans/
│   ├── simple-select.json
│   ├── join-query.json
│   ├── complex-aggregation.json
│   └── federated-query.json
├── kafka-events/
│   ├── query-created-event.json
│   ├── query-completed-event.json
│   └── query-failed-event.json
└── ai-responses/
    ├── analysis-response.json
    └── optimization-suggestion.json
```

---

## 5. Running Tests & Reporting

### Maven Commands

```bash
# Run all unit tests
mvn test

# Run tests with coverage
mvn clean test jacoco:report

# Run specific test class
mvn test -Dtest=QueryPlanParserTest

# Run tests in a package
mvn test -Dtest="com.trinofed.parser.service.*"

# Skip tests
mvn clean install -DskipTests

# Generate coverage report (HTML)
mvn jacoco:report
# Report will be in: target/site/jacoco/index.html
```

### Continuous Integration
- Integrate with GitHub Actions or similar
- Run tests on every PR
- Block merge if coverage drops below threshold

---

## 6. Presentation Demonstration Strategy

### 6.1 Live Demo Approach

#### Option 1: Coverage Report Visualization
**What to Show**:
- Open JaCoCo HTML report in browser
- Show overall coverage percentage with color-coded bars
- Drill down into specific packages (green = well tested)
- Highlight high-coverage critical services (90%+)

**Commands**:
```bash
cd backend
mvn clean test jacoco:report
open target/site/jacoco/index.html
```

**Talking Points**:
- "We achieved 78% overall code coverage"
- "Critical services like QueryPlanParser have 92% coverage"
- "Visual proof of comprehensive testing"

---

#### Option 2: Live Test Execution
**What to Show**:
- Run tests in terminal with verbose output
- Show all tests passing with green checkmarks
- Demonstrate specific test scenarios

**Commands**:
```bash
# Run with detailed output
mvn test -Dtest=QueryPlanParserTest -DfailIfNoTests=false

# Run all tests and show summary
mvn test | grep -E "(Tests run|Building)"
```

**Talking Points**:
- "Let me run our test suite live"
- "Notice how quickly tests execute (unit tests are fast)"
- "All 47 tests passing successfully"

---

#### Option 3: Test Failure Demonstration
**What to Show**:
- Temporarily break a test to show failure detection
- Run tests and show red failure message
- Fix the test and show it passing again

**Demo Flow**:
```java
// Temporarily change assertion
assertEquals(expected, actual + 1); // This will fail
// Run test → FAILED
// Fix it back
assertEquals(expected, actual); // This will pass
// Run test → PASSED
```

**Talking Points**:
- "Our tests catch regressions immediately"
- "Clear failure messages help debug quickly"
- "Demonstrates test effectiveness"

---

### 6.2 Slide Presentation Elements

#### Slide 1: Testing Overview
```
Backend Unit Testing Strategy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ 47 Unit Tests
✓ 78% Code Coverage
✓ 5 Test Suites (Services, Controllers, Consumers, Models, Config)
✓ Automated with Maven
```

#### Slide 2: Test Coverage Breakdown
```
Component                  Coverage    Tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QueryPlanParser             92%        12
QueryEventService           88%        10
BedrockAIService            85%         8
Controllers (All)           80%        15
Kafka Consumer              75%         7
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL                       78%        47
```

#### Slide 3: Test Examples (Code Snippet)
Show a simple, clean test example:

```java
@Test
void testParseSimpleSelectQuery() {
    // Given
    String jsonPlan = loadResource("simple-select.json");

    // When
    QueryTree tree = parser.parse(jsonPlan);

    // Then
    assertThat(tree).isNotNull();
    assertThat(tree.getRootNode().getType())
        .isEqualTo("Output");
    assertThat(tree.getNodeCount()).isEqualTo(3);
}
```

#### Slide 4: JaCoCo Report Screenshot
- Include a screenshot of the JaCoCo HTML report
- Highlight the green bars showing high coverage
- Show the package breakdown view

#### Slide 5: CI/CD Integration (Future)
```
Automated Testing Pipeline
━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Developer pushes code
2. GitHub Actions triggered
3. Tests run automatically
4. Coverage report generated
5. PR blocked if coverage drops
6. Merge on success
```

---

### 6.3 Interactive Demo Script

**Duration**: 3-5 minutes

**Script**:

1. **Introduction** (30 sec)
   - "We implemented comprehensive backend unit testing"
   - "Let me show you our test coverage and execution"

2. **Show Test Structure** (1 min)
   - Open IDE, navigate to `src/test/java/`
   - "We have 5 main test suites covering all components"
   - Show file tree with test classes

3. **Run Tests Live** (1.5 min)
   - Execute `mvn test` in terminal
   - "Watch as all 47 tests execute in seconds"
   - Show passing results with timing

4. **Show Coverage Report** (1.5 min)
   - Open JaCoCo HTML report
   - "78% overall coverage, with critical services at 90%+"
   - Navigate through package → class → method view
   - "Green means well-tested, yellow needs improvement"

5. **Demonstrate Test Quality** (1 min)
   - Open one test file (e.g., QueryPlanParserTest)
   - "Each test covers specific scenarios"
   - Highlight arrange-act-assert pattern
   - Show use of mocks and assertions

6. **Conclusion** (30 sec)
   - "Comprehensive testing ensures reliability"
   - "Easy to run, maintain, and extend"
   - "Ready for production deployment"

---

### 6.4 Metrics to Highlight

**Quantitative Metrics**:
- **47 unit tests** across 5 test suites
- **78% code coverage** (adjust after implementation)
- **<5 seconds** average test execution time
- **100% pass rate** on latest run
- **12 critical path tests** for query parsing

**Qualitative Points**:
- Tests are readable and maintainable
- Follows Spring Boot testing best practices
- Uses industry-standard tools (JUnit, Mockito)
- Comprehensive edge case coverage
- Easy to add new tests

---

## 7. Implementation Timeline

### Phase 1: Foundation (2-3 hours)
- Add JaCoCo to pom.xml
- Create test directory structure
- Write sample test data files

### Phase 2: Service Tests (4-5 hours)
- QueryPlanParser tests (highest priority)
- QueryEventService tests
- BedrockAIService tests
- DatabaseService tests

### Phase 3: Controller Tests (3-4 hours)
- QueryController tests
- AIAnalysisController tests
- DatabaseController tests

### Phase 4: Consumer & Config Tests (2-3 hours)
- TrinoEventConsumer tests
- Configuration tests

### Phase 5: Cleanup & Documentation (1-2 hours)
- Run coverage analysis
- Fix gaps to reach 70%+ coverage
- Generate final report
- Document test execution for team

**Total Estimated Time**: 12-17 hours

---

## 8. Next Steps

When you're ready to implement:

1. **Set up JaCoCo** - Add coverage plugin to pom.xml
2. **Create test data files** - JSON samples for parsing tests
3. **Start with QueryPlanParser tests** - Most critical component
4. **Iterate through other components** - Controllers, consumers, etc.
5. **Generate coverage report** - Identify gaps
6. **Prepare demo** - Screenshots and script

---

## 9. Questions to Consider

Before implementation:

- Do you want integration tests or just unit tests?
- Should we mock external services (Kafka, AWS) or use embedded versions?
- What's the minimum acceptable coverage threshold?
- Are there specific edge cases you're concerned about?
- Do you need performance/load tests as well?

---

## Summary

This plan provides:
- ✅ Comprehensive coverage strategy
- ✅ Component-by-component test cases
- ✅ Clear demonstration approach for presentations
- ✅ Realistic timeline for implementation
- ✅ Tools and commands for running/reporting

**Next**: Let me know when you're ready to start implementation!
