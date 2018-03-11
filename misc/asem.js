// Semaphore class
var asem = function(fireFunc, initLock) {
  this.lock = initLock || 0;
  this.func = fireFunc;
}
asem.prototype.v = function() {
  this.lock++;
}
asem.prototype.p = function() {
  this.lock--;
  if (this.lock == 0 && this.func) this.func();
}

module.exports = asem;
