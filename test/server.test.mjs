import assert from 'node:assert/strict'
import { createServer, request } from 'node:http'
import { after, before, beforeEach, test } from 'node:test'

import { requestHandler } from '../dist/server.js'

const originalFetch = globalThis.fetch

let baseUrl
let server
let slackRequests

before(async () => {
  server = createServer(requestHandler)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))

  const address = server.address()
  assert(address && typeof address === 'object')
  baseUrl = `http://127.0.0.1:${address.port}`
})

beforeEach(() => {
  slackRequests = []
  globalThis.fetch = async (url, options) => {
    slackRequests.push({ url, options })
    return new Response('ok', { status: 200 })
  }
})

after(async () => {
  globalThis.fetch = originalFetch

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
})

const sendRequest = ({ method = 'GET', path = '/', headers = {}, body } = {}) =>
  new Promise((resolve, reject) => {
    const req = request(`${baseUrl}${path}`, { method, headers }, (res) => {
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8')
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: text ? JSON.parse(text) : undefined,
        })
      })
    })

    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })

test('sends a trimmed task summary to the provided Slack webhook', async () => {
  const response = await sendRequest({
    method: 'POST',
    path: '/slack/task-summary',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:5173',
    },
    body: JSON.stringify({
      message: '  Execution completed.  ',
      webhookUrl: '  https://hooks.slack.test/services/example  ',
    }),
  })

  assert.equal(response.statusCode, 200)
  assert.equal(response.headers['access-control-allow-origin'], 'http://localhost:5173')
  assert.deepEqual(response.body, { message: 'Slack task summary sent.' })
  assert.equal(slackRequests.length, 1)
  assert.equal(slackRequests[0].url, 'https://hooks.slack.test/services/example')
  assert.deepEqual(slackRequests[0].options, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Execution completed.' }),
  })
})

test('rejects malformed JSON without calling Slack', async () => {
  const response = await sendRequest({
    method: 'POST',
    path: '/slack/task-summary',
    headers: { 'content-type': 'application/json' },
    body: '{invalid',
  })

  assert.equal(response.statusCode, 400)
  assert.deepEqual(response.body, { error: 'Invalid JSON payload.' })
  assert.equal(slackRequests.length, 0)
})

test('rejects missing messages and webhook URLs', async (t) => {
  await t.test('missing message', async () => {
    const response = await sendRequest({
      method: 'POST',
      path: '/slack/task-summary',
      body: JSON.stringify({ webhookUrl: 'https://hooks.slack.test/services/example' }),
    })

    assert.equal(response.statusCode, 400)
    assert.deepEqual(response.body, { error: 'Message is required.' })
  })

  await t.test('missing webhook URL', async () => {
    const response = await sendRequest({
      method: 'POST',
      path: '/slack/task-summary',
      body: JSON.stringify({ message: 'Execution completed.' }),
    })

    assert.equal(response.statusCode, 400)
    assert.deepEqual(response.body, { error: 'Webhook URL is required.' })
  })

  assert.equal(slackRequests.length, 0)
})

test('preserves CORS and routing error responses', async (t) => {
  await t.test('blocked origin', async () => {
    const response = await sendRequest({
      method: 'POST',
      path: '/slack/task-summary',
      headers: { origin: 'https://untrusted.example' },
      body: JSON.stringify({
        message: 'Execution completed.',
        webhookUrl: 'https://hooks.slack.test/services/example',
      }),
    })

    assert.equal(response.statusCode, 403)
    assert.deepEqual(response.body, { error: 'CORS origin not allowed.' })
  })

  await t.test('unknown route', async () => {
    const response = await sendRequest({ path: '/unknown' })

    assert.equal(response.statusCode, 404)
    assert.deepEqual(response.body, { error: 'Not found.' })
  })

  await t.test('unsupported method', async () => {
    const response = await sendRequest({ path: '/slack/task-summary' })

    assert.equal(response.statusCode, 405)
    assert.deepEqual(response.body, { error: 'Method not allowed.' })
  })

  assert.equal(slackRequests.length, 0)
})
