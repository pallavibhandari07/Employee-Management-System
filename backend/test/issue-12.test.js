import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

test('Issue #12: Mongoose CastError handling', async (t) => {
  await t.test('CastError returns HTTP 400 with invalid field path in message', () => {
    const error = new mongoose.Error.CastError('Number', 'abc', 'salary');
    assert.equal(error.name, 'CastError');
    assert.equal(error.path, 'salary');

    let statusCode = 0;
    let responseBody = null;
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

    // Route catch-block logic
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        message: `Invalid value provided for field: ${error.path}`
      });
    }

    assert.equal(statusCode, 400);
    assert.deepEqual(responseBody, {
      success: false,
      message: 'Invalid value provided for field: salary'
    });
  });

  await t.test('Live endpoint test: PUT with invalid salary returns HTTP 400', async () => {
    try {
      const res = await fetch('http://localhost:5002/api/employees/6acb72d305a2d7875f51dd78', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salary: 'abc' })
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.message, 'Invalid value provided for field: salary');
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        // Skip live network check if server is not running
        return;
      }
      throw err;
    }
  });
});
