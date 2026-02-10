# Testing Patterns

**Analysis Date:** 2026-02-10

## Test Framework

**Runner:**
- Not detected - No test framework configured (Jest, Vitest, Mocha not found)
- No test configuration files (jest.config.*, vitest.config.*, etc.)

**Assertion Library:**
- Not applicable - No testing setup

**Run Commands:**
- No test command in package.json scripts
- Testing strategy not currently implemented in project

## Test File Organization

**Location:**
- Not applicable - No test files found in project
- Testing coverage: **0% - No tests present**

**Naming:**
- Convention would be: `*.test.ts`, `*.spec.ts` (not currently used)

**Structure:**
```
// Expected structure (if tests were added):
├── [module].test.ts          // Unit test for module
├── [component].test.tsx      // Component tests
└── hooks/[hook].test.ts      // Hook tests
```

## Test Structure

**Note:** No existing tests to reference. Below describes recommended patterns based on codebase architecture.

**Recommended Unit Test Suite Organization:**

```typescript
// Example pattern for testing useChat hook
describe("useChat", () => {
  it("should initialize with empty messages", () => {
    // Test implementation
  });

  describe("startChat", () => {
    it("should create initial user message", () => {
      // Test implementation
    });

    it("should handle stream response", () => {
      // Test implementation
    });

    it("should extract brief data from response", () => {
      // Test implementation
    });
  });

  describe("error handling", () => {
    it("should set error state on failed request", () => {
      // Test implementation
    });

    it("should set error message in Hungarian", () => {
      // Test implementation
    });
  });
});
```

## Mocking

**Framework:** Would recommend Jest or Vitest for mocking capabilities

**Recommended Patterns:**

```typescript
// Mock fetch calls
global.fetch = jest.fn();

// Mock Anthropic SDK
jest.mock("@anthropic-ai/sdk", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    messages: {
      create: jest.fn(),
    },
  })),
}));

// Mock SendGrid
jest.mock("@sendgrid/mail", () => ({
  __esModule: true,
  default: {
    setApiKey: jest.fn(),
    send: jest.fn(),
  },
}));

// Mock React Router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));
```

**What to Mock:**
- External APIs: Anthropic SDK, SendGrid
- Next.js modules: `useRouter`, `useNavigation`
- File system operations: FileReader
- Fetch calls
- Environment variables via `process.env`

**What NOT to Mock:**
- React hooks themselves (useState, useCallback, etc.)
- Utility functions like `cn()` from `clsx`
- Component internal state updates
- Business logic in hooks (test via behavior, not mocked)

## Fixtures and Factories

**Test Data:**

```typescript
// Example fixture for BriefData
const mockBriefData: BriefData = {
  company: {
    name: "Test Company",
    contact_name: "Test Contact",
    contact_email: "test@example.com",
    contact_phone: "123456789",
  },
  campaign: {
    name: "Test Campaign",
    type: "Social Media",
    goal: "Increase brand awareness",
    message: "Test message",
    kpis: ["impressions", "clicks"],
  },
  target_audience: {
    demographics: {
      gender: "All",
      age: "18-45",
      location: "Hungary",
    },
    psychographics: "Tech-savvy professionals",
    persona: "Digital marketer",
  },
  channels: ["Facebook", "Instagram"],
  timeline: {
    start: "2026-03-01",
    end: "2026-04-01",
    important_dates: [],
  },
  budget: {
    total: "100,000 HUF",
    distribution: { "Facebook": "60000", "Instagram": "40000" },
  },
  competitors: ["Competitor A", "Competitor B"],
  notes: "Test notes",
};

// Example fixture for Message
const mockMessage: Message = {
  id: "test-id-123",
  role: "assistant",
  content: "Test response content",
  timestamp: new Date(),
};
```

**Location:**
- Recommended: Create `__fixtures__/` directory at root level or within each test directory
- Or inline in test files for simple cases

## Coverage

**Requirements:** Not enforced - No coverage configuration found

**Recommended targets:**
- Core hooks (useChat): 80%+ coverage
- Utility functions: 100%
- API routes: 80%+
- Components: 60%+ (behavior testing)

**View Coverage:**
```bash
# Once Jest/Vitest configured, run:
npm test -- --coverage

# Or specific file:
npm test -- hooks/useChat --coverage
```

## Test Types

**Unit Tests:**
- Scope: Individual functions, hooks, utilities
- Approach: Test hook state changes, function returns, error handling
- Examples:
  - `useChat` hook state initialization and message handling
  - `updateField()` deep object update logic
  - `fileToBase64()` file conversion utility
  - Prompt generation functions

**Integration Tests:**
- Scope: Component behavior with hooks, API interaction
- Approach: Test component rendering with state changes, async operations
- Examples:
  - `BriefEditor` component form updates and submission
  - `PdfUpload` component with file validation
  - Chat flow from file upload through API to brief generation
  - Email sending with PDF generation

**E2E Tests:**
- Framework: Not currently used - Would recommend Playwright or Cypress
- Not implemented but valuable for:
  - Full user flows (upload → chat → brief → send)
  - Navigation between pages
  - Form validation and submission

## Common Patterns

**Async Testing:**

```typescript
// With async/await
it("should process stream response", async () => {
  const mockResponse = {
    body: {
      getReader: () => ({
        read: jest.fn()
          .mockResolvedValueOnce({ done: false, value: Buffer.from("data: ") })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      }),
    },
  };

  const result = await processStream(mockResponse as Response);
  expect(result).toBeDefined();
});

// With promises
it("should handle message sending", () => {
  const { result } = renderHook(() => useChat());

  return result.current.sendMessage("test message").then(() => {
    expect(result.current.messages).toHaveLength(2); // user + assistant
  });
});
```

**Error Testing:**

```typescript
it("should handle file validation errors", () => {
  const { getByText } = render(
    <PdfUpload onFileSelected={jest.fn()} />
  );

  // Simulate invalid file
  const input = screen.getByRole("textbox", { hidden: true });
  fireEvent.change(input, {
    target: { files: [new File([], "test.txt", { type: "text/plain" })] },
  });

  expect(getByText("Csak PDF fájlokat fogadunk el.")).toBeInTheDocument();
});

it("should set error state on API failure", async () => {
  global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));

  const { result } = renderHook(() => useChat());

  await act(async () => {
    await result.current.startChat("", "");
  });

  expect(result.current.error).toContain("Hiba történt");
});
```

## Missing Test Coverage

**Critical gaps (High Priority):**
- `useChat` hook: Stream parsing, message handling, brief data extraction
- API routes: `/api/chat`, `/api/send-brief` request/response validation
- `BriefEditor` component: Form state updates, nested field modifications
- Error scenarios: API failures, network errors, validation errors

**Secondary gaps (Medium Priority):**
- `PdfUpload` component: File drag-drop, validation, state feedback
- `updateField()` utility: Deep object updates with various path structures
- Email generation and PDF rendering logic
- Type safety verification

**Nice to have (Lower Priority):**
- Component animations and visual feedback
- Tailwind class merging in `cn()` utility
- Session storage interactions

---

*Testing analysis: 2026-02-10*
