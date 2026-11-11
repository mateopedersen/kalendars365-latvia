const data=require('../_data/garden-crops.json'),G=require('../assets/garden-core.js');
process.stdout.write(JSON.stringify({crops:data.crops.map(G.resolveCrop),sources:data.sources.map(({id,title,url,publisherScope})=>({id,title,url,publisherScope})),common:{regionalGuidance:data.common.regionalGuidance,yearlyFrostGuard:data.common.yearlyFrostGuard}}));
