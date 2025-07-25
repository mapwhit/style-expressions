check: lint test test-integration

lint:
	./node_modules/.bin/biome ci

format:
	./node_modules/.bin/biome check --fix

test:
	node --test $(TEST_OPTS) "test/unit/**/*.test.js"

test-integration:
	TEST_REPORTER=dot node test/expression.test.js

test-cov: TEST_OPTS := --experimental-test-coverage
test-cov: test

.PHONY: check format lint test test-cov test-integration
