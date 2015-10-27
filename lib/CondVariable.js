function CondVariable(initialValue) {
	this._value = initialValue;
	this._waiting = [];
}

module.exports = CondVariable;


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
