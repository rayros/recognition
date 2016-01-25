define(['dojo/Deferred', 'dojo/topic', 'dojo/debounce'], function(Deferred, topic, debounce) {
  var rec = new webkitSpeechRecognition(),
    commands = [],
    started,
    lang;
  function testCommand(command) {
    var match;
    if((match = msg.match(command[0]))) {
      topic.publish('recognition/command', command[0])
      if(command[1]) command[1](match);
    }
  }
  rec.continuous = true;
  rec.interimResults = false;
  rec.lang = lang || 'en-GB';
  rec.onstart = function() {
    topic.publish('recognition/start');
  };
  rec.onresult = function(event) {
    var msg = '';
    for(var i = event.resultIndex; i < event.results.length; ++i) {
      if(event.results[i].isFinal)
        msg = event.results[i][0].transcript;
      else
        msg += event.results[i][0].transcript;
    }
    topic.publish('recognition/recognize', msg);
    commands.forEach(testCommand);
  };
  rec.onend = function() {
    if(started) debounce(rec.start, 1000).bind(this)();
    else topic.publish('recognition/stop');
  };
  return {
    start: function() {
      var deffered = new Deferred(),
          self = this;
      navigator.webkitGetUserMedia({audio: true}, function() {
        if((started = !started)) rec.start();
        deffered.resolve(self);
      }, function(error) {
        deffered.reject(error);
      });
      return deffered.promise;
    },
    stop: function() {
      if(!(started = !started)) rec.stop();
    },
    lang: function(lang) {
      rec.lang = lang;
      return this;
    },
    command: function(regexp, fn) {
      commands.push([regexp, fn]);
      return this;
    }
  };
})
