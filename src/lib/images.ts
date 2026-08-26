const signatures:Record<string,(buffer:Buffer)=>boolean>={
  'image/jpeg':buffer=>buffer.length>=3&&buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff,
  'image/png':buffer=>buffer.length>=8&&buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
  'image/gif':buffer=>buffer.length>=6&&['GIF87a','GIF89a'].includes(buffer.subarray(0,6).toString('ascii')),
  'image/webp':buffer=>buffer.length>=12&&buffer.subarray(0,4).toString('ascii')==='RIFF'&&buffer.subarray(8,12).toString('ascii')==='WEBP',
}
export function isValidImage(buffer:Buffer,mimeType:string){return signatures[mimeType]?.(buffer)??false}
