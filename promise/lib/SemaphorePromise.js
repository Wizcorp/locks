var Semaphore = require('../../lib/Semaphore');

function SemaphorePromise (initialCount) {
  this._count = initialCount || 1;
	this._waiting = [];
}

module.exports = SemaphorePromise;

SemaphorePromise.prototype.wait = function () {
  var self = this;
  return new Promise(function (resolve, reject) {
    self._wait(resolve);
  });
}
SemaphorePromise.prototype.signal = Semaphore.prototype.signal
SemaphorePromise.prototype._wait = Semaphore.prototype.wait
