# Locks

Locks implements locking/synchronization mechanisms that have traditionally
been used for protecting shared memory between multiple threads. JavaScript is
inherently single threaded and does not suffer from these security and
stability issues. However, because of its asynchronous eventy nature JavaScript
can still benefit from making particular operations wait for the completion of
others.

## Installation

Node.js users:
```bash
npm install locks
```

Component users:
```bash
component install Wizcorp/locks
```

## API

Accessing the locks module:
```javascript
var locks = require('locks');
```

Please note that all the examples below will also demonstrate how to unlock
each time. But in general, this matters:
```javascript
// unlocking will give waiting processes a chance to get the lock and continue
myLock.unlock();
```

### Mutex locks

Mutex locks are the most basic locks which aim to prevent the simultaneous
access to a resource by more than one actor at a time.
[more info](http://en.wikipedia.org/wiki/Mutual_exclusion)

Creating a Mutex Lock:
```javascript
var mutex = locks.createMutex();
```

Waiting to lock:
```javascript
mutex.lock(function () {
	console.log('We got the lock!');
	// do stuff
	mutex.unlock();
});
```

Waiting to lock, with timeout:
```javascript
mutex.timedLock(5000, function (error) {
	if (error) {
		console.log('Could not get the lock within 5 seconds, so gave up');
	} else {
		console.log('We got the lock!');
		// do stuff
		mutex.unlock();
	}
});
```

Optimistic attempt to lock:
```javascript
if (mutex.tryLock()) {
	console.log('We got the lock!');
	// do stuff
	mutex.unlock();
} else {
	console.log('Could not get the lock at this time');
}
```

### Read/Write locks

Read/Write Locks are used to allow many actors to read from a resource, as
long as nothing is writing to it. That also means that only one actor may be
writing at any given time.
[more info](http://en.wikipedia.org/wiki/Readers%E2%80%93writer_lock)

Creating a Read/Write Lock:
```javascript
var rwlock = locks.createReadWriteLock();
```

Waiting to read lock:
```javascript
rwlock.readLock(function () {
	console.log('We may now read from a resource!');
	// do stuff
	rwlock.unlock();
});
```

Waiting to write lock:
```javascript
rwlock.writeLock(function () {
	console.log('We may now write to a resource!');
	// do stuff
	rwlock.unlock();
});
```

Waiting to read lock, with timeout:
```javascript
rwlock.timedReadLock(5000, function (error) {
	if (error) {
		console.log('Could not get the lock within 5 seconds, so gave up');
	} else {
		console.log('We may now read from a resource!');
		// do stuff
		rwlock.unlock();
	}
});
```

Waiting to write lock, with timeout:
```javascript
rwlock.timedWriteLock(5000, function (error) {
	if (error) {
		console.log('Could not get the lock within 5 seconds, so gave up');
	} else {
		console.log('We may now write to a resource!');
		// do stuff
		rwlock.unlock();
	}
});
```

Optimistic attempt to read lock:
```javascript
if (rwlock.tryReadLock()) {
	console.log('We may now read from a resource!');
	// do stuff
	rwlock.unlock();
} else {
	console.log('Could not get the lock at this time');
}
```

Optimistic attempt to write lock:
```javascript
if (rwlock.tryWriteLock()) {
	console.log('We may now write to a resource!');
	// do stuff
	rwlock.unlock();
} else {
	console.log('Could not get the lock at this time');
}
```

### Condition variables

Condition variables allow synchronization between processes based on values.

Creating a Condition Variable:
```javascript
var initialValue = 'hello world';
var cond = locks.createCondVariable(initialValue);
```

Waiting for a condition to be met:
```javascript
cond.wait(
	function conditionTest(value) {
		return value.indexOf('こんにちは') !== -1;
	},
	function whenConditionMet() {
		console.log('Our welcome message is in Japanese!');
	}
);
```

Setting the value on a Condition Variable:
```javascript
cond.set('こんにちは世界！');
```

### Semaphores

Semaphores solve the problem of sharing a limited set of resources.
[more info](http://en.wikipedia.org/wiki/Semaphore_%28programming%29)

Creating a Semaphore:
```javascript
var initialValue = 3;  // amount of resources available
var sem = locks.createSemaphore(initialValue);
```

Claiming and releasing a resource:
```javascript
sem.wait(function () {
	console.log('We may now access one resource!');
	// do stuff
	// release the resource
	sem.signal();
});
```

## License

MIT

