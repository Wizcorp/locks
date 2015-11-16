var locks = require('..');
var test = require('tape');

var trueTest = function (value) { return value === true; };
var falseTest = function (value) { return value === false; };


test('CondVariable', function (t) {
	var cond = locks.createCondVariable(false);
	var timerFired = false;

	t.throws(function () {
		cond.wait({}, function () {});
	}, 'Objects are not valid conditions to wait for')

	t.equal(cond.get(), false, 'Condition starts false');

	cond.wait(trueTest, function () {
		t.equal(this.get(), true, 'Condition is true');

		cond.set(null);

		var fired = 0;
		var expect = 4;

		cond.wait('foo', function () {
			t.equal(this.get(), 'foo', 'String matching');
			fired += 1;
		});

		cond.wait(/foo/, function () {
			t.equal(this.get(), 'foo', 'RegExp matching');
			fired += 1;
		});

		cond.wait(5, function () {
			t.equal(this.get(), 5, 'Number matching');
			fired += 1;
		});

		cond.wait(false, function () {
			t.equal(this.get(), false, 'Boolean matching');
			fired += 1;
		});

		cond.set('foo');
		cond.set(5);
		cond.set(false);

		t.equal(fired, 4, 'All match types fired');

		t.end();
	});

	cond.wait(falseTest, function () {
		t.equal(this.get(), false, 'Condition is false');
		t.equal(timerFired, false, 'Timer has not yet fired');
	});

	setTimeout(function () {
		timerFired = true;
		cond.set(true);
	}, 10);
});
