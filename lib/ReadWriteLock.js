function ReadWriteLock() {
	this.isLocked = false;
	this._readLocks = 0;
	this._waitingToRead = [];
	this._waitingToWrite = [];
}

module.exports = ReadWriteLock;


ReadWriteLock.prototype.readLock = function (cb) {
	if (this.isLocked === 'W') {
		this._waitingToRead.push(cb);
	} else {
		this._readLocks += 1;
		this.isLocked = 'R';
		cb.call(this);
	}
};


ReadWriteLock.prototype.writeLock = function (cb) {
	if (this.isLocked) {
		this._waitingToWrite.push(cb);
	} else {
		this.isLocked = 'W';
		cb.call(this);
	}
};


ReadWriteLock.prototype.timedReadLock = function (ttl, cb) {
	if (this.tryReadLock()) {
		return cb.call(this);
	}

	var timer, that = this;

	function waiter() {
		clearTimeout(timer);

		if (cb) {
			var callback = cb;
			cb = null;
			callback.apply(that, arguments);
		}
	}

	this._waitingToRead.push(waiter);

	timer = setTimeout(function () {
		var index = that._waitingToRead.indexOf(waiter);
		if (index !== -1) {
			that._waitingToRead.splice(index, 1);
			waiter(new Error('ReadLock timed out'));
		}
	}, ttl);
};


ReadWriteLock.prototype.timedWriteLock = function (ttl, cb) {
	if (this.tryWriteLock()) {
		return cb.call(this);
	}

	var timer, that = this;

	function waiter() {
		clearTimeout(timer);

		if (cb) {
			var callback = cb;
			cb = null;
			callback.apply(that, arguments);
		}
	}

	this._waitingToWrite.push(waiter);

	timer = setTimeout(function () {
		var index = that._waitingToWrite.indexOf(waiter);
		if (index !== -1) {
			that._waitingToWrite.splice(index, 1);
			waiter(new Error('WriteLock timed out'));
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
				waiter.call(this);
			} else {
				this.isLocked = false;
			}
		}
	} else if (this.isLocked === 'W') {
		// allow all read locks or one write lock through

		var rlen = this._waitingToRead.length;

		if (rlen === 0) {
			waiter = this._waitingToWrite.shift();
			if (waiter) {
				this.isLocked = 'W';
				waiter.call(this);
			} else {
				this.isLocked = false;
			}
		} else {
			this.isLocked = 'R';
			this._readLocks = rlen;

			var waiters = this._waitingToRead.slice();
			this._waitingToRead = [];

			for (var i = 0; i < rlen; i++) {
				waiters[i].call(this);
			}
		}
	} else {
		throw new Error('ReadWriteLock is not locked');
	}
};
