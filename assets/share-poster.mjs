// The poster uses only reviewed public artwork, never the personal planner model.
function lines(ctx,text,maxWidth){const rows=[];let row='';for(const word of text.split(/\s+/)){if(ctx.measureText(row+' '+word).width>maxWidth&&row){rows.push(row);row=word;}else row+=(row?' ':'')+word;}if(row)rows.push(row);return rows;}
export async function createSharePoster(context,format='square'){
 const width=1080,height=format==='story'?1920:1080,canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');
 if(document.fonts)await document.fonts.ready;
 const image=new Image();image.decoding='async';const u=new URL(context.posterSource||context.image,location.origin);image.src=u.pathname+u.search;await image.decode();
 ctx.fillStyle='#faf5ed';ctx.fillRect(0,0,width,height);const glow=ctx.createRadialGradient(960,0,10,600,400,1300);glow.addColorStop(0,'#e8d2d8');glow.addColorStop(1,'#fffdf6');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
 ctx.fillStyle='#7e2943';ctx.font='750 25px "DM Sans",sans-serif';ctx.fillText('KALENDĀRS365 · LATVIJAI',64,87);
 const top=format==='story'?145:135,boxHeight=format==='story'?1040:490;
 ctx.save();ctx.shadowColor='#51394730';ctx.shadowBlur=42;ctx.shadowOffsetY=20;ctx.fillStyle='#fffdf8';ctx.beginPath();ctx.roundRect(54,top,972,boxHeight,32);ctx.fill();ctx.restore();
 ctx.save();ctx.beginPath();ctx.roundRect(64,top+10,952,boxHeight-20,24);ctx.clip();
 if(context.template){const scale=Math.min(900/image.naturalWidth,(boxHeight-50)/image.naturalHeight),w=image.naturalWidth*scale,h=image.naturalHeight*scale;ctx.drawImage(image,540-w/2,top+(boxHeight-h)/2,w,h);}
 else{const scale=Math.min(952/image.naturalWidth,(boxHeight-20)/image.naturalHeight),w=image.naturalWidth*scale,h=image.naturalHeight*scale;ctx.drawImage(image,540-w/2,top+(boxHeight-h)/2,w,h);}
 ctx.restore();
 let fontSize=format==='story'?72:56,titleLines;do{ctx.font=`750 ${fontSize}px "DM Sans",sans-serif`;titleLines=lines(ctx,context.title.replace(/\s*\|\s*Kalendārs365$/,''),940);if(titleLines.length<=3)break;fontSize-=2;}while(fontSize>30);
 ctx.fillStyle='#352832';const y=top+boxHeight+90;titleLines.slice(0,4).forEach((line,i)=>ctx.fillText(line,64,y+i*fontSize*1.18));
 ctx.strokeStyle='#d9b8bf';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(64,height-149);ctx.lineTo(1016,height-149);ctx.stroke();ctx.fillStyle='#7e2943';ctx.font='750 34px "DM Sans",sans-serif';ctx.fillText('kalendars365.lv',64,height-92);
 ctx.fillStyle='#695d64';let creditSize=16,credit=context.credits||'Kalendārs365 oriģinālais dizains';do{ctx.font=`500 ${creditSize}px "DM Sans",sans-serif`;if(lines(ctx,credit,952).length<=2)break;creditSize--;}while(creditSize>10);lines(ctx,credit,952).slice(0,2).forEach((row,i)=>ctx.fillText(row,64,height-53+i*18));
 ctx.font='500 11px \"DM Sans\",sans-serif';ctx.fillText('Avoti: kalendars365.lv/pilsetas-un-fotografijas/#kopigosanas-vaki',64,height-13);
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Image export failed')),'image/png'));
}
