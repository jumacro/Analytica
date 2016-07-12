<?php
/**
 * Created for analytics.
 * User: suman
 * Date: 07/4/16
 * Time: 6:19 PM
 */


define ('VA_VERSION',  "0.0.1");



define ('CMS_TITLE',   "Video Analytics of User Session " . VA_VERSION);


define ('ADMIN_PATH',    ABS_PATH."admin/");


define ('CSS_PATH',      ADMIN_PATH."css/");


define ('SWF_PATH',      ABS_PATH."api/swf/");


$jspath = ABS_PATH."api/js/";
$jsext = ".min.js";
if (db_option(TBL_PREFIX.TBL_CMS, "enableDebugging")) {
    //$jspath .= "src/";
    $jspath = ABS_PATH."resources/assets/js/";
    $jsext = ".js";
}


define ('JS_PATH',       $jspath);

define ('VA_RECORD',    JS_PATH."va-record".$jsext);
define ('VA_REPLAY',    JS_PATH."va-replay".$jsext);

define ('VA_AUX',       JS_PATH."va-aux".$jsext);

define ('WZ_JSGRAPHICS', JS_PATH."wz_jsgraphics".$jsext);

define ('JSON_PARSER',   JS_PATH."json2".$jsext);

define ('JS_SELECTOR',   JS_PATH."selector".$jsext);

define ('SWFOBJECT',     ADMIN_PATH."js/swfobject.js");

define ('CACHE_DIR',     BASE_PATH."/cache/");

define ('SYS_DIR',       BASE_PATH."/system/");

define ('INC_DIR',       BASE_PATH."/includes/");


define ('CMS_TYPE',      0);
define ('CMS_CHOICE',    1);
define ('CMS_MULTIPLE',  2);