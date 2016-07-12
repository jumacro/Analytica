<?php
/**
 * Created for analytics.
 * User: suman
 * Date: 13/4/16
 * Time: 12:05 PM
 */

function url_redirect($path = "")
{
    $url = url_get_server();

    if (empty($path)) { $path = $url; }
    // check that server url is on the $path argument
    if (strpos($path, $url) === false) { $path = $url.$path; }

    header("Location: ".$path);
    exit;
}


function url_get_server()
{
    //$protocol = "http://";
    $protocol = "http" . ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != "off") ? "s" : null) . "://";

    $host = $_SERVER['HTTP_HOST']; // reliable in virtual hosts
    if (empty($host)) {
        $host = $_SERVER['SERVER_NAME'];
    }

    return $protocol.$host;
}


function url_get_current($fullURI = false)
{
    // quick check:
    $url  = url_get_server();
    $url .= $_SERVER['SCRIPT_NAME'];
    if ($fullURI && $_SERVER['QUERY_STRING']) { $url .= '?'.$_SERVER['QUERY_STRING']; }

    return $url;
}


function url_get_base($url)
{
    // split url in dirs
    $paths = explode("/", $url);
    // short URLs like http://server.com should be fixed
    if (count($paths) > 3) {
        // remove last element, so we do not have to worry about the query string (?var1=value1&var2=value2#anchor...)
        array_pop($paths);
    }
    // and we have the BASE href
    $base = implode("/", $paths) . "/";

    return $base;
}


function url_get_domain($url)
{
    $parts = parse_url($url);

    return isset($parts['host']) ? $parts['host'] : "";
}