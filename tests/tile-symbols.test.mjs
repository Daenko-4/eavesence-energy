import assert from 'node:assert/strict';
import test from 'node:test';
import {iconForTile} from '../packages/core/src/tileSymbols.ts';
import {createHomeTile, defaultHomeTiles, readHomeTiles, reorderHomeTiles} from '../src/lib/homeTiles.ts';
import {createHouseholdBackup, createHouseholdProfile, readHouseholdBackup} from '../src/lib/household.ts';
import {convertWebBackup} from '../apps/mobile/src/webBackup.ts';
import {readMobileBackup} from '../apps/mobile/src/backup.ts';
import {readTiles} from '../apps/mobile/src/tiles.ts';

test('chosen and explicitly hidden icons survive sorting, web backups and mobile import', () => {
  const tiles = [
    {...defaultHomeTiles()[0], icon:null},
    {...createHomeTile('costs','Insurance','insurance'), id:'insurance'},
  ];
  const sorted = reorderHomeTiles(tiles,'insurance','default-costs');
  assert.deepEqual(readHomeTiles(JSON.stringify(sorted)),sorted);
  const profile=createHouseholdProfile({name:'Home',currency:'EUR',electricityPrice:.3,savingsGoalPercent:10,roomNames:[]});
  const cost={id:'policy',name:'Policy',category:'insurance',amount:120,frequency:'yearly',tileId:'insurance',nextDueDate:'2026-12-01',updatedAt:profile.createdAt};
  const backup=createHouseholdBackup({profile,devices:[],history:[],costs:[cost],tiles:sorted});
  const json=JSON.stringify(backup);
  assert.deepEqual(readHouseholdBackup(json).tiles,sorted);
  const mobile=convertWebBackup(json);
  assert.deepEqual(mobile.tiles.map(t=>[t.id,t.icon]),sorted.map(t=>[t.id,t.icon]));
  assert.deepEqual(mobile.costs,[cost]);
  assert.deepEqual(readMobileBackup(JSON.stringify(mobile)),mobile);
  assert.equal(iconForTile(mobile.tiles.find(t=>t.id==='default-costs')),null);
});

test('unsupported icon metadata does not discard an otherwise valid cost area', () => {
  const old=defaultHomeTiles();
  assert.deepEqual(readHomeTiles(JSON.stringify(old)),old);
  assert.equal(iconForTile(old[0]),'housing');
  const future=[{...old[0],icon:'future-icon'}, {id:'internet',kind:'costs',title:'Internet',icon:'internet'}];
  assert.deepEqual(readHomeTiles(JSON.stringify(future)),[old[0],future[1]]);
  assert.deepEqual(readTiles(future.map(t=>({...t,title:t.title??'Household costs'}))),[
    {...old[0],title:'Household costs'},future[1],
  ]);
});
