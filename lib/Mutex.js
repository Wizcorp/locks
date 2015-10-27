function Mutex() {
	this.isLocked = false;
	this._waiting = [];
}

module.exports = Mutex;


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

		if (!cb) {
			that.unlock();
			return;
		}

		cb();
		cb = null;
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
