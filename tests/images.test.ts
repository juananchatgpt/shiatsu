import test from 'node:test'
import assert from 'node:assert/strict'
import {isValidImage} from '../src/lib/images'

test('valida firmas de imagen y rechaza contenido disfrazado',()=>{
  assert.equal(isValidImage(Buffer.from([0xff,0xd8,0xff,0x00]),'image/jpeg'),true)
  assert.equal(isValidImage(Buffer.from([137,80,78,71,13,10,26,10]),'image/png'),true)
  assert.equal(isValidImage(Buffer.from('GIF89a'),'image/gif'),true)
  assert.equal(isValidImage(Buffer.from('<html>error</html>'),'image/jpeg'),false)
})
