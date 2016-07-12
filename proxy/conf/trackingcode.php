<?php
/**
 * Created for analytics.
 * User: suman
 * Date: 12/4/16
 * Time: 1:52 PM
 */

if (!session_id()) session_start();
// This is the tracking code that will be inserted on proxied pages
$vacode  = '//<![CDATA['                                                  . PHP_EOL;
$vacode .= ' if (va) {'                                                 . PHP_EOL;
$vacode .= '  va.record({'                                              . PHP_EOL;
$vacode .= '   trackingServer: "' . $_SESSION["va-trackingServer"] . '",'. PHP_EOL;
$vacode .= '   recTime:'          . $_SESSION["va-recTime"]        .  ','. PHP_EOL;
$vacode .= '   fps:'              . $_SESSION["va-fps"]            .  ','. PHP_EOL;
$vacode .= '   postInterval:'     . $_SESSION["va-postInterval"]   .  ','. PHP_EOL;
$vacode .= '   cookieDays:'       . $_SESSION["va-cookieDays"]     .  ','. PHP_EOL;
$vacode .= '   layoutType: "'     . $_SESSION["va-layoutType"]     . '",'. PHP_EOL;
$vacode .= '   contRecording:'    . $_SESSION["va-contRecording"]  .  ','. PHP_EOL;
$vacode .= '   warn:'             . $_SESSION["va-warn"]           .  ','. PHP_EOL;
$vacode .= '   disabled:'         . $_SESSION["va-disabled"]             . PHP_EOL;
$vacode .= '  });'                                                        . PHP_EOL;
$vacode .= ' }'                                                           . PHP_EOL;
$vacode .= '//]]>'                                                        . PHP_EOL;