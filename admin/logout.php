<?php
/**
 * Created for analytics.
 * User: suman
 * Date: 14/4/16
 * Time: 12:39 PM
 */

session_start();
session_destroy();

require '../config.php';

// delete login cookie
if (isset($_COOKIE['va-login'])) {
    // delete user cookie
    setcookie("va-login", null, time(), ABS_PATH);
}

// redirect to root dir, where user authentication will prompt
header("Location: ".ABS_PATH);