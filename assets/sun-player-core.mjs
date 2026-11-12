// Viewport and transport math are separate from the astronomical calculation.
export function fitSunViewport({viewportHeight,chromeHeight,maximumStage=540,inset=12}) {
  if(![viewportHeight,chromeHeight,maximumStage,inset].every(Number.isFinite)||viewportHeight<=0||chromeHeight<0||maximumStage<=0||inset<0)throw new RangeError('Invalid player dimensions');
  const available=Math.max(1,viewportHeight-inset*2-chromeHeight);
  return Math.min(maximumStage,available);
}
export function advanceSunPlayback(minute,deltaMs,rate,maximum) {
  if(![minute,deltaMs,rate,maximum].every(Number.isFinite)||rate<=0||maximum<=0)throw new RangeError('Invalid playback position');
  const next=Math.max(0,minute)+Math.max(0,Math.min(deltaMs,250))*rate/1000;
  return {minute:Math.min(maximum,next),ended:next>=maximum};
}
