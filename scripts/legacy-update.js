// After creating a new environment, manually mo
exports.handler = function(context, event, callback) {
    const response = { twilioSubdomain: 'vpb-preview-dialer-3049-public'}
    callback(null, response);
  };