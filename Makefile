check: lint test

lint:
	./node_modules/.bin/biome ci

format:
	./node_modules/.bin/biome check --fix

ifdef TEST_FILTER
  TEST_REPORTER ?= spec
  TEST_OPTS += --test-name-pattern=$(TEST_FILTER)
endif

TEST_REPORTER ?= dot
TEST_OPTS += --test-reporter=$(TEST_REPORTER)


test:
	node --test $(TEST_OPTS) "test/unit/**/*.test.js" "test/integration/expression/tests/expression.test.js"

test-cov: TEST_REPORTER := spec
test-cov: TEST_OPTS += --experimental-test-coverage --test-coverage-include="lib/**/*.js"
test-cov: test

.PHONY: check format lint test test-cov

update-test-fixtures: export UPDATE=1
update-test-fixtures: test format

.PHONY: update-test-fixtures
