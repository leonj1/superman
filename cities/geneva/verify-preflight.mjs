#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const d=dirname(fileURLToPath(import.meta.url));
const read=(n)=>JSON.parse(readFileSync(join(d,n),"utf8"));
const ok=(v,m)=>{if(!v)throw new Error("Phase 068 preflight failed: "+m)};
const s=read("sources.json"),r=read("recipe.yml"),m=read("city.manifest.json"),e=read("exceptions.json").exceptions;
ok(s.city==="geneva"&&r.city==="geneva"&&m.city==="geneva","city mismatch");
ok(["imported","hybrid","procedural"].includes(r.creationMode),"invalid mode");
ok(r.targets.extents.heroZones.length===2,"two hero zones required");
const ids=new Set();for(const x of s.sources){ok(!ids.has(x.id),'duplicate source '+x.id);ids.add(x.id);ok(x.role&&x.status&&x.url,x.id+' incomplete');if(x.status==='approved'){ok(x.checksum&&x.acquiredAt,x.id+' missing hash');ok(['allowed','allowed-with-attribution'].includes(x.redistributionStatus),x.id+' rights')}else{ok(x.checksum===null,x.id+' unverified hash');ok(x.blocker,x.id+' blocker')}}
for(const x of m.sourceLineage)ok(s.sources.find((y)=>y.id===x)?.status==='approved','unapproved lineage '+x);
ok(r.releaseThresholds.minimumCoreLayerCoverage===0.995,'coverage gate');ok(r.releaseThresholds.minimumSsim===0.97,'SSIM gate');ok(r.releaseThresholds.minimumReleaseMedianFps===60,'FPS gate');ok(r.releaseThresholds.maximumConsecutiveOver33Ms===2,'jank gate');
ok(e.some((x)=>x.status==='open'),'blockers removed');ok(m.status==='cataloged'&&m.releaseHash===null&&m.tilesetUrl===null,'release claim');ok(m.content.length===0&&!m.performanceCertified&&m.visualEvidence===null,'fabricated evidence');
process.stdout.write(JSON.stringify({city:"geneva",phase:68,creationMode:r.creationMode,sources:s.sources.length,heroZones:r.targets.extents.heroZones.map((z)=>z.id),openExceptions:e.filter((x)=>x.status==="open").length,releasable:false},null,2)+"\n");
