var Semaphore = require('./lib/SemaphorePromise');


exports.Semaphore = Semaphore;


exports.createSemaphore = function (initialCount) {
	return new Semaphore(initialCount);
};
