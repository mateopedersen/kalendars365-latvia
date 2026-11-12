// Browser-local ZIP and image density metadata. No network or external runtime.
const encoder=new TextEncoder();
const CRC_TABLE=Uint32Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);return n>>>0;});
export function crc32(bytes){let value=0xffffffff;for(const byte of bytes)value=(value>>>8)^CRC_TABLE[(value^byte)&255];return (value^0xffffffff)>>>0;}
export const bytesOf=value=>typeof value==='string'?encoder.encode(value):value instanceof Uint8Array?value:new Uint8Array(value);
export function zipStore(files){
 const entries=Object.entries(files),parts=[],central=[];let offset=0;
 if(!entries.length||entries.length>65535)throw Error('Failu arhīva apjoms nav atbalstīts.');
 for(const [path,value] of entries){
  if(!path||path.startsWith('/')||path.includes('\\')||path.split('/').some(part=>part==='..'||part==='.'||!part))throw Error('Nederīgs faila nosaukums arhīvā.');
  const name=encoder.encode(path),bytes=bytesOf(value),crc=crc32(bytes);
  if(name.length>65535||bytes.length>0xffffffff||offset+bytes.length>0xffffffff)throw Error('Arhīvs ir pārāk liels. Izvēlies mazāku lapu skaitu.');
  const local=new Uint8Array(30+name.length),v=new DataView(local.buffer);
  v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x0800,true);v.setUint16(12,0x21,true);v.setUint32(14,crc,true);v.setUint32(18,bytes.length,true);v.setUint32(22,bytes.length,true);v.setUint16(26,name.length,true);local.set(name,30);
  const record=new Uint8Array(46+name.length),w=new DataView(record.buffer);
  w.setUint32(0,0x02014b50,true);w.setUint16(4,20,true);w.setUint16(6,20,true);w.setUint16(8,0x0800,true);w.setUint16(14,0x21,true);w.setUint32(16,crc,true);w.setUint32(20,bytes.length,true);w.setUint32(24,bytes.length,true);w.setUint16(28,name.length,true);w.setUint32(42,offset,true);record.set(name,46);
  parts.push(local,bytes);central.push(record);offset+=local.length+bytes.length;
 }
 const directorySize=central.reduce((total,row)=>total+row.length,0),end=new Uint8Array(22),v=new DataView(end.buffer);
 if(offset+directorySize>0xffffffff)throw Error('Arhīvs ir pārāk liels. Izvēlies mazāku lapu skaitu.');
 v.setUint32(0,0x06054b50,true);v.setUint16(8,entries.length,true);v.setUint16(10,entries.length,true);v.setUint32(12,directorySize,true);v.setUint32(16,offset,true);
 const output=new Uint8Array(offset+directorySize+end.length);let at=0;for(const row of [...parts,...central,end]){output.set(row,at);at+=row.length;}return output;
}
function checkedDpi(dpi){if(![150,300,600].includes(Number(dpi)))throw Error('Izvēlies 150, 300 vai 600 dpi.');return Number(dpi);}
export function pngDpi(value,dpi){
 const bytes=bytesOf(value);dpi=checkedDpi(dpi);
 if(bytes.length<33||![137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))throw Error('Nederīgs PNG attēls.');
 const data=new Uint8Array(21),v=new DataView(data.buffer);v.setUint32(0,9);data.set([112,72,89,115],4);v.setUint32(8,Math.round(dpi/0.0254));v.setUint32(12,Math.round(dpi/0.0254));data[16]=1;v.setUint32(17,crc32(data.subarray(4,17)));
 const chunks=[bytes.subarray(0,8)];let at=8,added=false;
 while(at<bytes.length){
  if(at+12>bytes.length)throw Error('PNG fails ir nepilnīgs.');
  const length=new DataView(bytes.buffer,bytes.byteOffset+at,4).getUint32(0),end=at+12+length;
  if(end>bytes.length)throw Error('PNG fails ir nepilnīgs.');
  const type=String.fromCharCode(...bytes.subarray(at+4,at+8));
  if(type!=='pHYs')chunks.push(bytes.subarray(at,end));
  if(type==='IHDR'&&!added){chunks.push(data);added=true;}at=end;
 }
 if(!added)throw Error('PNG failam nav attēla galvenes.');
 const result=new Uint8Array(chunks.reduce((n,b)=>n+b.length,0));at=0;for(const row of chunks){result.set(row,at);at+=row.length;}return result;
}
export function jpegDpi(value,dpi){
 const input=bytesOf(value);dpi=checkedDpi(dpi);
 if(input.length<4||input[0]!==255||input[1]!==216)throw Error('Nederīgs JPG attēls.');
 const bytes=input.slice();let at=2;
 while(at+4<=bytes.length){
  if(bytes[at]!==255)break;const marker=bytes[at+1];if(marker===0xda||marker===0xd9)break;
  const length=(bytes[at+2]<<8)|bytes[at+3];if(length<2||at+2+length>bytes.length)throw Error('JPG fails ir nepilnīgs.');
  if(marker===0xe0&&length>=16&&String.fromCharCode(...bytes.subarray(at+4,at+9))==='JFIF\0'){
   bytes[at+11]=1;bytes[at+12]=dpi>>8;bytes[at+13]=dpi&255;bytes[at+14]=dpi>>8;bytes[at+15]=dpi&255;return bytes;
  }
  at+=2+length;
 }
 const jfif=new Uint8Array([255,224,0,16,74,70,73,70,0,1,2,1,dpi>>8,dpi&255,dpi>>8,dpi&255,0,0]);
 const result=new Uint8Array(bytes.length+jfif.length);result.set(bytes.subarray(0,2));result.set(jfif,2);result.set(bytes.subarray(2),2+jfif.length);return result;
}
