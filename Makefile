check: lint test test-integration

lint:
	./node_modules/.bin/biome ci

format:
	./node_modules/.bin/biome check --fix

export TEST_REPORTER ?= dot
TEST_OPTS += --test-reporter=$(TEST_REPORTER)
test:
	node --test $(TEST_OPTS) "test/unit/**/*.test.js"

test-integration:
	node test/expression.test.js

test-cov: TEST_OPTS := --experimental-test-coverage
test-cov: test

.PHONY: check format lint test test-cov test-integration
