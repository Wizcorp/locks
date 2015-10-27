var locks = require('..');
var test = require('tape');

test('Mutex', function (t) {
	var mutex = locks.createMutex();

	t.equal(mutex.isLocked, false, 'Unlocked');

	mutex.lock(function () {
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

			mutex.timedLock(100, function (error) {
				t.error(error, 'Lock attempt did not time out');

				t.end();
			});
		});
	});
});
