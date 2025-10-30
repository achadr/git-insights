/**
 * Test script for SSE endpoint
 * This script simulates a client connecting to the SSE endpoint
 * and logs all progress events received
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/analyze/stream';

async function testSSE() {
  console.log('Testing SSE endpoint...\n');

  const requestBody = {
    repoUrl: 'https://github.com/octocat/Hello-World',
    fileLimit: 3
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('Connected to SSE stream\n');
    console.log('Progress updates:');
    console.log('='.repeat(80));

    // Parse SSE stream
    const reader = response.body;
    let buffer = '';

    reader.on('data', (chunk) => {
      buffer += chunk.toString();

      // Process complete SSE messages
      const lines = buffer.split('\n\n');
      buffer = lines.pop(); // Keep incomplete message in buffer

      lines.forEach(line => {
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          try {
            const event = JSON.parse(data);
            console.log(`[${event.stage}] ${event.message}`);

            if (event.progress !== undefined) {
              console.log(`  Progress: ${event.progress}%`);
            }

            if (event.current && event.total) {
              console.log(`  File ${event.current}/${event.total}`);
            }

            if (event.data && event.stage === 'complete') {
              console.log('\nFinal Results:');
              console.log(JSON.stringify(event.data, null, 2));
            }

            console.log('-'.repeat(80));
          } catch (e) {
            console.error('Failed to parse event:', data);
          }
        }
      });
    });

    reader.on('end', () => {
      console.log('\nSSE stream ended');
      console.log('='.repeat(80));
    });

    reader.on('error', (error) => {
      console.error('Stream error:', error);
    });

  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testSSE();
