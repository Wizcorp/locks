function ReadWriteLock() {
	this.isLocked = null;
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

		if (!cb) {
			that.unlock();
			return;
		}

		cb();
		cb = null;
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

		if (!cb) {
			that.unlock();
			return;
		}

		cb();
		cb = null;
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
