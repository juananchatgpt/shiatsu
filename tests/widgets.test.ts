import assert from 'node:assert/strict'
import test from 'node:test'

import { GET } from '../src/app/api/widgets.js/route'

test('el widget obtiene el dominio desde la URL publica del script', async () => {
  const response = await GET()
  const script = await response.text()

  assert.match(script, /new URL\(s\.src,document\.baseURI\)\.origin/)
  assert.match(script, /f\.src=base\+path/)
  assert.doesNotMatch(script, /0\.0\.0\.0/)
})
