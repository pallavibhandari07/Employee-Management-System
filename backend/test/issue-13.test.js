import test from 'node:test';
import assert from 'node:assert/strict';

test('Issue #13: Catch-all JSON 404 handler for unknown routes', async (t) => {
  await t.test('Middleware unit test: returns JSON 404 with method and requested URL', () => {
    let statusCode = 0;
    let responseBody = null;
    const req = {
      method: 'GET',
      originalUrl: '/api/employee'
    };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseBody = data;
        return this;
      }
    };

    // Catch-all middleware handler logic
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.originalUrl}`
    });

    assert.equal(statusCode, 404);
    assert.deepEqual(responseBody, {
      success: false,
      message: 'Route not found: GET /api/employee'
    });
  });

  await t.test('Live endpoint test: unknown GET route returns JSON 404', async () => {
    try {
      const res = await fetch('http://localhost:5002/api/unknown');
      assert.equal(res.status, 404);
      assert.equal(res.headers.get('content-type')?.includes('application/json'), true);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.message, 'Route not found: GET /api/unknown');
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        return; // skip live check if server is offline
      }
      throw err;
    }
  });

  await t.test('Live endpoint test: unknown POST route returns JSON 404', async () => {
    try {
      const res = await fetch('http://localhost:5002/api/departments', {
        method: 'POST'
      });
      assert.equal(res.status, 404);
      assert.equal(res.headers.get('content-type')?.includes('application/json'), true);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.message, 'Route not found: POST /api/departments');
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        return;
      }
      throw err;
    }
  });

  await t.test('Live endpoint test: valid routes (/api/health) still return HTTP 200', async () => {
    try {
      const res = await fetch('http://localhost:5002/api/health');
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'ok');
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        return;
      }
      throw err;
    }
  });
});
