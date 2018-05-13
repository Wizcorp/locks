var locks = require('../');
var test = require('tape');

function testPromise(t, cb) {
  var availableResources = 2;
  var parallelRunning = 0;
  var executionCount = 0;
  var sem = locks.createSemaphore(availableResources);  // 2 available resources

	function fn() {
		if (Math.random() < 0.5) {
			process.nextTick(function () {
				sem.signal();
        parallelRunning--;
			});
		} else {
			sem.signal();
      parallelRunning--;
		}
	}

	var prom = Promise.resolve();
  var maxParallel = 0;
	for (var i = 0; i < 100; i++) {
		prom = prom.then(function () {
      maxParallel = (parallelRunning > maxParallel ? parallelRunning : maxParallel);
      parallelRunning++;
      executionCount++;
			return sem.wait().then(fn);
		});
	}

  prom.then(() => {
    t.ok(maxParallel > 0 && maxParallel <= availableResources, 'Ensure parallelism level is under the resource limit')
    t.equal(executionCount, 100, 'ensure execution count')
    t.equal(sem._waiting.length, 0, 'Nobody waiting');
    cb();
  }).catch((e) => {
    cb(e);
  })
}


test('Semaphore Promise', function (t) {
	testPromise(t, function () {
		t.end();
	});
});
