function ReadWriteLock() {
	this._isLocked = false;
	this._readLocks = 0;
	this._waitingToRead = [];
	this._waitingToWrite = [];
}

module.exports = ReadWriteLock;


ReadWriteLock.prototype.readLock = function (cb) {
	if (this._isLocked === 'W') {
		this._waitingToRead.push(cb);
	} else {
		this._readLocks += 1;
		this._isLocked = 'R';
		cb.call(this);
	}
};


ReadWriteLock.prototype.writeLock = function (cb) {
	if (this._isLocked) {
		this._waitingToWrite.push(cb);
	} else {
		this._isLocked = 'W';
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

Object.defineProperty(ReadWriteLock.prototype, 'isReadLocked', {
	get: function () {
		return this._isLocked === 'R';
	}
});

Object.defineProperty(ReadWriteLock.prototype, 'isWriteLocked', {
	get: function () {
		return this._isLocked === 'W';
	}
});

ReadWriteLock.prototype.tryReadLock = function () {
	if (this._isLocked === 'W') {
		return false;
	}

	this._isLocked = 'R';
	this._readLocks += 1;
	return true;
};


ReadWriteLock.prototype.tryWriteLock = function () {
	if (this._isLocked) {
		return false;
	}

	this._isLocked = 'W';
	return true;
};


ReadWriteLock.prototype.unlock = function () {
	var waiter;

	if (this._isLocked === 'R') {
		this._readLocks -= 1;

		if (this._readLocks === 0) {
			// allow one write lock through

			waiter = this._waitingToWrite.shift();
			if (waiter) {
				this._isLocked = 'W';
				waiter.call(this);
			} else {
				this._isLocked = false;
			}
		}
	} else if (this._isLocked === 'W') {
		// allow all read locks or one write lock through

		var rlen = this._waitingToRead.length;

		if (rlen === 0) {
			waiter = this._waitingToWrite.shift();
			if (waiter) {
				this._isLocked = 'W';
				waiter.call(this);
			} else {
				this._isLocked = false;
			}
		} else {
			this._isLocked = 'R';
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
