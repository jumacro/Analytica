<?php


define ('ABS_PATH', "http://myapps.com/videoanalysis/analytics/"); // always put an ending slash (/)
define ('TRACKING_SERVER', "http://myapps.com/videoanalysis/analytics/"); // always put an ending slash (/)


define ('DB_NAME',     "video_analytics_new");
define ('DB_USER',     "suman");
define ('DB_PASSWORD', "suman123");
define ('DB_HOST',     "localhost");
define ('TBL_PREFIX',  "va_");



define ('BASE_PATH', dirname(__FILE__));
define ('INC_PATH', BASE_PATH.'/admin/');
require_once BASE_PATH.'/system/functions.php';