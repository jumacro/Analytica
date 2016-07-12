<?php
/**
 * Created for analytics.
 * User: suman
 * Date: 12/4/16
 * Time: 1:51 PM
 */


require_once(dirname(__FILE__) . '/../lib/PHPProxy.class.php');

$name = $_POST['name'];
$value = $_POST['value'];

$proxy = new PHPProxy(NULL);
$proxy->setPref($name, $value);