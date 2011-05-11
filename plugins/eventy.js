/*
  Loadrunner Events

  This plugin extends loadrunner to depend on arbitrarily triggered
  events which need only be fired once.

  To depend on an arbitrary event, foo:
  using('event!foo', function() { ... });
  This will not trigger the loading of any files.
  Events do not pass any parameters to the function block.

  To trigger an event foo, and so execute the function block above:
  provide.trigger('foo');

  If a new 'using' block depends on an event that has already been fired,
  it will fired immediately.  This behaviour is similar to common domReady
  libraries.

  EVENTS ARE CONSIDERED AN ANTI-PATTERN FOR SCRIPT LOADING.
  ONLY USE IF THE SCRIPT AND MODULE TYPES CANNOT BE USED.

*/
(function() {
  function indexOf(arr, thing) {
    for (var i=0, item; item = arr[i]; i++) {
      if (thing == item) {
        return i;
      }
    }

    return -1;
  }

  // internally named 'pointy' to avoid confusion with other kinds of events
  // pointy because such events used to match '>foo'
  function pointy(id) {
    var dep;
    if (dep = pointy.inProgress[id]) {
      dep.complete();
      delete pointy.inProgress[id];
    }
    pointy.done.push(id);
  }
  pointy.inProgress = [];
  pointy.done = [];

  var Pointy = function(param, body) {
    this.param = param;
    this.body = body;
  }
  Pointy.prototype = new loadrunner.Dependency;
  Pointy.prototype.start = function() {
    var dep, me = this;
    if (this.body) {
      this.execute();
    }
    if (indexOf(pointy.done, this.param) != -1) {
      this.complete();
    } else if (dep = pointy.inProgress[this.param]) {
      dep.then(function() {
        me.complete();
      });
    } else {
      pointy.inProgress[this.param] = this;
    }
  }
  using.matchers.add(/^event\!/, function(id) {
    return new Pointy(id.split('event!')[1]);
  });

  window.provide.trigger = pointy;

}());