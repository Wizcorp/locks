var locks = require('..');
var test = require('tape');


test('Mutex', function (t) {
	var mutex = locks.createMutex();

	t.equal(mutex.isLocked, false, 'Unlocked');

	var unlockedByNextLock = false;
	var instantTimedLockSuccess = false;

	mutex.timedLock(1, function () {
		instantTimedLockSuccess = true;
		mutex.unlock();
	});

	t.equal(instantTimedLockSuccess, true, 'Timed lock fired instantly');

	t.throws(function () {
		mutex.unlock();
	}, 'Cannot unlock an unlocked mutex');

	mutex.lock(function () {
		setTimeout(function () {
			t.equal(unlockedByNextLock, false, 'Next lock is waiting');
			mutex.unlock();
			t.equal(unlockedByNextLock, true, 'Next lock executed');
		}, 10);
	});

	mutex.lock(function () {
		unlockedByNextLock = true;
		t.equal(mutex.isLocked, true, 'Locked');

		var success = mutex.tryLock();

		t.equal(success, false, 'Try failed');

		mutex.unlock();

		success = mutex.tryLock();

		t.equal(success, true, 'Try succeeded');

		mutex.timedLock(1, function (error) {
			t.ok(error, 'Lock attempt timed out');  // we expect an error

			setTimeout(function () {
				mutex.unlock();
			}, 10);

			mutex.timedLock(1000, function (error) {
				t.error(error, 'Lock attempt did not time out');

				t.end();
			});
		});
	});
});
