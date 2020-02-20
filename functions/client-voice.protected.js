exports.handler = function(context, event, callback) {
  let twiml = new Twilio.twiml.VoiceResponse();
  if (event.To) {
    if (event.RingUntilVoicemail === "true") {
      var timeout = 30;
    } else {
      var timeout = 15;
    }

    if (context.DEV) {
      var number = context.DEV_NUMBER;
    } else {
      var number = event.To;
    }

    const dial = twiml.dial({
      answerOnBridge: true,
      callerId: event.From,
      timeout: timeout
    });
    dial.number(number);
  }

  callback(null, twiml);
};
