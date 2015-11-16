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
		cb.call(this);
	}
};


Mutex.prototype.timedLock = function (ttl, cb) {
	if (!this.isLocked) {
		this.isLocked = true;
		return cb.call(this);
	}

	var timer, that = this;

	this._waiting.push(function () {
		clearTimeout(timer);

		if (!cb) {
			that.unlock();
			return;
		}

		cb.call(this);
		cb = null;
	});

	timer = setTimeout(function () {
		if (cb) {
			cb.call(this, new Error('Lock timed out'));
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
		waiter.call(this);
	} else {
		this.isLocked = false;
	}
};
