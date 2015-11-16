var locks = require('..');
var test = require('tape');


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
}


function timed(t, rwLock, cb) {
	rwLock.readLock(function () {});

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
			rwLock.unlock();
			cb();
		});

		setTimeout(function () {
			rwLock.unlock();
		}, 1);
	}, 10);
}


test('ReadWriteLock', function (t) {
	var rwLock = locks.createReadWriteLock();

	multiRead(t, rwLock);
	readWriteCombo(t, rwLock);

	timed(t, rwLock, function () {
		t.end();
	});
});
