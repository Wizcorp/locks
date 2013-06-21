
// Semaphores

function Semaphore(initialCount) {
	this._count = initialCount || 1;
	this._waiting = [];
}


Semaphore.prototype.signal = function () {
	this._count += 1;

	if (this._count > 0) {
		var waiter = this._waiting.shift();
		if (waiter) {
			waiter();
		}
	}
};


Semaphore.prototype.wait = function (cb) {
	this._count -= 1;

	if (this._count < 0) {
		this._waiting.push(cb);
	} else {
		cb();
	}
};


// Condition variables

function CondVariable(initialValue) {
	this._value = initialValue;
	this._waiting = [];
}


CondVariable.prototype.wait = function (fnTest, cb) {
	if (fnTest(this._value)) {
		return cb();
	}

	this._waiting.push({ fnTest: fnTest, cb: cb });
};


CondVariable.prototype.set = function (value) {
	this._value = value;

	for (var i = 0; i < this._waiting.length; i++) {
		var waiter = this._waiting[i];

		if (waiter.fnTest(value)) {
			waiter.cb();
			this._waiting.splice(i, 1);
			i -= 1;
		}
	}
};


// Mutex locks

function Mutex() {
	this.isLocked = false;
	this._waiting = [];
}


Mutex.prototype.lock = function (cb) {
	if (this.isLocked) {
		this._waiting.push(cb);
	} else {
		this.isLocked = true;
		cb();
	}
};


Mutex.prototype.timedLock = function (ttl, cb) {
	if (!this.isLocked) {
		this.isLocked = true;
		return cb();
	}

	var timer, that = this;

	this._waiting.push(function () {
		clearTimeout(timer);

		if (cb) {
			cb();
			cb = null;
		}

		that.unlock();
	});

	timer = setTimeout(function () {
		if (cb) {
			cb(new Error('Lock timed out'));
			cb = null;
		}
	}, ttl);
};


Mutex.prototype.tryLock = function () {
	if (this.isLocked) {
		return false;
	}

	this.isLocked = true;
	return true;
};


Mutex.prototype.unlock = function () {
	if (!this.isLocked) {
		throw new Error('Mutex is not locked');
	}

	var waiter = this._waiting.shift();

	if (waiter) {
		waiter();
	} else {
		this.isLocked = false;
	}
};


// Read/Write locks

function ReadWriteLock() {
	this.isLocked = null;
	this._readLocks = 0;
	this._waitingToRead = [];
	this._waitingToWrite = [];
}


ReadWriteLock.prototype.readLock = function (cb) {
	if (this.isLocked === 'W') {
		this._waitingToRead.push(cb);
	} else {
		this._readLocks += 1;
		this.isLocked = 'R';
		cb();
	}
};


ReadWriteLock.prototype.writeLock = function (cb) {
	if (this.isLocked) {
		this._waitingToWrite.push(cb);
	} else {
		this.isLocked = 'W';
		cb();
	}
};


ReadWriteLock.prototype.timedReadLock = function (ttl, cb) {
	if (this.tryReadLock()) {
		return cb();
	}

	var timer, that = this;

	this._waitingToRead.push(function () {
		clearTimeout(timer);

		if (cb) {
			cb();
			cb = null;
		}

		that.unlock();
	});

	timer = setTimeout(function () {
		if (cb) {
			cb(new Error('ReadLock timed out'));
			cb = null;
		}
	}, ttl);
};


ReadWriteLock.prototype.timedWriteLock = function (ttl, cb) {
	if (this.tryWriteLock()) {
		return cb();
	}

	var timer, that = this;

	this._waitingToWrite.push(function () {
		clearTimeout(timer);

		if (cb) {
			cb();
			cb = null;
		}

		that.unlock();
	});

	timer = setTimeout(function () {
		if (cb) {
			cb(new Error('WriteLock timed out'));
			cb = null;
		}
	}, ttl);
};


ReadWriteLock.prototype.tryReadLock = function () {
	if (this.isLocked === 'W') {
		return false;
	}

	this.isLocked = 'R';
	this._readLocks += 1;
	return true;
};


ReadWriteLock.prototype.tryWriteLock = function () {
	if (this.isLocked) {
		return false;
	}

	this.isLocked = 'W';
	return true;
};


ReadWriteLock.prototype.unlock = function () {
	var waiter;

	if (this.isLocked === 'R') {
		this._readLocks -= 1;

		if (this._readLocks === 0) {
			// allow one write lock through

			waiter = this._waitingToWrite.shift();
			if (waiter) {
				this.isLocked = 'W';
				waiter();
			} else {
				this.isLocked = null;
			}
		}
	} else if (this.isLocked === 'W') {
		// allow all read locks or one write lock through

		var rlen = this._waitingToRead.length;

		if (rlen === 0) {
			waiter = this._waitingToWrite.shift();
			if (waiter) {
				this.isLocked = 'W';
				waiter();
			} else {
				this.isLocked = null;
			}
		} else {
			this.isLocked = 'R';
			this._readLocks = rlen;

			var waiters = this._waitingToRead.slice();
			this._waitingToRead = [];

			for (var i = 0; i < rlen; i++) {
				waiters[i]();
			}
		}
	} else {
		throw new Error('ReadWriteLock is not locked');
	}
};


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

