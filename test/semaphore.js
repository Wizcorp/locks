var locks = require('..');
var test = require('tape');


function testMany(t, cb) {
	var sem = locks.createSemaphore(2);  // 2 available resources
	t.equal(sem._count, 2, 'Starts with 2 available resources');

	function fn() {
		process.nextTick(function () {
			sem.signal();
		});
	}

	for (var i = 0; i < 100; i++) {
		sem.wait(fn);
	}

	setTimeout(function () {
		t.equal(sem._count, 2, 'Still 2 available resources');
		t.equal(sem._waiting.length, 0, 'Nobody waiting');
		cb();
	}, 0);
}


test('Semaphore', function (t) {
	testMany(t, function () {
		t.end();
	});
});
