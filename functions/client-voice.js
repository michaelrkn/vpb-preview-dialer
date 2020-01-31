exports.handler = function(context, event, callback) {
    let twiml = new Twilio.twiml.VoiceResponse();
    
    if (event.To) {
      if (event.RingUntilVoicemail) {
        var timeout = 30;
      } else {
        var timeout = 15;
      }
      
      const dial = twiml.dial({
        answerOnBridge: true,
        callerId: event.From,
        timeout: timeout
      });

      dial.number(context.TEST_PHONE_NUMBER || event.To);
    }
    
    callback(null, twiml);
  };