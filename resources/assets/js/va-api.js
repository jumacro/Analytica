/**
 * Created by suman on 12/4/16.
 */


(function(){

  // Delay recording function until va2 libs are fully loaded
  var va2cache;
  window.va2 = {
    record: function(opts) {
      va2cache = function() { window.va2.record(opts); }
    }
  }

  function createScript(filepath) {
    var scriptElem = document.createElement('script');
    scriptElem.type = "text/javascript";
    scriptElem.src = filepath;
    return scriptElem;
  }

  // Grab path of currently executing script
  var scripts = document.getElementsByTagName('script');
  var currentScript = scripts[scripts.length - 1];
  // Remove filename
  var pathParts = currentScript.src.split("/");
  pathParts.splice(pathParts.length - 1, 1);
  // Now we have the full script path
  var path = pathParts.join("/");
  // Load va2 libs accordingly: first aux functions, then record
  var ext = pathParts[pathParts.length - 1] == "src" ? ".js" : ".min.js";

  if(!window.jQuery) {
    var jqLib = createScript(path + "/" + "jquery-1.12.4.min.js");
    currentScript.parentNode.insertBefore(jqLib, currentScript.nextSibling);
    jqLib.onload = function() {
      console.log("jQuery loaded from api server");
      var aux = createScript(path + "/" + "va-aux" + ext);
      currentScript.parentNode.insertBefore(aux, currentScript.nextSibling);
      aux.onload = function() {
        console.log(window.va2fn);
        var record = createScript(path + "/" + "va-record" + ext);
        currentScript.parentNode.insertBefore(record, aux.nextSibling);
        record.onload = function() {
          va2cache();
          // DOM is already loaded, so make this explicit fn call
          va2.methods.init();
        }
        // Finally remove loader script
        currentScript.parentNode.removeChild(currentScript);
      }
    };


  } else{
    console.log("jQuery loaded");
    var aux = createScript(path + "/" + "va-aux" + ext);
    currentScript.parentNode.insertBefore(aux, currentScript.nextSibling);
    aux.onload = function() {
      console.log(window.va2fn);
      var record = createScript(path + "/" + "va-record" + ext);
      currentScript.parentNode.insertBefore(record, aux.nextSibling);
      record.onload = function() {
        va2cache();
        // DOM is already loaded, so make this explicit fn call
        va2.methods.init();
      }
      // Finally remove loader script
      currentScript.parentNode.removeChild(currentScript);
    }
  }



})();
