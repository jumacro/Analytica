/**
 * Created by suman on 12/4/16.
 */


(function(){
  /**
   * (va)2 default replaying options.
   * This Object should be overriden from the 'customize' section at the (va)2 CMS.
   */
  var vaOpt = {
    /**
     * Entry point color
     * @type string
     */
    entryPt:  "#9F6",
    /**
     * Exit point color
     * @type string
     */
    exitPt:   "#F66",
    /**
     * Registration points color
     * @type string
     */
    regPt:    "#F0F",
    /**
     * Lines color
     * @type string
     */
    regLn:    "#0CC",
    /**
     * Clicks color
     * @type string
     */
    click:    "#F00",
    /**
     * Drag and drop color
     * @type string
     */
    dDrop:    "#ABC",
    /**
     * User stops: time-depending circles color
     * @type string
     */
    varCir:   "#F99",
    /**
     * Centroid color
     * @type string
     */
    cenPt:    "#DDD",
    /**
     * Clusters color
     * @type string
     */
    clust:    "#00F",
    /**
     * Background layer color
     * @type string
     */
    bgColor: "#555",
    /**
     * Draw background layer (true) or not (false)
     * @type boolean
     */
    bgLayer:  true,
    /**
     * Static (false) or dynamic mouse replay (true)
     * @type boolean
     */
    realTime: true,
    /**
     * Show direction vector (useful if realTime: false)
     * @type boolean
     */
    dirVect:  false,
    /**
     * Main layout content diagramation; a.k.a 'how page content flows'.
     * Values: "left" (fixed), "center" (fixed and centered), or "liquid" (adaptable, default behavior).
     * In "left" and "center" layouts the content is not adapted on resizing the browser.
     * @type string
     */
    layoutType: "liquid",

    drawAll: true,

    drawCursor: false,
    drawLine: true,
    drawClick: false,
    drawDirectionArrow: false,
    drawClusters: false,
    drawCentroid: false,
    drawMouseStop: false,
    drawVariableCircle: false,
    drawRegistrationPoint: false,
    logIndex: 0,
    totalLogs: 1,
    sid: 0,
    trackurl: 'track.php'
  };


  /* do not edit below this line -------------------------------------------- */

  // get libraries/globals
  var vaData     = window.va2data;
  //var vCustomProp     = window.vCustomProp;
  var jsGraphics  = window.jsGraphics;
  var aux         = window.va2fn;
  // check
  if (typeof vaData === 'undefined')     { throw("user data is malformed or not set");  }
  if (typeof jsGraphics === 'undefined')  { throw("jsGraphics library not found");       }
  if (typeof aux === 'undefined')         { throw("auxiliar functions not found"); }
  if (typeof JSON.parse !== 'function')   { throw("JSON parser not found");              }

  // when using the JS api, draw only the average path
  var user;
  //console.log(vaData.users);
  var users = JSON.parse(unescape(vaData.users));
  var numUsers = users.length;
  if (numUsers > 1) {
    for (var i = 0; i < numUsers; ++i) {
      if (users[i].avg) {
        user = users[i];
        break;
      }
    }
  } else {
    user = users[0];
  }

  // remove null distances to compute the mouse path centroid
  var xclean = [];
  var yclean = [];

  /**
   * replaying object.
   * This Object is private. Methods are cited but not documented.
   */
  var vaRep = {
    i:            0,                        // mouse tracking global counter var
    j:            1,                        // registration points size global counter var
    jMax:         0,                        // registration points size limit
    play:         null,                     // mouse tracking identifier
    jg:           null,                     // canvas area for drawing
    jgClust:      null,                     // layer for clustering
    jgHelper:     null,                     // layer for displaying text info
    page:         { width:0, height:0 },    // data normalization
    viewport:     { width:0, height:0 },    // center scrolling
    discrepance:  { x:1, y:1 },             // discrepance ratios
    paused:       false,                    // pause the visualization
    mcursor:      "mouse-pointer",                          // mouse cursor
    /**
     * Create drawing canvas layer.
     */
    createCanvas: function(layerName)
    {
      // canvas layer for mouse trackig
      var jg = document.createElement("div");
      jg.id             = layerName;
      jg.style.position = "absolute";
      jg.style.top      = 0;
      jg.style.left     = 0;
      jg.style.width    = 100 + '%';
      jg.style.height   = 100 + '%';
      jg.style.zIndex   = aux.getNextHighestDepth() + 1;

      // helper layer for text
      var jgHelp = document.createElement("div");
      jgHelp.id              = layerName + "Help";
      jgHelp.style.zIndex    = jg.style.zIndex + 1;

      // layer for clustering
      var opacity = 40;
      var jgClust = document.createElement("div");
      jgClust.id              = layerName + "Clust";
      jgClust.style.position  = "absolute";
      jgClust.style.top       = 0;
      jgClust.style.left      = 0;
      jgClust.style.width     = 100 + '%';
      jgClust.style.height    = 100 + '%';
      jgClust.style.opacity   = opacity/100; // for W3C browsers
      jgClust.style.filter    = "alpha(opacity="+opacity+")"; // only for IE
      jgClust.style.zIndex    = jg.style.zIndex + 2;

      var body  = document.getElementsByTagName("body")[0];

      var basepath = aux.getBaseURL();
      var mcursor = document.createElement("figure"); //<figure id="mouse-pointer"></figure>
      mcursor.id = "mouse-pointer";
      mcursor.style.backgroundImage = "url("+basepath + "styles/cursor-normal.png)";
      mcursor.style.position  = "absolute";
      mcursor.style.top       = 0;
      mcursor.style.left      = 0;
      mcursor.style.width     = 18 + 'px';
      mcursor.style.height    = 30 + 'px';
      mcursor.style.padding   = 0;
      mcursor.style.margin    = 0;

      mcursor.style.zIndex    = aux.getNextHighestDepth() + 1;




      body.appendChild(jg);
      body.appendChild(jgHelp);
      body.appendChild(jgClust);
      jg.appendChild(mcursor);

      // set the canvas areas for drawing both mouse tracking and clustering
      vaRep.jg = new jsGraphics(jg.id);
      vaRep.jgHelper = new jsGraphics(jgHelp.id);
      vaRep.jgClust = new jsGraphics(jgClust.id);
      vaRep.mcursor = document.getElementById(mcursor.id);
    },
    /**
     * Create background layer.
     */
    setBgCanvas: function(layerName)
    {
      var opacity = 80, // background layer opacity (%)
      // set layer above the mouse tracking one
        jg = document.getElementById(layerName);

      var bg = document.createElement("div");
      bg.id                     = layerName + "Bg";
      bg.style.position         = "absolute";
      bg.style.top              = 0;
      bg.style.left             = 0;
      bg.style.width            = vaRep.page.width + 'px';
      bg.style.height           = vaRep.page.height + 'px';
      bg.style.overflow         = "hidden";
      bg.style.backgroundColor  = vaOpt.bgColor;
      bg.style.opacity          = opacity/100; // for W3C browsers
      bg.style.filter           = "alpha(opacity="+opacity+")"; // only for IE
      bg.style.zIndex           = jg.style.zIndex - 1;

      var body  = document.getElementsByTagName("body")[0];
      body.appendChild(bg);
    },
    /**
     * Draw line.
     */
    drawLine: function(ini,end)
    {
      if(vaOpt.drawAll && vaOpt.drawLine){

        /*
        vaRep.jg.setColor(vaOpt.regLn);
        vaRep.jg.drawLine(ini.x,ini.y, end.x,end.y);
        vaRep.jg.paint();

        */
        vaRep.mcursor.style.top = ini.x + "px";
        vaRep.mcursor.style.left = ini.y + "px";


      }

    },
    drawMousePointer: function(ini,end){
      vaRep.moveMousePointer(ini, end);
    },
    printMousePointer: function(x, y, w, h){
      vaRep.mcursor.style.left = x + "px";
      vaRep.mcursor.style.top = y + "px";
    },
    moveMousePointer: function(ini,end){

      var x1 = ini.x,
        y1 = ini.y,
        x2 = end.x,
        y2 = end.y;
      if(x1 > x2)
      {
        var _x2 = x2;
        var _y2 = y2;
        x2 = x1;
        y2 = y1;
        x1 = _x2;
        y1 = _y2;
      }
      var dx = x2-x1, dy = Math.abs(y2-y1),
        x = x1, y = y1,
        yIncr = (y1 > y2)? -1 : 1;

      if(dx >= dy)
      {
        var pr = dy<<1,
          pru = pr - (dx<<1),
          p = pr-dx,
          ox = x;
        while(dx > 0)
        {--dx;
          ++x;
          if(p > 0)
          {
            vaRep.printMousePointer(ox, y, x-ox, 1);
            y += yIncr;
            p += pru;
            ox = x;
          }
          else p += pr;
        }
        vaRep.printMousePointer(ox, y, x2-ox+1, 1);
      }

      else
      {
        var pr = dx<<1,
          pru = pr - (dy<<1),
          p = pr-dy,
          oy = y;
        if(y2 <= y1)
        {
          while(dy > 0)
          {--dy;
            if(p > 0)
            {
              vaRep.printMousePointer(x++, y, 1, oy-y+1);
              y += yIncr;
              p += pru;
              oy = y;
            }
            else
            {
              y += yIncr;
              p += pr;
            }
          }
          vaRep.printMousePointer(x2, y2, 1, oy-y2+1);
        }
        else
        {
          while(dy > 0)
          {--dy;
            y += yIncr;
            if(p > 0)
            {
              vaRep.printMousePointer(x++, oy, 1, y-oy);
              p += pru;
              oy = y;
            }
            else p += pr;
          }
          vaRep.printMousePointer(x2, oy, 1, y2-oy+1);
        }
      }
    },
    /**
     * Draw mouse click.
     */
    drawClick: function(x,y, isDragAndDrop)
    {
      if(!vaOpt.drawAll || !vaOpt.drawClick) {
        return;
      }
      var size;
      if (!isDragAndDrop) {
        size = 10;
        vaRep.jg.setColor(vaOpt.click);
        vaRep.jg.setStroke(5);
        if(vaOpt.drawAll && vaOpt.drawClick){
          vaRep.jg.drawLine(x-size,y-size, x,y);
          vaRep.jg.drawLine(x-size,y+size, x,y);
          vaRep.jg.drawLine(x+size,y-size, x,y);
          vaRep.jg.drawLine(x+size,y+size, x,y);
        }
        /*
         var offset = 3;
         vaRep.jg.drawLine(x-size,y-size, x-offset,y-offset);
         vaRep.jg.drawLine(x-size,y+size, x-offset,y+offset);
         vaRep.jg.drawLine(x+size,y-size, x+offset,y-offset);
         vaRep.jg.drawLine(x+size,y+size, x+offset,y+offset);
         */
        vaRep.jg.setStroke(0);
      } else {
        size = 6;
        vaRep.jg.setColor(vaOpt.dDrop);

        vaRep.jg.drawRect(x - size / 2, y - size / 2, size, size);
      }

      vaRep.jg.paint();
    },
    /**
     * Draw direction arrow in a line.
     */
    drawDirectionArrow: function(ini,end)
    {
      if(!vaOpt.drawAll || !vaOpt.drawDirectionArrow) {
        return;
      }
      var a = ini.x - end.x,
        b = ini.y - end.y,
        s = 4;
      if (a>0 && b>0) {
        vaRep.jg.drawPolyline([end.x-s,end.x,end.x+s], [end.y+s,end.y,end.y+s]);
      } else if (a<0 && b>0) {
        vaRep.jg.drawPolyline([end.x-s,end.x,end.x-s], [end.y-s,end.y,end.y+s]);
      } else if (a<0 && b<0) {
        vaRep.jg.drawPolyline([end.x-s,end.x,end.x+s], [end.y-s,end.y,end.y-s]);
      } else if (a>0 && b<0) {
        vaRep.jg.drawPolyline([end.x+s,end.x,end.x+s], [end.y-s,end.y,end.y+s]);
      }

      vaRep.jg.paint();
    },
    /**
     * Draw mouse cursor.
     */
    drawCursor: function(x,y, color)
    {
      if(!vaOpt.drawAll || !vaOpt.drawCursor) {
        return;
      }
      vaRep.jg.setColor(color);
      vaRep.jg.fillPolygon([x,x,   x+4, x+6, x+9, x+7, x+15],
        [y,y+15,y+15,y+23,y+23,y+15,y+15]);
      vaRep.jg.paint();
    },
    /**
     * Draw registration point.
     */
    drawRegistrationPoint: function(x,y)
    {
      if(!vaOpt.drawAll || !vaOpt.drawRegistrationPoint) {
        return;
      }
      vaRep.jg.setColor(vaOpt.regPt);
      vaRep.jg.fillRect(x-1, y-1, 3, 3);

      vaRep.jg.paint();
    },
    /**
     * Draw time-depending circle.
     */
    drawVariableCircle: function(x,y, size)
    {
      if(!vaOpt.drawAll || !vaOpt.drawVariableCircle) {
        return;
      }

      // use multiplier to normalize all circles: 0 < norm < 1
      var norm = aux.roundTo(size/vaRep.jMax);
      if (size * norm === 0 ) { return; }
      // limit size to 1/2 of current window width (px)
      if (size > vaData.wcurr/2) { size = Math.round(vaData.wcurr/2 * norm); }
      // draw
      vaRep.jg.setColor(vaOpt.varCir);

      vaRep.jg.drawEllipse(x - size / 2, y - size / 2, size, size);
      vaRep.jg.paint();
    },
    /**
     * Gives a visual clue when the user is not using the mouse.
     */
    drawMouseStop: function(x,y)
    {
      if (!vaOpt.realTime) { return; }

      if(!vaOpt.drawAll || !vaOpt.drawMouseStop) {
        return;
      }

      var fontSize   = 16,
        circleSize = 50;
      vaRep.jgHelper.setColor(vaOpt.varCir);
      vaRep.jgHelper.fillEllipse(x - circleSize/2, y - circleSize/2, circleSize, circleSize);
      vaRep.jgHelper.setColor("black");
      vaRep.jgHelper.setFont("sans-serif", fontSize+'px', Font.BOLD);
      // center the text in vertical
      vaRep.jgHelper.drawString("stopped...", x, y - fontSize/2);
      vaRep.jgHelper.paint();
    },
    /**
     * Draw centroid as a star.
     */
    drawCentroid: function()
    {
      if(!vaOpt.drawAll || !vaOpt.drawCentroid) {
        return;
      }
      vaRep.jg.setColor(vaOpt.cenPt);
      var xsum = aux.array.sum(xclean) / xclean.length;
      var ysum = aux.array.sum(yclean) / yclean.length;
      // the centroid is computed discarding null distances
      if (vaOpt.layoutType == "liquid") {
        xsum *= vaRep.discrepance.x;
        xsum *= vaRep.discrepance.x;
      } else if (vaOpt.layoutType == "center") {
        xsum += vaRep.discrepance.x;
        xsum += vaRep.discrepance.x;
      }

      var u = Math.round(xsum),
        v = Math.round(ysum),
        l = 20; // centroid line length
      vaRep.jg.setStroke(5);
      vaRep.jg.drawLine(u, v, u+l, v-l); // 1st quadrant
      vaRep.jg.drawLine(u, v, u-l, v-l); // 2nd quadrant
      vaRep.jg.drawLine(u, v, u-l, v+l); // 3rd quadrant
      vaRep.jg.drawLine(u, v, u+l, v+l); // 4th quadrant
      vaRep.jg.setStroke(0); // reset strokes
      vaRep.jg.paint();
    },
    /**
     * Draw cluster as a circle.
     */
    drawClusters: function(response)
    {
      if(!vaOpt.drawAll || !vaOpt.drawClusters) {
        return;
      }
      var K = JSON.parse(response);
      // again (same as in Flash) typeof K is string, so re-parse
      if (typeof K !== 'object') {
        K = JSON.parse(K);
      }
      vaRep.jgClust.setColor(vaOpt.clust);
      for (var i = 0, size = 0, numClusters = K.sizes.length; i < numClusters; ++i) {
        size = K.sizes[i];
        vaRep.jgClust.fillEllipse(K.xclusters[i] * vaRep.discrepance.x - size/2, K.yclusters[i] * vaRep.discrepance.y - size/2, size, size);
      }
      vaRep.jgClust.paint();
    },
    /**
     * Get euclidean distance from point a to point b.
     */
    distance: function(a,b)
    {
      return Math.sqrt( Math.pow(a.x - b.x,2) + Math.pow(a.y - b.y,2) );
    },
    /**
     * Auto scrolls the browser window.
     */
    checkAutoScrolling: function(x,y)
    {
      if (!vaOpt.realTime) { return; }
      // center current mouse coords on the viewport
      aux.doScroll({xpos:x, ypos:y, width:vaRep.viewport.width, height:vaRep.viewport.height});
    },
    /**
     * (va)2 realtime drawing algorithm.
     */
    playMouse: function()
    {
      if (vaRep.paused) { return; }

      // mouse coords normalization
      var iniMouse = {
        x: user.xcoords[vaRep.i] * vaRep.discrepance.x,
        y: user.ycoords[vaRep.i] * vaRep.discrepance.y
      };
      var endMouse = {
        x: user.xcoords[vaRep.i+1] * vaRep.discrepance.x,
        y: user.ycoords[vaRep.i+1] * vaRep.discrepance.y
      };

      var currClickType = user.clicks[vaRep.i];
      var nextClickType = user.clicks[vaRep.i+1];
      var currClickX = currClickType > 0 ? user.xcoords[vaRep.i]   : 0;
      var nextClickX = nextClickType > 0 ? user.xcoords[vaRep.i+1] : 0;
      var currClickY = currClickType > 0 ? user.ycoords[vaRep.i]   : 0;
      var nextClickY = nextClickType > 0 ? user.ycoords[vaRep.i+1] : 0;

      var iniClick = {
        x: currClickX * vaRep.discrepance.x,
        y: currClickY * vaRep.discrepance.y
      };
      var endClick = {
        x: nextClickX * vaRep.discrepance.x,
        y: nextClickY * vaRep.discrepance.y
      };

      // draw entry point
      if (vaRep.i === 0) {
        vaRep.drawCursor(iniMouse.x,iniMouse.y, vaOpt.entryPt);
      }

      // main loop to draw mouse trail
      if (vaRep.i < user.xcoords.length)
      {
        var mouseDistance = vaRep.distance(iniMouse,endMouse);
        // draw registration points
        if (mouseDistance) {
          // there is mouse movement
          if (!vaOpt.dirVect) {
            // show static squares
            vaRep.drawRegistrationPoint(iniMouse.x,iniMouse.y);
          } else {
            // show direction pseudo-arrows
            vaRep.drawDirectionArrow(iniMouse,endMouse);
          }
          // variable circles
          if (vaRep.j > 1) {
            vaRep.drawVariableCircle(iniMouse.x, iniMouse.y, vaRep.j);
            vaRep.jgHelper.clear();
          }
          // reset variable circles size
          vaRep.j = 1;
        } else {
          // mouse stop: store variable size (circles)
          ++vaRep.j;
          vaRep.drawMouseStop(iniMouse.x, iniMouse.y);
        }
        // draw lines
        vaRep.drawLine(iniMouse,endMouse);
        vaRep.drawMousePointer(iniMouse,endMouse);
        // draw clicks
        if (iniClick.x) {
          var clickDistance = vaRep.distance(iniClick,endClick);
          if (!clickDistance) {
            // is a single click
            vaRep.drawClick(endClick.x,endClick.y, false);
          } else if (endClick.x !== 0) {
            // is drag and drop
            vaRep.drawClick(iniClick.x,iniClick.y, true);
          }
        }
        // update mouse coordinates
        ++vaRep.i;
        // check auto scrolling
        vaRep.checkAutoScrolling(endMouse.x, endMouse.y);
      }

      // draw exit point
      else {
        // rewind count 1 step to access the last mouse coordinate
        --vaRep.i;
        iniMouse.x = user.xcoords[vaRep.i] * vaRep.discrepance.x;
        iniMouse.y = user.ycoords[vaRep.i] * vaRep.discrepance.y;
        // draw exit point
        vaRep.drawCursor(iniMouse.x,iniMouse.y, vaOpt.exitPt);
        // draw clusters
        var data  = "xhr=1";
        data += "&xdata=" + JSON.stringify(user.xcoords);
        data += "&ydata=" + JSON.stringify(user.ycoords);

        var basepath = aux.getBaseURL();
        // send request
        /*aux.sendAjaxRequest({
          url:       basepath + "includes/kmeans.php",
          postdata:  data,
          callback:  vaRep.drawClusters
        });*/

        // draw centroid (average mouse position)
        vaRep.drawCentroid();
        // clear mouse tracking
        clearInterval(vaRep.play);
        vaRep.play = null;
        vaRep.jgHelper.clear();

        //loop through the logs of a session according to page visit
        if(vaOpt.totalLogs > 1 && vaOpt.logIndex < (vaOpt.totalLogs -1) ){
          var logIndex = vaOpt.logIndex + 1;
          var navUrl = vaData.trackurl + "?sid=" + vaOpt.sid + "&i=" + logIndex;
          window.location.href = navUrl;
        }


        if (numUsers == 1) {
          // load next trail
          //aux.loadNextMouseTrail(vaData);
        }


      }
    },
    /**
     * Replay method: static or dynamic.
     */
    replay: function(realtime)
    {
      if (realtime) {
        // fps are stored in vaData object, so we can use that value here
        var interval = Math.round(1000/vaData.fps);
        vaRep.play = setInterval(vaRep.playMouse, interval);
      } else {
        // static mouse tracking visualization
        for (var k = 0, total = user.xcoords.length; k <= total; ++k) {
          vaRep.playMouse();
        }
      }
    },
    /**
     * Reload method: mouse tracking layers are redrawn.
     */
    reset: function()
    {
      clearInterval(vaRep.play);
      vaRep.paused = false;
      // reset counters
      vaRep.i = 0;
      vaRep.j = 1;
      // clear canvas
      vaRep.jg.clear();
      vaRep.jgClust.clear();
    },
    /**
     * User can pause the mouse replay by pressing the SPACE key,
     * or toggle replay mode by pressing the ESC key.
     */
    helpKeys: function(e)
    {
      // use helpKeys only in realtime replaying
      if (!vaOpt.realTime) { return; }

      if (!e) { e = window.event; }
      var code = e.keyCode || e.which;
      // on press ESC key finish drawing
      if (code == 27) {
        // clear main loop
        clearInterval(vaRep.play);
        vaRep.paused = false;
        // set this flag
        vaOpt.realTime = false;
        // end drawing from the current position
        for (var k = vaRep.i, total = user.xcoords.length; k <= total; ++k) {
          vaRep.playMouse();
        }
      } else if (code == 32) {
        // on press space bar toggle drawing
        vaRep.paused = !vaRep.paused;
      }
    },
    /**
     * System initialization.
     */
    init: function()
    {
      // use vieport size to auto-scroll window
      var vp = aux.getWindowSize();
      vaRep.viewport.width = vp.width;
      vaRep.viewport.height = vp.height;
      // normalize data
      var doc = aux.getPageSize();
      vaRep.page.width = doc.width;
      vaRep.page.height = doc.height;
      // compute the discrepance ratio
      if (user.wprev && user.hprev) {
        vaRep.discrepance.x = aux.roundTo(doc.width / user.wprev);
        vaRep.discrepance.y = aux.roundTo(doc.height / user.hprev);
      }

      // precalculate the user stops: useful for time-depending circles and path centroid
      var stops = [];
      var size = 1;
      for (var k = 0, len = user.xcoords.length; k < len; ++k) {
        if (user.xcoords[k] == user.xcoords[k+1] && user.ycoords[k] == user.ycoords[k+1]) {
          ++size;
        } else {
          // store all user stops (time) for drawing variable circles later
          if (size > 1) { stops.push(size); }
          size = 1;
          // store clean mouse coordinates
          xclean.push(user.xcoords[k]);
          yclean.push(user.ycoords[k]);
        }
      }
      // set max size for variable circles
      vaRep.jMax = aux.array.max(stops);
      // common suffix for tracking canvas and background layers
      var vaName = "vaCanvas";
      // set the canvas layer
      vaRep.createCanvas(vaName);
      // draw the background layer
      if (vaOpt.bgLayer) { vaRep.setBgCanvas(vaName); }
      // init
      vaRep.replay(vaOpt.realTime);
    }

  };

  // do not overwrite the va2 namespace
  if (typeof window.va2 !== 'undefined') { throw("va2 namespace conflict"); }
  // else expose replay method
  window.va2 = {
    replay: function(opts) {
      // load custom vaOpt, if set
      if (typeof opts !== "undefined") { aux.overrideTrackingOptions(vaOpt, opts); }
      // replay
      aux.addEvent(document, "keyup",  vaRep.helpKeys);
      //aux.addEvent(window, "resize", vaRep.reset);
      //aux.addEvent(window, "resize", aux.reloadPage);
      aux.onDOMload(function(){
        // replay mouse track over Flash objects
        aux.allowTrackingOnFlashObjects(document);
      });
      aux.addEvent(window, "load", vaRep.init);
      //aux.onDOMload(vaRep.init);
    }
  }

})();