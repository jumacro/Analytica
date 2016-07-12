/**
 * Created by suman on 12/4/16.
 */

// extension:
jQuery.fn.scrollEnd = function(callback, timeout) {
  jQuery(this).scroll(function(){
    var $this = jQuery(this);
    if ($this.data('scrollTimeout')) {
      clearTimeout($this.data('scrollTimeout'));
    }
    $this.data('scrollTimeout', setTimeout(callback,timeout));
  });
};



(function(){
  /**
   * (va)2 default recording options.
   * This Object can be overriden when calling the va2.record method.
   */
  var vaOpt = {
    /**
     * Tracking frequency, in frames per second.
     * @type number
     */
    fps: 24,
    /**
     * Maximum recording time (aka tracking timeout), in seconds.
     * When the timeout is reached, mouse activity is not recorded.
     * If this value is set to 0, there is no timeout.
     * @type number
     */
    recTime: 0,
    /**
     * Interval to send data, in seconds
     * If timeout is reached, mouse activity is not recorded.
     * @type number
     */
    postInterval: 20,
    /**
     * URL to local (va)2 website, i.e., the site URL to track (with the va*.js files).
     * If this property is empty, the system will detect it automatically.
     * @type string
     */
    trackingServer: "",
    /**
     * URL to remote (va)2 server, i.e., the site URL where the logs will be stored,
     * and (of course) the CMS is installed.
     * If this value is empty, data will be posted to trackingServer URL (recommended).
     * @deprecated in favor of the new 'Access-Control-Allow-Origin' HTTP header.
     * @type string
     */
    storageServer: "",
    /**
     * You may choose to advice users (or not) that their mouse activity is going to be logged.
     * Not doing so may be illegal in some countries.
     * @type boolean
     */
    warn: false,
    /**
     * Text to display when advising users (if warn: true).
     * You can split lines in the confirm dialog by typing the char \n.
     * @type string
     */
    warnText: "We'd like to study your mouse activity." +"\n"+ "Do you agree?",
    /**
     * Cookies lifetime (in days) to reset both first time users and agreed-to-track visitors.
     * @type int
     */
    cookieDays: 365,
    /**
     * Main layout content diagramation; a.k.a 'how page content flows'.
     * Values:
     *  "left" (content is fixed and ragged left;
     *  "center" (content is fixed and centered;
     *  "right" (content is fixed and ragged right; e.g. ???),
     *  "liquid" (adaptable, optionally centered (or not); default behavior of web pages).
     * @type string
     */
    layoutType: "liquid",
    /**
     * Recording can stop/resume on blur/focus to save space in your DB.
     * Depending on your goals/experiment/etc., you may want to tweak this behavior.
     * @type boolean
     */
    contRecording: false,
    /**
     * Compress tracking data to lower bandwidth usage.
     * @type boolean
     */
    compress: false,
    /**
     * Random user selection: if true, (va)2 is not initialized.
     * Setting it to false (or 0) means that all the population will be tracked.
     * You should use random sampling for better statistical analysis:
     * disabled: Math.round(Math.random())
     * You can set your own sampling strategy; e.g. this one would track users only on Mondays:
     * disabled: (function(){ return (new Date().getDay() == 1); })()
     * @type int
     */
    disabled: 0,

    clearUserCookie: true,

    apiUserId: 0,

    scrollInitData: {
      xMousePos:0,
      yMousePos:0,
      lastScrolledLeft:0,
      lastScrolledTop:0
    },
    mouseMoveTimeOut: null,
    postDataTimeOut: null
  };


  /* do not edit below this line -------------------------------------------- */

  // get auxiliar functions
  var aux = window.va2fn;
  if (typeof aux === "undefined") { throw("Auxiliar va2fn functions not found"); }

  /**
   * recording object.
   * This Object is private. Methods are cited but not documented.
   */
  var vaRec = {
    i: 0,                                  // step counter
    mouse:     { x:0, y:0 },               // mouse position
    page:      { width:0, height:0 },      // data normalization
    coords:    { x:[], y:[], p:[] },       // position coords and mouse click state (~ pressure)
    elem:      { hovered:[], clicked:[] }, // clicked and hovered elements
    url:       null,                       // document URL
    rec:       null,                       // recording identifier
    userId:    null,                       // user identifier
    vaId:     null,                       // va identifier
    append:    null,                       // append data identifier
    paused:    false,                      // check active window
    clicked:   false,                      // no mouse click yet
    timestamp: null,                       // current date's timestamp
    timeout:   null,                       // tracking timeout
    xmlhttp:   aux.createXMLHTTPObject(),  // common XHR object
    ftu:       1,                          // assume a first time user initially

    /**
     * Pauses recording.
     * The mouse activity is tracked only when the current window has focus.
     */
    pauseRecording: function()
    {
      vaRec.paused = true;
    },
    /**
     * Resumes recording. The current window gain focus.
     */
    resumeRecording: function()
    {
      vaRec.paused = false;
    },
    /**
     * Cross-browser way to register the mouse position.
     * @autor Peter-Paul Koch (quirksmode.org)
     */
    getMousePos: function(e)
    {
      if (!e) var e = window.event;

      var x = 0, y = 0;
      if (e.pageX || e.pageY) {
        x = e.pageX;
        y = e.pageY;
      }	else if (e.clientX || e.clientY) {
        x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop  + document.documentElement.scrollTop;
      }
      // in certain situations the mouse coordinates could be negative values (e.g. Opera)
      if (x < 0 || !x) x = 0;
      if (y < 0 || !y) y = 0;

      vaRec.mouse.x = x;
      vaRec.mouse.y = y;
    },
    /**
     * Cross-browser way to register the mouse position inside an iframe.
     */
    getMousePosIFrame: function(e, frame)
    {
      // we don't want to stop tracking when interacting on an iframe (a blur event is triggered)
      vaRec.pause = false;

      var x = e.pageX || e.clientX;
      var y = e.pageY || e.clientY;
      var d = frame.contentDocument || frame.contentWindow;
      if (d.body) {
        x -= d.body.scrollLeft;
        y -= d.body.scrollTop;
      }
      if (d.documentElement) {
        x -= d.documentElement.scrollLeft;
        y -= d.documentElement.scrollTop;
      }
      var c = vaRec.getFrameOffsets(frame);
      x += c.left;
      y += c.top;

      vaRec.mouse.x = x;
      vaRec.mouse.y = y;
    },
    /**
     * Computes iframe offsets.
     */
    getFrameOffsets: function(frame)
    {
      var frm = (frame && frame.frameElement) ? frame.frameElement : frame;
      var l = 0, t = 0;
      if (frm && frm.offsetParent) {
        do {
          l += frm.offsetLeft;
          t += frm.offsetTop;
        } while (frm = frm.offsetParent);
      }
      return { left:l , top:t }
    },
    /**
     * This method allows to register single clicks and drag and drop operations.
     */
    setClick: function()
    {
      vaRec.clicked = true;
    },
    /**
     * User releases the mouse.
     */
    releaseClick: function()
    {
      vaRec.clicked = false;
    },
    /**
     * (va)2 recording loop.
     * Tracks mouse coords when they're inside the client window,
     * so zero and null values are not taken into account.
     */
    recMouse: function()
    {
      // track mouse only if window is active (has focus)
      if (vaRec.paused) { return; }
      // get mouse coords until timeout is reached
      if (vaRec.i <= vaRec.timeout || vaRec.timeout == 0) {
        // store using the UNIPEN format
        vaRec.coords.x.push(vaRec.mouse.x);
        vaRec.coords.y.push(vaRec.mouse.y);
        vaRec.coords.p.push(+vaRec.clicked);
      } else {
        // timeout reached
        clearInterval(vaRec.rec);
        clearInterval(vaRec.append);
      }
      // next step
      ++vaRec.i;
    },
    /**
     * Retrieves cursor data fields.
     */
    getCursorDataFields: function()
    {
      var data  = "&pagew="       + vaRec.page.width;
      data += "&pageh="       + vaRec.page.height;
      if (vaOpt.compress) {
        data += "&xcoords="   + aux.LZW.compress(vaRec.coords.x.join(","));
        data += "&ycoords="   + aux.LZW.compress(vaRec.coords.y.join(","));
        data += "&clicks="    + aux.LZW.compress(vaRec.coords.p.join(","));
        data += "&elhovered=" + aux.LZW.compress(vaRec.elem.hovered.join(","));
        data += "&elclicked=" + aux.LZW.compress(vaRec.elem.clicked.join(","));
        data += "&compressed=1";
      } else {
        data += "&xcoords="   + vaRec.coords.x;
        data += "&ycoords="   + vaRec.coords.y;
        data += "&clicks="    + vaRec.coords.p;
        data += "&elhovered=" + vaRec.elem.hovered;
        data += "&elclicked=" + vaRec.elem.clicked;
      }
      return data;
    },
    /**
     * Sends data in background via an XHR object.
     * This function starts the tracking session.
     * @return void
     * @param {boolean} async Whether request should be asynchronous or not (default: true)
     */
    initMouseData: function(async)
    {
      vaRec.computeAvailableSpace();

      if(typeof vaRec.session_id == "undefined"){
        vaRec.session_id = 0;
      }

      // prepare data
      var data  = "client="     + vaRec.vaId;
      data += "&user_id="       + vaOpt.apiUserId;
      data += "&sess_id="       + vaRec.session_id;
      data += "&url="       + vaRec.url;
      data += "&urltitle="  + document.title;
      data += "&cookies="   + document.cookie;
      data += "&screenw="   + screen.width;
      data += "&screenh="   + screen.height;
      data += "&layout="    + vaOpt.layoutType;
      data += "&time="      + vaRec.getBrowsingTime();
      data += "&fps="       + vaOpt.fps;
      data += "&ftu="       + vaRec.ftu;
      data += vaRec.getCursorDataFields();
      data += "&action="    + "store";
      data += "&remote="    + vaOpt.storageServer;

      // send request
      vaRec.sendData({
        async:     async,
        postdata:  data,
        callback:  vaRec.setUserId
      });
      // clean
      vaRec.clearMouseData();
    },
    /**
     * Sets va ID.
     * @return void
     */
    setTrackingId: function()
    {
      var id;
      if (aux.cookies.checkCookie('va-id')) {
        id = aux.cookies.getCookie('va-id');
      } else {
        id = md5( String(Math.random() + (new Date()).getTime() * Math.random()) );
        // for cross-domain requests, this cookie must be set here
        aux.cookies.setCookie('va-id', id, vaOpt.cookieDays);
        // this ID will identify the client machine
      }
      vaRec.vaId = id;

      if (aux.cookies.checkCookie('va-userId')) {
        vaRec.userId = aux.cookies.getCookie('va-userId');
      }

      if (aux.cookies.checkCookie('va-sessId')) {
        vaRec.session_id = aux.cookies.getCookie('va-sessId');
      }
    },
    /**
     * Sets the user ID.
     * @return void
     * @param {string} response  XHR response text
     */
    setUserId: function(response)
    {
      var jsonData = JSON.parse(response);
      //console.log(jsonData);
      //vaRec.userId = parseInt(response.uid);
      vaRec.userId = parseInt(jsonData.uid);
      vaRec.session_id = parseInt(jsonData.session_id);
      if (vaRec.userId > 0) {
        aux.cookies.setCookie('va-userId', vaRec.userId, vaOpt.cookieDays);
        aux.cookies.setCookie('va-sessId', vaRec.session_id, vaOpt.cookieDays);
        //console.log(vaRec.userId );
        // once the session started, append mouse data
        vaRec.append = setInterval(function(){
          //vaRec.appendMouseData(true);
          vaRec.appendMouseData(true);
        }, vaOpt.postInterval*1000);
      }
    },
    /** Gets current time (in seconds). */
    getBrowsingTime: function()
    {
      var ms = (new Date()).getTime() - vaRec.timestamp;

      return ms/1000; // use seconds
    },
    /**
     * Sends data (POST) in asynchronously mode (or not) via an XHR object.
     * This function appends the mouse data to the current tracking session.
     * If user Id is not set, mouse data are queued.
     * @return void
     * @param {boolean} async Whether request should be asynchronous or not (default: true)
     */
    appendMouseData: function(async)
    {
      if (!vaRec.rec || vaRec.paused) { return false; }
      if(typeof vaRec.session_id == "undefined"){
        vaRec.session_id = 0;
      }
      // prepare data
      var data  = "uid="        + vaRec.userId;
      data += "&user_id="       + vaOpt.apiUserId;
      data += "&cookies="   + document.cookie;
      data += "&sess_id="       + vaRec.session_id;
      data += "&url="       + vaRec.url;
      data += "&time="      + vaRec.getBrowsingTime();
      data += vaRec.getCursorDataFields();
      data += "&action="    + "append";
      data += "&remote="    + vaOpt.storageServer;

      // send request
      vaRec.sendData({
        async:    async,
        postdata: data
      });
      // clean
      vaRec.clearMouseData();
    },
    /**
     * Sends cursor data.
     */
    sendData: function(req) {
      req.url = aux.ensureLastURLSlash(vaOpt.trackingServer) + "api/api.php";
      req.xmlhttp = vaRec.xmlhttp;
      aux.sendAjaxRequest(req);
    },
    /**
     * Flushes mouse data from queue.
     */
    flushData: function()
    {
      if (vaRec.userId) {
        vaRec.appendMouseData(false);
      } else {
        vaRec.initMouseData(false);
      }
    },
    /**
     * Clears mouse data from queue.
     */
    clearMouseData: function()
    {
      vaRec.coords.x = [];
      vaRec.coords.y = [];
      vaRec.coords.p = [];
      vaRec.elem.hovered = [];
      vaRec.elem.clicked = [];
    },
    /**
     * Finds hovered or clicked DOM element.
     */
    findElement: function(e)
    {
      if (!e) { e = window.event; }
      // bind function to widget tracking object
      aux.widget.findDOMElement(e, function(name){
        if (e.type == "mousedown" || e.type == "touchstart") {
          vaRec.elem.clicked.push(name);
        } else if (e.type == "mousemove" || e.type == "touchmove") {
          vaRec.elem.hovered.push(name);
        }
      });
    },
    /**
     * Computes page size.
     */
    computeAvailableSpace: function()
    {
      var doc = aux.getPageSize();
      vaRec.page.width  = doc.width;
      vaRec.page.height = doc.height;
    },
    /**
     * Tracks mouse activity inside iframes.
     * This function will fail silently on iframes outside the domain of the caller HTML.
     * @param {Object}  d   document object
     * @return void
     */
    trackIFrames: function(d)
    {
      var iframes = d.getElementsByTagName('iframe'), doc, newdoc, frame;
      // set a common function for mobile clients
      var onFrameLoaded = function(d) {
        aux.addEvent(d, "mousedown", vaRec.setClick);
        aux.addEvent(d, "mouseup",   vaRec.releaseClick);
        aux.addEvent(d, "touchstart", vaRec.setClick);
        aux.addEvent(d, "touchend",   vaRec.releaseClick);
      };
      // grab iframes
      for (var i = 0, f = iframes.length; i < f; ++i) {
        doc = (window.opera) ? iframes[i] : iframes[i].contentWindow || iframes[i].contentDocument;
        //try { var localAccess = doc.domain; } catch(err) { continue; }
        // we can access only the iframes on the same domain than the caller HTML
        if (doc.attachEvent && !window.opera) {
          // get mouse position for IE on iframe :'(
          var cloned = iframes[i].cloneNode(true);
          iframes[i].parentNode.replaceChild(cloned, iframes[i]);
          // now add dynamically the load event
          iframes[i].onreadystatechange = function(e) {
            if (this.readyState === "complete") {
              frame = this.contentWindow;
              newdoc = frame.document;
              aux.addEvent(newdoc, "mousemove", function(e){
                vaRec.getMousePosIFrame(this.parentWindow.event, this.frames.frameElement);
              });
              aux.addEvent(newdoc, "touchmove", function(e){
                vaRec.getMousePosIFrame(this.parentWindow.event, this.frames.frameElement);
              });
              onFrameLoaded(newdoc);
            }
          };
        } else {
          // get mouse position for all other browsers :'(
          if (doc.frameElement) doc = doc.frameElement;
          aux.addEvent(doc, "load", function(e){
            frame = e.target || e.srcElement;
            newdoc = frame.contentDocument;
            aux.addEvent(newdoc, "mousemove", function(e){
              vaRec.getMousePosIFrame(e, frame);
            });
            aux.addEvent(newdoc, "touchmove", function(e){
              vaRec.getMousePosIFrame(e, frame);
            });
            onFrameLoaded(newdoc);
          });
        }
        /*
         // recursive traversal?
         vaRec.trackIFrames(doc.document);
         aux.allowTrackingOnFlashObjects(doc.document);
         */
      }
    },
    /**
     * Not implemented, as it's not really needed (too much intrusion into user's privacy).
     */
    keyHandler: function(e) {
    },
    /**
     * Clear cookies
     */
    clearUserCookie: function(){
      //console.log(document.referrer);
      //console.log(location.protocol + "//" + location.host);
      if(document.referrer != "" && document.referrer.indexOf(location.protocol + "//" + location.host) === 0){
        console.log("same session");
      } else {
        console.log("new session");
        aux.cookies.deleteCookie('va-userId');
        aux.cookies.deleteCookie('va-id');
        aux.cookies.deleteCookie('va-sessId');
      }

    },

    /**
     * Custom mouse event
     */
    mouseEvent: function(type, sx, sy, cx, cy){
      var evt;
      var e = {
        bubbles: true,
        cancelable: (type != "mousemove"),
        view: window,
        detail: 0,
        screenX: sx,
        screenY: sy,
        clientX: cx,
        clientY: cy,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        button: 0,
        relatedTarget: undefined
      };
      if (typeof( document.createEvent ) == "function") {
        evt = document.createEvent("MouseEvents");
        evt.initMouseEvent(type,
          e.bubbles, e.cancelable, e.view, e.detail,
          e.screenX, e.screenY, e.clientX, e.clientY,
          e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
          e.button, document.body.parentNode);
      } else if (document.createEventObject) {
        evt = document.createEventObject();
        for (prop in e) {
          evt[prop] = e[prop];
        }
        evt.button = { 0:1, 1:4, 2:2 }[evt.button] || evt.button;
      }
      return evt;
    },

    /**
     * Custom dispatch event
     */
    dispatchEvent: function(el, evt) {
      if (el.dispatchEvent) {
        el.dispatchEvent(evt);
      } else if (el.fireEvent) {
        el.fireEvent('on' + type, evt);
      }
      return evt;
    },

    onScroll: function(e) {
      if(vaOpt.scrollInitData.lastScrolledLeft != jQuery(document).scrollLeft()){
        vaOpt.scrollInitData.xMousePos -= vaOpt.scrollInitData.lastScrolledLeft;
        vaOpt.scrollInitData.lastScrolledLeft = $(document).scrollLeft();
        vaOpt.scrollInitData.xMousePos += vaOpt.scrollInitData.lastScrolledLeft;
      }
      if(vaOpt.scrollInitData.lastScrolledTop != jQuery(document).scrollTop()){
        vaOpt.scrollInitData.yMousePos -= vaOpt.scrollInitData.lastScrolledTop;
        vaOpt.scrollInitData.lastScrolledTop = jQuery(document).scrollTop();
        vaOpt.scrollInitData.yMousePos += vaOpt.scrollInitData.lastScrolledTop;
      }

      //vaRec.coords.x.push(vaOpt.scrollInitData.xMousePos);
      //vaRec.coords.y.push(vaOpt.scrollInitData.yMousePos);
      jQuery(window).scrollEnd(function(){
        //vaRec.recMouse();

        var prevUrl = document.referrer;
        var currentUrl = window.location.href;

        if (prevUrl != "" && prevUrl === currentUrl){
          if (vaRec.session_id) {
            vaRec.appendMouseData(true);
          } else {
            vaRec.initMouseData(true);
          }
        } else {
          vaRec.appendMouseData(true);
        }

        vaRec.timestamp = (new Date()).getTime();

      }, 500);

    },
    /**
     * System initialization.
     * Assigns events and performs other initialization routines.
     */
    init: function()
    {
      if(vaOpt.clearUserCookie){
        vaRec.clearUserCookie();
      }

      vaRec.setTrackingId();
      vaRec.computeAvailableSpace();
      // get this location BEFORE making the AJAX request
      vaRec.url = escape(window.location.href);
      // get user-defined recording timeout (if any)
      vaRec.timeout = vaOpt.fps * vaOpt.recTime;
      // set main function: the (va)2 recording interval
      var interval = Math.round(1000/vaOpt.fps);
      vaRec.rec   = setInterval(vaRec.recMouse, interval);
      // allow mouse tracking over Flash animations
      aux.allowTrackingOnFlashObjects(document);
      // get mouse coords also on iframes
      vaRec.trackIFrames(document);
      // reuse these functions for mobile clients
      var onMove = function(e) {
        if (e.touches) { e = e.touches[0] || e.targetTouches[0]; }
        vaRec.getMousePos(e);
        vaRec.findElement(e); // elements hovered
      };
      var onMouseOver = function(e) {
        vaRec.getMousePos(e);
        vaRec.findElement(e); // elements hovered
      };
      var onPress = function(e) {
        if (e.touches) { e = e.touches[0] || e.targetTouches[0]; }
        vaRec.setClick();
        vaRec.findElement(e); // elements clicked
      };
      aux.addEvent(document, "mousedown",  onPress);
      aux.addEvent(document, "mousemove",  onMove);
      aux.addEvent(document, "mouseup",    vaRec.releaseClick);
      aux.addEvent(document, "touchstart", onPress);
      aux.addEvent(document, "touchmove",  onMove);
      aux.addEvent(document, "touchend",   vaRec.releaseClick);
      aux.addEvent(window,   "resize",     vaRec.computeAvailableSpace);
      aux.addEvent(window,   "orientationchange", vaRec.computeAvailableSpace);
      //aux.addEvent(document, "mouseover",  onMouseOver);
      aux.addEvent(window,   "scroll", vaRec.onScroll);


      //aux.addEvent(document, "keydown",    vaRec.keyHandler);
      //aux.addEvent(document, "keyup",      vaRec.keyHandler);

      //vaRec.mouse.x = 2;
      //vaRec.mouse.y = 2;

      //vaRec.coords.x.push(vaRec.mouse.x);
      //vaRec.coords.y.push(vaRec.mouse.y);

      // check if recording should persist when current tab/window is not active
      if (!vaOpt.contRecording) {
        if (document.attachEvent && !window.opera) {
          aux.addEvent(document.body, "focusout", vaRec.pauseRecording);
          aux.addEvent(document.body, "focusin",  vaRec.resumeRecording);
        } else {
          aux.addEvent(window, "blur",  vaRec.pauseRecording);
          aux.addEvent(window, "focus", vaRec.resumeRecording);
        }
      }
      // flush mouse data when tracking ends
      if (typeof window.onbeforeunload == 'function') {
        // user closes the browser window
        aux.addEvent(window, "beforeunload", vaRec.flushData);
      } else {
        // page is unloaded (for old browsers)
        aux.addEvent(window, "unload", vaRec.flushData);
      }

      //track onload

      /*
       setTimeout(function(){
       var prevUrl = document.referrer;
       var currentUrl = window.location.href;
       if (prevUrl === currentUrl){
       if (vaRec.userId) {
       vaRec.appendMouseData(true);
       } else {
       vaRec.initMouseData(true);
       }
       } else {
       vaRec.initMouseData(true);
       }

       }, 500);
       */
      setTimeout(function(){
        vaRec.initMouseData(true);
      }, 500);

      // this is the best cross-browser method to store tracking data successfully
      /*setTimeout(function(){
        var prevUrl = document.referrer;
        var currentUrl = window.location.href;
        if (prevUrl === currentUrl){
          if (vaRec.userId) {
            vaRec.appendMouseData(true);
          } else {
            vaRec.initMouseData(true);
          }
        } else {
          vaRec.initMouseData(true);
        }

      }, vaOpt.postInterval*1000);*/
      // compute full session time by date instead of dividing coords length by frame rate
      vaRec.timestamp = (new Date()).getTime();
    }
  };

  // begin expose
  window.va2 = {
    methods: vaRec,
    // to begin recording, the tracking script must be called explicitly
    record: function(opts) {
      // load custom recording options, if any
      if (typeof opts !== 'undefined') { aux.overrideTrackingOptions(vaOpt, opts); }
      // does user browse for the first time?
      var previousUser = aux.cookies.getCookie('va-ftu');
      // do not skip first time users when current visit is not sampled
      if (vaOpt.disabled && previousUser) { return; }
      // store int numbers, not booleans (since it's casted to string for cookie storage)
      vaRec.ftu = (!previousUser | 0); // yes, it's a bitwise operation
      aux.cookies.setCookie('va-ftu', vaRec.ftu, vaOpt.cookieDays);
      // check if warning is enabled
      if (vaOpt.warn) {
        // did she agree for tracking before?
        var prevAgreed = aux.cookies.checkCookie('va-agreed');
        // if user is adviced, she must agree
        var agree = (prevAgreed) ? aux.cookies.getCookie('va-agreed') : window.confirm(vaOpt.warnText);
        if (agree) {
          aux.cookies.setCookie('va-agreed', 1, vaOpt.cookieDays);
        } else {
          // will ask next day (instead of vaOpt.cookieDays value)
          aux.cookies.setCookie('va-agreed', 1, vaOpt.cookieDays);
          return false;
        }
      }
      // try to auto-detect va2 path to tracking scripts
      var scripts = document.getElementsByTagName('script');
      for (var i = 0, s = scripts.length; i < s; ++i) {
        var filename = scripts[i].src;
        if (/va-record/i.test(filename)) {
          var paths = filename.split("/");
          var pos = aux.array.indexOf(paths, "va2");
          if (pos && !vaOpt.trackingServer) {
            vaOpt.trackingServer = paths.slice(0, pos+1).join("/");
          }
        }
      }
      // start recording when DOM is loaded
      aux.onDOMload(vaRec.init);
    } // end record
  }; // end expose

})();

