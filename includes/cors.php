<?php
/**
 * Created by PhpStorm.
 * User: suman
 * Date: 7/6/2016
 * Time: 10:53 AM
 */

// raw cross-domain POSTs work (only for fairly modern browsers)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: OPTIONS, POST');
header('Access-Control-Allow-Headers: X-Requested-With');
header('Access-Control-Max-Age: 86400');
if (strtolower($_SERVER['REQUEST_METHOD']) == 'options') exit;