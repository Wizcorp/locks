var locks = require('..');
var test = require('tape');


function baseTests(t, rwLock) {
	t.throws(function () {
		rwLock.unlock();
	}, 'Cannot unlock an unlocked ReadWrite lock');
}


function multiRead(t, rwLock) {
	t.equal(rwLock.isLocked, false, 'Unlocked');

	var count = 0;

	rwLock.readLock(function () {
		t.equal(rwLock.isLocked, 'R', 'Read-locked');
		count += 1;
		t.equal(count, 1, 'First read lock fired immediately');

		rwLock.readLock(function () {
			t.equal(rwLock.isLocked, 'R', 'Still read-locked');
			count += 1;
			t.equal(count, 2, 'Second read lock fired immediately');
		});
	});

	count = -1;

	rwLock.unlock();
	t.equal(rwLock.isLocked, 'R', 'Still read-locked');
	rwLock.unlock();
}


function readWriteCombo(t, rwLock) {
	t.equal(rwLock.isLocked, false, 'Unlocked');

	var count = '';

	rwLock.readLock(function () {
		count += 'R';
	});

	rwLock.writeLock(function () {
		count += 'W';

		rwLock.readLock(function () {
			count += 'R';
		});
	});

	rwLock.readLock(function () {
		count += 'R';
	});

	t.equal(count, 'RR', 'Not yet write-locked');
	rwLock.unlock();
	rwLock.unlock();
	t.equal(rwLock.isLocked, 'W', 'Write-locked');
	t.equal(count, 'RRW', 'Write-locked');
	rwLock.unlock();
	t.equal(count, 'RRWR', 'Read-locked');
	rwLock.unlock();
}


function manyWriters(t, rwlock) {
	var count = '';

	rwlock.writeLock(function () {
		count += 'W';
	});

	rwlock.writeLock(function () {
		count += 'W';
	});

	rwlock.writeLock(function () {
		count += 'W';
	});

	t.equal(count, 'W');
	rwlock.unlock();
	t.equal(count, 'WW');
	rwlock.unlock();
	t.equal(count, 'WWW');
	rwlock.unlock();
}


function triers(t, rwLock) {
	var success;

	success = rwLock.tryWriteLock();
	t.equal(success, true, 'Try WriteLock success');

	success = rwLock.tryWriteLock();
	t.equal(success, false, 'Try WriteLock failure');

	success = rwLock.tryReadLock();
	t.equal(success, false, 'Try ReadLock failure');

	rwLock.unlock();

	success = rwLock.tryReadLock();
	t.equal(success, true, 'Try ReadLock success');
	success = rwLock.tryReadLock();
	t.equal(success, true, 'Try ReadLock success');

	success = rwLock.tryWriteLock();
	t.equal(success, false, 'Try WriteLock failure');

	rwLock.unlock();
	rwLock.unlock();
}


function timed(t, rwLock, cb) {
	// should fire instantly:
	rwLock.timedReadLock(10, function () {});

	t.equal(rwLock.isLocked, 'R', 'Read-locked');

	rwLock.timedWriteLock(1, function (error) {
		t.ok(error, 'Write-lock attempt timed out');  // we expect an error
	});

	setTimeout(function () {
		rwLock.unlock();

		rwLock.writeLock(function () {});

		t.equal(rwLock.isLocked, 'W', 'Write-locked');

		rwLock.timedReadLock(1000, function () {
			t.equal(rwLock.isLocked, 'R', 'Read-locked');

			rwLock.timedWriteLock(10, function () {
				t.equal(rwLock.isLocked, 'W', 'Write-locked');

				// write lock that times out:
				rwLock.timedWriteLock(1, function (error) {
					t.ok(error, 'Write-lock timed out');

					rwLock.unlock();
					t.equal(rwLock.isLocked, false, 'Unlocked');

					// should fire instantly:
					rwLock.timedWriteLock(1000, function () {});
					t.equal(rwLock.isLocked, 'W', 'Write-locked');

					// write lock that times out:
					rwLock.timedReadLock(1, function (error) {
						t.ok(error, 'Read-lock timed out');

						rwLock.unlock();
						cb();
					});
				});
			});

			setTimeout(function () {
				rwLock.unlock();
			}, 1);
		});

		setTimeout(function () {
			rwLock.unlock();
		}, 1);
	}, 10);
}


test('ReadWriteLock', function (t) {
	var rwLock = locks.createReadWriteLock();

	baseTests(t, rwLock);
	multiRead(t, rwLock);
	readWriteCombo(t, rwLock);
	manyWriters(t, rwLock);
	triers(t, rwLock);

	timed(t, rwLock, function () {
		t.end();
	});
});
