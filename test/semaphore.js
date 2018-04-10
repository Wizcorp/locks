var locks = require('..');
var test = require('tape');


function testMany(t, cb) {
	var sem;

	sem = locks.createSemaphore();  // default resources should be 1
	t.equal(sem._count, 1, 'Defaults to 2 available resources');

	sem = locks.createSemaphore(2);  // 2 available resources
	t.equal(sem._count, 2, 'Created with 2 available resources');

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

function testPromise(t, cb) {
	var sem = locks.createSemaphore(2);  // 2 available resources

	function fn() {
		if (Math.random() < 0.5) {
			process.nextTick(function () {
				sem.signal();
			});
		} else {
			sem.signal();
		}
	}

	var prom = Promise.resolve();
	for (var i = 0; i < 100; i++) {
		prom = prom.then(function () {
			return sem.waitAsync().then(fn);
		});
	}

	prom.then(function() {
		t.equal(sem._count, 2, 'Still 2 available resources');
		t.equal(sem._waiting.length, 0, 'Nobody waiting');
		cb();
	}).catch(function(e) {
		cb(e);
	});
}

test('Semaphore', function (t) {
	testMany(t, function () {
		testPromise(t, function() {
			t.end();
		});
	});
});
