---
description: Build a complete feature with backend and frontend components
allowed_tools: [Write, Read, Edit, Bash, Task]
---

# Build Feature Command

Build a new feature following this comprehensive workflow:

## Step 1: Understand Requirements

First, analyze what needs to be built:
- What is the feature's purpose?
- What are the user stories?
- What are the technical requirements?
- What APIs are needed?
- What UI components are required?

## Step 2: Plan Architecture

Design the solution:
- Backend endpoints needed
- Database schema changes
- API request/response formats
- Frontend components
- State management approach
- Error handling strategy

## Step 3: Backend Development

Use backend-agent to create:

1. **Routes** (`routes/*.js`)
   - Define API endpoints
   - Apply middleware
   - Map to controllers

2. **Controllers** (`controllers/*.js`)
   - Handle requests
   - Validate input
   - Call services
   - Format responses

3. **Services** (`services/*.js`)
   - Business logic
   - External API calls
   - Data transformations

4. **Tests** (`tests/**/*.test.js`)
   - Unit tests for services
   - Integration tests for endpoints

## Step 4: Frontend Development

Use frontend-agent to create:

1. **Components** (`components/**/*.jsx`)
   - UI components
   - Forms and inputs
   - Data displays

2. **Hooks** (`hooks/*.js`)
   - Custom React hooks
   - API integration
   - State management

3. **Pages** (`pages/*.jsx`)
   - Route components
   - Layout integration

4. **Tests** (`tests/**/*.test.jsx`)
   - Component tests
   - Interaction tests

## Step 5: Integration

Connect backend and frontend:

1. **API Service** (`frontend/src/services/api.js`)
   - Add API methods
   - Handle errors
   - Transform data

2. **Test End-to-End**
   - Start both servers
   - Test full workflow
   - Verify error handling

## Step 6: Documentation

Document the feature:

1. **API Documentation**
   - Endpoint descriptions
   - Request examples
   - Response examples

2. **Component Documentation**
   - Props descriptions
   - Usage examples
   - Screenshots

## Example: Add Analysis History Feature

### Requirements
- Users can view past analyses
- Show analysis date, repo, and score
- Click to view full analysis

### Backend Steps

1. Create route:
````javascript
// routes/history.js
router.get('/history', getHistory);
router.get('/history/:id', getHistoryItem);
````

2. Create controller:
````javascript
// controllers/historyController.js
export async function getHistory(req, res) {
  const history = await historyService.getAll();
  res.json({ data: history });
}
````

3. Create service:
````javascript
// services/historyService.js
export async function getAll() {
  return await cacheService.getAllAnalyses();
}
````

### Frontend Steps

1. Create component:
````jsx
// components/history/HistoryList.jsx
export function HistoryList() {
  const { data } = useHistory();
  return (
    <div>
      {data.map(item => (
        <HistoryItem key={item.id} item={item} />
      ))}
    </div>
  );
}
````

2. Create hook:
````javascript
// hooks/useHistory.js
export function useHistory() {
  return useQuery({
    queryKey: ['history'],
    queryFn: fetchHistory,
  });
}
````

3. Add to page:
````jsx
// pages/HistoryPage.jsx
export function HistoryPage() {
  return (
    <Layout>
      <HistoryList />
    </Layout>
  );
}
````

## Checklist

Before considering the feature complete:

- [ ] Backend endpoint works
- [ ] Frontend component renders
- [ ] API integration works
- [ ] Error handling implemented
- [ ] Loading states shown
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Code reviewed (or use /review)
- [ ] No console errors
- [ ] Responsive design works

## Quality Standards

Ensure:
- Clean code (no console.logs)
- Proper error handling
- Input validation
- Loading states
- Responsive design
- Accessibility
- Tests coverage >80%
- Documentation complete