<?php
/**
 * Created for analytics.
 * User: suman
 * Date: 12/4/16
 * Time: 1:34 PM
 */
require_once '../config.php';
// check data first (exclude registered users)
if (empty($_POST) || isset($_COOKIE['va-usr'])) die(":(");

require_once '../includes/cors.php';


if (isset($HTTP_RAW_POST_DATA)) {
    $data = explode('&', $HTTP_RAW_POST_DATA);
    foreach ($data as $val) {
        if (!empty($val)) {
            list($key, $value) = explode('=', $val);
            $_POST[$key] = urldecode($value);
        }
    }
}

require_once 'functions.php';

if (isset($_POST['compressed']) && $_POST['compressed']) {
    require_once 'libs/LZW.php';
    $_POST['xcoords'] = LZW::decompress($_POST['xcoords']);
    $_POST['ycoords'] = LZW::decompress($_POST['ycoords']);
    $_POST['clicks']  = LZW::decompress($_POST['clicks']);
    $_POST['elhovered'] = LZW::decompress($_POST['elhovered']);
    $_POST['elclicked'] = LZW::decompress($_POST['elclicked']);
}

/*
// add client id to POST data (the local server has the user cookies)
$_POST['client'] = get_client_id();
*/

$file = ($_POST['action'] == "store") ? "store.php" : "append.php";



if (!empty($_POST['remote']) && $_POST['remote'] != "null")
{
    // forward request to va server
    $request = get_remote_webpage(
        $_POST['remote'].'/api/'.$file,
        array(
            CURLOPT_COOKIE => $_POST['cookies'],
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $_POST
        )
    );
    // at this point the remote server should return the DB log id
    echo $request['content'];
}
else
{
    //require_once '../config.php';
    require_once $file;
}