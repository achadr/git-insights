# Backend Tests

Comprehensive test suite for the GitInsights backend API.

## Test Structure

```
backend/src/__tests__/
├── setup.js                      # Test environment configuration
├── mocks/
│   └── mockData.js              # Mock data for all tests
├── routes/
│   └── analysis.test.js         # API route tests
└── services/
    ├── analyzerService.test.js  # Analyzer service tests
    ├── claudeService.test.js    # Claude API integration tests
    └── githubService.test.js    # GitHub API integration tests
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run with coverage
```bash
npm test -- --coverage
```

### Run specific test file
```bash
npm test -- analyzerService.test.js
```

### Run in watch mode
```bash
npm test -- --watch
```

### Run with verbose output
```bash
npm test -- --verbose
```

## Test Coverage

### Routes (`routes/analysis.test.js`)
- ✅ POST /api/analyze with valid GitHub URL
- ✅ POST /api/analyze with invalid URL (returns 400)
- ✅ POST /api/analyze with non-existent repository
- ✅ Rate limiting behavior (5 requests hit limit)
- ✅ Caching (identical requests use cache)
- ✅ Response structure validation
- ✅ User-provided API key bypass
- ✅ Various GitHub URL formats
- ✅ Error handling scenarios

### Services

#### `analyzerService.test.js`
- ✅ analyzeRepository method
- ✅ File filtering logic (filterCodeFiles)
- ✅ validateFileLimit method
- ✅ analyzeFiles method
- ✅ generateReport method
- ✅ analyzeQuality method
- ✅ Error scenarios
- ✅ Caching behavior
- ✅ User API key handling

#### `claudeService.test.js`
- ✅ analyze method with system API key
- ✅ analyze method with user-provided API key
- ✅ Error handling (rate limits, invalid API key, network errors)
- ✅ parseJSON method with various formats
- ✅ Response validation
- ✅ Integration scenarios

#### `githubService.test.js`
- ✅ getRepository method
- ✅ getFileContent method
- ✅ getRepoTree method
- ✅ checkRateLimit method
- ✅ parseGitHubUrl with various formats
- ✅ filterCodeFiles logic
- ✅ selectImportantFiles prioritization
- ✅ Error handling (404, 403, network errors)

## Key Features

### Mocking Strategy
All tests use Jest mocks to avoid actual API calls:
- `@anthropic-ai/sdk` - Mocked for Claude API
- `@octokit/rest` - Mocked for GitHub API
- Redis - Disabled in test environment
- Logger - Mocked to reduce output noise

### Test Isolation
- Each test file is independent
- Mocks are reset before each test
- No shared state between tests
- Tests can run in any order

### Environment Configuration
Test environment variables are set in `setup.js`:
- `NODE_ENV=test`
- Mock API keys (no real keys needed)
- Redis disabled
- Rate limiting configured for testing

## Test Patterns

### Service Tests
```javascript
describe('ServiceName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup mocks
  });

  it('should handle success case', async () => {
    // Arrange
    mockDependency.method.mockResolvedValue(mockData);

    // Act
    const result = await service.method();

    // Assert
    expect(result).toEqual(expectedData);
    expect(mockDependency.method).toHaveBeenCalledWith(expectedArgs);
  });
});
```

### Route Tests
```javascript
describe('Route', () => {
  it('should return expected response', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .send(requestData);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  });
});
```

## Common Issues

### Module Import Errors
If you see "Cannot use import statement outside a module":
- Ensure `"type": "module"` is in package.json
- Check Jest config has `transform: {}`

### Mock Not Working
If mocks aren't being applied:
- Clear mock cache: `jest.clearAllMocks()`
- Check mock path matches actual import path
- Ensure mock is defined before importing service

### Async Test Timeout
If tests timeout:
- Increase timeout in jest.config.js
- Use `jest.setTimeout(10000)` in individual tests
- Check for unresolved promises

## Best Practices

1. **Test Independence**: Each test should work in isolation
2. **Clear Mocks**: Always clear mocks between tests
3. **Descriptive Names**: Use clear, descriptive test names
4. **Arrange-Act-Assert**: Follow AAA pattern
5. **Mock External APIs**: Never make real API calls in tests
6. **Error Testing**: Always test error scenarios
7. **Edge Cases**: Test boundary conditions and edge cases

## Coverage Goals

Target coverage metrics:
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

Current coverage can be checked with:
```bash
npm test -- --coverage --coverageReporters=text
```

## Continuous Integration

Tests are designed to run in CI/CD environments:
- No external dependencies required
- No real API keys needed
- Fast execution (< 30 seconds)
- Deterministic results

## Troubleshooting

### Tests fail with "Cannot find module"
- Run `npm install` to ensure all dependencies are installed
- Check that mock paths match actual file paths

### Rate limiter tests failing
- Rate limiter mock is stateful - run tests in isolation if needed
- Reset request count between test suites

### Redis connection errors
- Ensure `REDIS_URL` is empty or undefined in test environment
- Check `setup.js` sets correct environment variables

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain or improve coverage
4. Follow existing test patterns
5. Update this README if needed
