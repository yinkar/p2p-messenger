
var x = null;

(function () {
  $.fn.shake = function (options) {
    // Defaults
    var settings = {
      'shakes': 3,
      'distance': 15,
      'duration': 400
    };
    // Merge options
    if (options) {
      $.extend(settings, options);
    }
    // Make it so
    var pos;
    return this.each(function () {
      $this = $(this);
      // Position if necessary
      pos = $this.css('position');
      if (!pos || pos === 'static') {
        $this.css('position', 'relative');
      }
      // Shake it
      for (var x = 1; x <= settings.shakes; x++) {
        $this.animate({ left: settings.distance * -1, top: settings.distance * -1 }, (settings.duration / settings.shakes) / 4)
          .animate({ left: settings.distance }, (settings.duration / settings.shakes) / 2)
          .animate({ left: 0, top: 0 }, (settings.duration / settings.shakes) / 4);
      }
    });
  };

  function clear(str) {
    let replaceTable = {
      '<': '&lt;',
      '>': '&gt;'
    };

    for (o in replaceTable) {
      str = str.replaceAll(o, replaceTable[o]);
    }

    return str;
  }

  var nofiticationEnabled = false;

  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      nofiticationEnabled = true;
    }
    else {
      Notification.requestPermission()
        .then(function (result) {
          nofiticationEnabled = true;
          notify('İzin verildi');
        })
        .catch(function (err) {
          nofiticationEnabled = false;
        });
    }

  }

  var docTitle = 'P2P Chat';

  function notify(_title, _body) {
    var title = _title;
    var options = {
      body: _body
    }

    if (nofiticationEnabled) {
      var n = new Notification(title, options);
      return n;
    }
  }

  $(window).focus(function () {
    document.title = docTitle;
  });

  function msgNofity(_title, _body) {
    if (!document.hasFocus()) {
      notify(_title, _body);
      document.title = 'New messages';
    }
    else {
      document.title = docTitle;
    }
  }


  var peer = null;
  var peerID = null;
  var conn = null;
  var randName = null;
  var remoteID = null;

  function initialize() {
    $('#room').html('');
    $('#remote-id').focus();
    $('#connect-panel').show();

    $('#messagebox').hide();
    $('#nudge').hide();

    $('#message').prop('disabled', false);
    $('#messagebox button').prop('disabled', false);

    randName = Math.floor((Math.random() * 9999) + 1);

    peer = new Peer('Denek' + randName, {
      config: {
        'iceServers': [
          { urls: 'stun:stun01.sipphone.com' },
          { urls: 'stun:stun.ekiga.net' },
          { urls: 'stun:stun.fwdnet.net' },
          { urls: 'stun:stun.ideasip.com' },
          { urls: 'stun:stun.iptel.org' },
          { urls: 'stun:stun.rixtelecom.se' },
          { urls: 'stun:stun.schlund.de' },
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          { urls: 'stun:stunserver.org' },
          { urls: 'stun:stun.softjoys.com' },
          { urls: 'stun:stun.voiparound.com' },
          { urls: 'stun:stun.voipbuster.com' },
          { urls: 'stun:stun.voipstunt.com' },
          { urls: 'stun:stun.voxgratia.org' },
          { urls: 'stun:stun.xten.com' },
          {
            urls: 'turn:numb.viagenie.ca',
            credential: 'muazkh',
            username: 'webrtc@live.com'
          },
          {
            urls: 'turn:192.158.29.39:3478?transport=udp',
            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            username: '28224511:1379330808'
          },
          {
            urls: 'turn:192.158.29.39:3478?transport=tcp',
            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            username: '28224511:1379330808'
          }
        ]
      }
    });

    peerID = peer.id;

    peer.on('open', function (id) {
      if (peer.id === null) {
        peer.id = 'Denek' + Math.floor((Math.random() * 9999) + 1);
      }

      $('#local-id').text(peer.id.substring(5));
      $('#status').text('Waiting...');
    });

    peer.on('connection', function (c) {
      remoteID = c.peer;
      if (conn) {
        c.on('open', function () {
          c.send('Already there\'s a client');
          setTimeout(function () {
            c.close();
          }, 500);
        });
        return;
      }

      conn = c;

      $('#connect-panel').fadeOut();

      $('#messagebox').fadeIn();
      $('#nudge').fadeIn();
      $('#message').focus();

      $('#room').show();

      x = conn;

      $('#status').text('Connected to: ' + conn.peer.substring(5));

      conn.on('data', function (data) {
        $('#isTyping').text('Typing...');

        if (data.message) {
          var message = clear(data.message);
          var owner = clear(remoteID);
          $('#room').append('<div class="message-container remote-message-container"><div class="message remote"><p> ' + message + '</p></div></div>');

          $('#room').scrollTop($('#room')[0].scrollHeight);

          $('#typingMessage').text('');

          msgNofity(owner, message);
        }

        if (data.typingMessage) {
          $('#typingMessage').text(data.typingMessage);
        }

        if (data.nudge) {
          $('#chat').shake();
          $('#room').append('<div class="message-container remote-message-container"><div class="message remote"><p><em>' + data.id.substring(5) + ' sent you a nudge</em></p></div></div>');
          $('#room').scrollTop($('#room')[0].scrollHeight);
          $('#nudgesound')[0].play();
          msgNofity(data.id + ' bir titreşim yolladı', '');
        }
      });
    });

    peer.on('disconnected', function () {
      $('#status').text('Connection lost');
    });

    peer.on('close', function () {
      conn = null;
      $('#status').text('Connection closed');
    });

    peer.on('error', function (err) {
      alert('' + err);
    });
  }

  $('#connect-panel').submit(function (e) {
    e.preventDefault();

    var remoteIDValue = 'Denek' + $('#remote-id').val();

    remoteID = remoteIDValue;

    if (conn) {
      conn.close();
    }

    conn = peer.connect(remoteIDValue, {
      reliable: true
    });

    x = conn;

    conn.on('open', function () {
      $('#status').text('Connected to: ' + conn.peer.substring(5));

      $('#connect-panel').fadeOut();

      $('#messagebox').fadeIn();
      $('#nudge').fadeIn();
      $('#message').focus();

      $('#room').show();
    });

    conn.on('close', function () {
      $('#status').text('Connection closed');

      x = null;

      $('#message').prop('disabled', true);
      $('#messagebox button').prop('disabled', true);
      setTimeout(function () {
        initialize();
      }, 5000);
    });

    conn.on('data', function (data) {
      $('#isTyping').text('Typing...');

      if (data.typingMessage) {
        $('#typingMessage').text(data.typingMessage);
      }

      if (data.message) {
        var message = clear(data.message);
        var owner = clear(remoteID);
        $('#room').append('<div class="message-container remote-message-container"><div class="message remote"><p> ' + message + '</p></div></div>');

        $('#room').scrollTop($('#room')[0].scrollHeight);

        $('#typingMessage').text('');

        msgNofity(owner, message);
      }

      if (data.nudge) {
        $('#chat').shake();
        $('#room').append('<div class="message-container remote-message-container"><div class="message remote"><p><em>' + data.id.substring(5) + ' sent you a nudge</em></p></div></div>');
        $('#room').scrollTop($('#room')[0].scrollHeight);
        $('#nudgesound')[0].play();

        msgNofity(data.id + ' bir titreşim yolladı', '');
      }
    });
  });
  initialize();

  setInterval(function () {
    $('#isTyping').text('');
  }, 1000);

  $('#messagebox').submit(function (e) {
    e.preventDefault();
    var message = clear($('#message').val());
    var owner = clear(peerID);
    $('#message').val('');
    $('#room').append('<div class="message-container client-message-container"><div class="message client"><p> ' + message + '</p></div></div>');

    if (conn) {
      conn.send({ message: message });
    }

    $('#room').scrollTop($('#room')[0].scrollHeight);

    $('#message').focus();
  });

  $('#nudge').click(function (e) {
    e.preventDefault();
    conn.send({ id: peerID, nudge: true });
    $('#chat').shake();
    $('#room').append('<div class="message-container client-message-container"><div class="message client"><p><em>You sent a nudge</em></p></div></div>');
    $('#room').scrollTop($('#room')[0].scrollHeight);
    $('#nudgesound')[0].play();
  });

  $('#message').on('input', function (e) {
    if (conn) {
      conn.send({ typing: true, typingMessage: $(this).val() });
    }
  });

  window.onbeforeunload = confirmExit;
  function confirmExit() {
    if (conn) {
      return "Are you sure to exit?";
    }
  }
})();