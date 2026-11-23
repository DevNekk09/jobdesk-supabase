import test from 'node:test';
import assert from 'node:assert/strict';
import {sqlForPg} from '../lib/sql.mjs';
test('PG translator rewrites only app tables',()=>{
 assert.equal(sqlForPg('SELECT j.id,u.name FROM jobs j JOIN users u ON u.id=j.created_by WHERE j.id=?'), 'SELECT j.id,u.name FROM jobdesk.jobs j JOIN jobdesk.users u ON u.id=j.created_by WHERE j.id=$1');
 assert.equal(sqlForPg('UPDATE job_spaces SET name=? WHERE id=?'), 'UPDATE jobdesk.job_spaces SET name=$1 WHERE id=$2');
 assert.equal(sqlForPg('DELETE FROM activity WHERE job_id=ANY(?::int[])'),'DELETE FROM jobdesk.activity WHERE job_id=ANY($1::int[])');
 assert.equal(sqlForPg('SELECT * FROM jobdesk.users WHERE id=?'),'SELECT * FROM jobdesk.users WHERE id=$1');
 // Member soft-delete also revokes older V2 staff sessions and unused invitations.
 // The tables are private and absent from the default PostgreSQL search_path.
 assert.equal(sqlForPg('UPDATE staff_sessions SET revoked_at=now() WHERE user_id=? AND revoked_at IS NULL'),
   'UPDATE jobdesk.staff_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL');
 assert.equal(sqlForPg('UPDATE staff_invites SET redeemed_at=now() WHERE user_id=? AND redeemed_at IS NULL'),
   'UPDATE jobdesk.staff_invites SET redeemed_at=now() WHERE user_id=$1 AND redeemed_at IS NULL');
 assert.equal(sqlForPg('SELECT * FROM jobdesk.staff_sessions WHERE user_id=?'),
   'SELECT * FROM jobdesk.staff_sessions WHERE user_id=$1');

});
