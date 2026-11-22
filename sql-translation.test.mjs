import test from 'node:test';
import assert from 'node:assert/strict';
import {sqlForPg} from '../lib/sql.mjs';
test('PG translator rewrites only app tables',()=>{
 assert.equal(sqlForPg('SELECT j.id,u.name FROM jobs j JOIN users u ON u.id=j.created_by WHERE j.id=?'), 'SELECT j.id,u.name FROM jobdesk.jobs j JOIN jobdesk.users u ON u.id=j.created_by WHERE j.id=$1');
 assert.equal(sqlForPg('UPDATE job_spaces SET name=? WHERE id=?'), 'UPDATE jobdesk.job_spaces SET name=$1 WHERE id=$2');
 assert.equal(sqlForPg('DELETE FROM activity WHERE job_id=ANY(?::int[])'),'DELETE FROM jobdesk.activity WHERE job_id=ANY($1::int[])');
 assert.equal(sqlForPg('SELECT * FROM jobdesk.users WHERE id=?'),'SELECT * FROM jobdesk.users WHERE id=$1');
});
