# v0.2.2

* Fixed race condition in ReadWriteLocks
* 100% unit test coverage

# v0.2.1

* All callbacks now have the object as `this` value
* Added tests for ReadWriteLock
* Added coverage test (rpm run cover)

# v0.2.0

## Semaphores

Deadlock fix (thanks to Miljenko Rebernisak)

## Condition variables

Conditions can now be a string, number, boolean, regexp, besides the previously supported function type. This changes
the condition test to a `===` equality-test or a regexp.test(). This allows code wait calls to become much shorter in
common cases. Example:

```js
cond.wait('ready', function () {
	console.log('It is ready!');
});
```

## General

Many unit tests have been added for mutexes, semaphores and condition variables.

# v0.1.0

First release
