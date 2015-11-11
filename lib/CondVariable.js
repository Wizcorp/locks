function CondVariable(initialValue) {
	this._value = initialValue;
	this._waiting = [];
}

module.exports = CondVariable;


function condToFunc(cond) {
	if (typeof cond === 'function') {
		return cond;
	}

	if (typeof cond === 'number' || typeof cond === 'boolean' || typeof cond === 'string') {
		return function (value) {
			return value === cond;
		};
	}

	if (cond && typeof cond === 'object' && cond instanceof RegExp) {
		return function (value) {
			return cond.test(value);
		};
	}

	throw new TypeError('Unknown condition type: ' + (typeof cond));
}


CondVariable.prototype.get = function () {
	return this._value;
};


CondVariable.prototype.wait = function (cond, cb) {
	var test = condToFunc(cond);

	if (test(this._value)) {
		return cb.call(this);
	}

	this._waiting.push({ test: test, cb: cb });
};


CondVariable.prototype.set = function (value) {
	this._value = value;

	for (var i = 0; i < this._waiting.length; i++) {
		var waiter = this._waiting[i];

		if (waiter.test(value)) {
			this._waiting.splice(i, 1);
			i -= 1;
			waiter.cb.call(this);
		}
	}
};
