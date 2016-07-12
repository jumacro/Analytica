<?php
/**
 * Created for analytics.
 * User: suman
 * Date: 12/4/16
 * Time: 1:43 PM
 */

// check data first (exclude registered users)
if (empty($_POST) || isset($_COOKIE['va-usr'])) die(":(");

require_once '../config.php';

$URL = $_POST['url'];

// check proxy requests
$pattern = "proxy/index.php?url=";
if (strpos($URL, $pattern)) {
    list($remove, $URL) = explode($pattern, $URL);
    $URL = base64_decode($URL);
}

$session_id = isset($_POST['sess_id'])? intval($_POST['sess_id']):0;

if(empty($_POST['layout'])){
    $_POST['layout'] = 'liquid';
}

// get remote webpage
$request = get_remote_webpage(
    $URL,
    array( CURLOPT_COOKIE => $_POST['cookies'] )
);

$webpage = utf8_encode($request['content']);

// check request status
if ($request['errnum'] != CURLE_OK || $request['http_code'] != 200)
{
    $webpage = error_webpage('<h1>Could not fetch page</h1><pre>'.print_r($request, true).'</pre>');
    $parse = true;
}
else
{
    $cachedays = db_option(TBL_PREFIX.TBL_CMS, "cacheDays");
    // is cache enabled?
    if ($cachedays > 0)
    {
        // get the most recent version saved of this page
        $cachelog = db_select(TBL_PREFIX.TBL_CACHE, "id,UNIX_TIMESTAMP(saved) as savetime", "url='".$URL."' AND session_id='".$session_id."' ORDER BY id DESC");
        // check if url exists on cache, and if it should be stored (again) on cache
        if ($cachelog && (time() - $cachelog['savetime'] < $cachedays * 86400)) {
            // get HTML log id
            $cache_id = $cachelog['id'];
            $parse = false;
        } else {
            // cache days expired
            $parse = true;
        }
    } else {
        // cache is disabled
        $parse = true;
    }
}

/* parse webpage ---------------------------------------------------------- */
if ($parse)
{
    // use the DOM to parse webpage contents
    $dom = new DOMDocument();
    $dom->formatOutput = true;
    $dom->preserveWhiteSpace = false;
    // hide warnings when parsing non valid (X)HTML pages
    @$dom->loadHTML($webpage);
    remove_va_scripts($dom);
    // set HTML log name
    $date = date("Ymd-His");
    $ext = ".html";
    // "March 10th 2006 @ 15h 16m 08s" should create the log file "20060310-151608.html"
    $htmlfile = (!is_file(CACHE_DIR.$date.$ext)) ? $date.$ext : $date.'-'.mt_rand().$ext;
    // store (UTF-8 encoded) log
    $dom->saveHTMLFile(CACHE_DIR.$htmlfile);
    // insert new row on TBL_CACHE and look for inserted id
    $cache_id = db_insert(TBL_PREFIX.TBL_CACHE,
        "session_id, file, url, layout, title, saved, created_at",
        "'".$session_id."', '".$htmlfile."', '".$URL."', '".$_POST['layout']."','".$_POST['urltitle']."', NOW(), NOW()");
}


    $xcoords = 0;
if(!empty($_POST['xcoords'])){
    $xcoords = $_POST['xcoords'];
}
$ycoords = 0;
if(!empty($_POST['ycoords'])){
    $ycoords = $_POST['ycoords'];
}
$clicks = 0;
if(!empty($_POST['clicks'])){
    $clicks = $_POST['clicks'];
}
$elhovered = 0;
if(!empty($_POST['elhovered'])){
    $elhovered = $_POST['elhovered'];
}
$elclicked = 0;
if(!empty($_POST['elclicked'])){
    $elclicked = $_POST['elclicked'];
}

$findRecord = db_select(TBL_PREFIX.TBL_RECORDS, "*",  "id = '".$_POST['uid']."'");


$user_id = isset($_POST['user_id'])? intval($_POST['user_id']):0;

$values  = "sess_time = '". (float) $_POST['time']   ."',";

if (isset($user_id)){
    $values .= "user_id = '". $user_id ."',";
}

if (isset($session_id)){
    $values .= "session_id = '". $session_id ."',";
}

$values .= "vp_width  = '". (int)   $_POST['pagew']  ."',";
$values .= "vp_height = '". (int)   $_POST['pageh']  ."',";

if(!empty($findRecord['coords_x'])){
    $values .= "coords_x  = CONCAT(COALESCE(coords_x, ''), ',". $xcoords ."'),";
} else {
    $values .= "coords_x  = '". $xcoords ."',";
}

if(!empty($findRecord['coords_y'])){
    $values .= "coords_y  = CONCAT(COALESCE(coords_y, ''), ',". $ycoords ."'),";
} else {
    $values .= "coords_y  = '". $ycoords ."',";
}

if(!empty($findRecord['clicks'])){
    $values .= "clicks    = CONCAT(COALESCE(clicks,   ''), ',". $clicks  ."'),";
} else {
    $values .= "clicks  = '". $clicks ."',";
}

if(!empty($findRecord['hovered'])){
    $values .= "hovered   = CONCAT(COALESCE(hovered,  ''), ',". array_sanitize($elhovered) ."'),";
} else {
    $values .= "hovered  = '". array_sanitize($elhovered) ."',";
}

if(!empty($findRecord['clicked'])){
    $values .= "clicked   = CONCAT(COALESCE(clicked,  ''), ',". array_sanitize($elclicked) ."'),";
} else {
    $values .= "clicked  = '". array_sanitize($elclicked) ."',";
}


$values .= "updated_at = '".  date("Y-m-d H:i:s") ."'";

db_update(TBL_PREFIX.TBL_RECORDS, $values, "id='".$_POST['uid']."'");
header('Content-Type: application/json');
echo json_encode(array('uid' => intval($_POST['uid']), 'session_id' => intval($session_id)));