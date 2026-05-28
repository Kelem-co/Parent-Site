// Test MSW matching behavior directly
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.get('/v1/children', () => {
    return HttpResponse.json({ success: true, data: { items: [], total: 0 } });
  })
);

server.listen({ onUnhandledRequest: 'error' });

// Test 1: fetch to http://localhost:4000/v1/children
try {
  const res = await fetch('http://localhost:4000/v1/children');
  const json = await res.json();
  console.log('Test 1 (port 4000):', json.success ? 'MATCHED' : 'NOT MATCHED');
} catch (e) {
  console.log('Test 1 (port 4000) ERROR:', e.message);
}

// Test 2: fetch to http://localhost/v1/children
try {
  const res = await fetch('http://localhost/v1/children');
  const json = await res.json();
  console.log('Test 2 (port 80):', json.success ? 'MATCHED' : 'NOT MATCHED');
} catch (e) {
  console.log('Test 2 (port 80) ERROR:', e.message);
}

server.close();
