var Semaphore = require('./lib/Semaphore');
var CondVariable = require('./lib/CondVariable');
var Mutex = require('./lib/Mutex');
var ReadWriteLock = require('./lib/ReadWriteLock');


exports.Semaphore = Semaphore;
exports.CondVariable = CondVariable;
exports.Mutex = Mutex;
exports.ReadWriteLock = ReadWriteLock;


exports.createCondVariable = function (initialValue) {
	return new CondVariable(initialValue);
};

exports.createSemaphore = function (initialCount) {
	return new Semaphore(initialCount);
};

exports.createMutex = function () {
	return new Mutex();
};

exports.createReadWriteLock = function () {
	return new ReadWriteLock();
};
