# Backend Unit Testing - Presentation Cheat Sheet

## 🎯 Key Numbers (Memorize These!)

```
42 Unit Tests
100% Pass Rate
26% Code Coverage
6 Second Execution
4 Test Suites
5 Test Files
```

## 📊 Quick Demo Commands

### 1. Run Tests (Show Live)
```bash
cd /Users/lizhengyuan/Viz-TrinoFed/backend
export JAVA_HOME=/Users/lizhengyuan/Library/Java/JavaVirtualMachines/openjdk-22.0.2/Contents/Home
mvn clean test
```

### 2. Open Coverage Report
```bash
open /Users/lizhengyuan/Viz-TrinoFed/backend/target/site/jacoco/index.html
```

### 3. Show Test Files in IDE
```
backend/src/test/java/com/trinofed/parser/
```

## 🗣️ Talking Points (1-2 minutes)

**Introduction (15 sec)**
"I implemented comprehensive backend unit tests for our Viz-TrinoFed project to ensure reliability and catch bugs early."

**Statistics (15 sec)**
"We have 42 unit tests covering 4 main components with a 100% pass rate and 26% code coverage."

**What's Tested (30 sec)**
"The tests cover:
- Query plan parsing from Trino JSON
- Event processing and storage
- REST API endpoints
- Data model serialization"

**Tools (15 sec)**
"Using industry-standard tools: JUnit 5, Mockito for mocking, Spring Boot Test, and JaCoCo for coverage analysis."

**Demo (15 sec)**
"Let me show you the tests running live..." [run mvn test]

**Coverage (15 sec)**
"And here's the visual coverage report..." [open JaCoCo report]

## 📋 Test Breakdown (If Asked)

| Test Suite | Tests | Purpose |
|------------|-------|---------|
| QueryPlanParserTest | 13 | Parse JSON plans |
| QueryEventServiceTest | 13 | Process events |
| QueryControllerTest | 8 | Test REST APIs |
| QueryTreeNodeTest | 8 | Model validation |

## 💡 Sample Test to Show

```java
@Test
@DisplayName("Should parse simple SELECT query plan successfully")
void testParseSimpleSelectQuery() {
    // Given
    String jsonPlan = """
        {
          "0": {
            "id": "0",
            "name": "Output",
            "children": [{
              "id": "1",
              "name": "TableScan",
              "descriptor": {"table": "postgres:public.customers"}
            }]
          }
        }
        """;

    // When
    QueryTreeNode root = parser.parseJsonPlan(jsonPlan);

    // Then
    assertThat(root).isNotNull();
    assertThat(root.getOperatorType()).isEqualTo("Output");
    assertThat(root.getChildren()).hasSize(1);
}
```

**Explain:** "This test verifies that our parser correctly converts Trino's JSON query plans into our internal tree structure."

## 🎬 Demo Flow (3 minutes)

**1. Introduction (30 sec)**
- State the purpose of unit testing
- Mention the tools used

**2. Show Structure (30 sec)**
- Open IDE, show test directory structure
- Point out 4 test files

**3. Run Tests (1 min)**
- Execute `mvn test`
- Show real-time output
- Highlight: "Tests run: 42, Failures: 0"

**4. Coverage Report (45 sec)**
- Open JaCoCo HTML report
- Show overall 26% coverage
- Drill down into service package (28%)
- Highlight config package (100% green)

**5. Code Example (45 sec)**
- Show one simple test (parseSimpleSelectQuery)
- Explain Given-When-Then pattern
- Show AssertJ assertions

## ❓ Anticipated Questions & Answers

**Q: Why only 26% coverage?**
A: "We focused on testing critical paths first - query parsing and event processing. The coverage is appropriate for core functionality, and we have a plan to increase it to 50%+ by adding Kafka integration tests and controller tests."

**Q: How long did it take to implement?**
A: "About 6-8 hours including test design, implementation, debugging, and documentation."

**Q: Can you show a test failure?**
A: "Sure!" [Temporarily change an assertion to fail, run test, show red output, then fix it]

**Q: What's the benefit of these tests?**
A: "These tests:
1. Catch bugs before they reach production
2. Enable confident refactoring
3. Document expected behavior
4. Run automatically in CI/CD"

**Q: Why did you choose these specific tests?**
A: "I prioritized testing the components that handle data transformation - the query parser and event service - because errors there would break the entire visualization."

## 🖼️ Visuals to Show

1. ✅ **Terminal:** `mvn test` output with green success
2. ✅ **Browser:** JaCoCo HTML report with coverage bars
3. ✅ **IDE:** Test file structure and one test method
4. ✅ **Report:** BACKEND_UNIT_TEST_REPORT.md metrics

## ⚠️ Common Mistakes to Avoid

- ❌ Don't say "unit testing is easy" (be humble)
- ❌ Don't apologize for 26% coverage (it's appropriate)
- ❌ Don't run tests without checking JAVA_HOME first
- ❌ Don't skip showing the actual code
- ❌ Don't forget to mention tools used

## ✅ Confidence Boosters

- ✅ All 42 tests pass consistently
- ✅ Tests run in ~6 seconds (fast)
- ✅ Coverage report is professional looking
- ✅ Tests use industry best practices
- ✅ Documentation is comprehensive

## 🎓 Technical Terms to Use

- **Unit Testing** - Testing individual components in isolation
- **Mocking** - Creating fake objects to isolate tests
- **Code Coverage** - Percentage of code executed by tests
- **AssertJ** - Fluent assertion library
- **JaCoCo** - Code coverage tool
- **MockMvc** - Spring testing utility for REST APIs

## 🚀 Closing Statement

"In summary, I've created a robust test suite with 42 comprehensive unit tests that validate our backend's core functionality. The tests run fast, pass consistently, and use professional-grade tools. This foundation ensures our visualization system is reliable and maintainable."

---

## 📱 Quick Reference

**Test Command:**
```
mvn test
```

**Coverage Command:**
```
mvn jacoco:report
open target/site/jacoco/index.html
```

**Test Location:**
```
backend/src/test/java/com/trinofed/parser/
```

**Report Location:**
```
backend unit testing/BACKEND_UNIT_TEST_REPORT.md
```

---

**Remember:** Be confident, be concise, and focus on the VALUE of testing (catching bugs, enabling changes) not just the mechanics!

**Good luck with your presentation! 🎉**
