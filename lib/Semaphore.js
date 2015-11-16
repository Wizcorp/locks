function Semaphore(initialCount) {
	this._count = initialCount || 1;
	this._waiting = [];
}

module.exports = Semaphore;


Semaphore.prototype.wait = function (cb) {
	this._count -= 1;

	if (this._count < 0) {
		this._waiting.push(cb);
	} else {
		cb.call(this);
	}
};


Semaphore.prototype.signal = function () {
	this._count += 1;

	if (this._count <= 0) {
		var waiter = this._waiting.shift();
		if (waiter) {
			waiter.call(this);
		}
	}
};
