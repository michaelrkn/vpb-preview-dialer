exports.handler = function(context, event, callback) {
    let twiml = new Twilio.twiml.VoiceResponse();
    
    if (event.To) {
      if (event.RingUntilVoicemail) {
        var timeout = 30;
      } else {
        var timeout = 1; //15;
      }
      
      const dial = twiml.dial({
        answerOnBridge: true,
        callerId: event.From,
        timeout: timeout
      });
      dial.number('4153475723'); //event.To);
    }
    
    callback(null, twiml);
  };