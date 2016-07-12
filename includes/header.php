<?php
/**
 * Created for analytics.
 * User: suman
 * Date: 14/4/16
 * Time: 12:17 PM
 */

include_once INC_DIR.'doctype.php';
?>
    <head>
        <?php include_once INC_DIR.'header-base.php'; ?>
    </head>

    <body>

    <div id="header" class="foothead">
        <h1><strong>Video Analytics</strong> &middot; VA</h1>

        <p id="logged"><a href="<?=ABS_PATH?>">Logged in</a> as <strong><?=$_SESSION['login']?></strong> &mdash;
            <a id="logout" class="smallround" href="<?=ADMIN_PATH?>logout.php">Logout</a></p>

    </div><!-- end header -->

    <div id="nav">
        <ul>
            <?php
            $basedir = filename_to_str( ext_name() );
            $basecss = ($basedir == "admin") ? ' class="current"' : null;
            // display always the dashboard
            echo '<li'.$basecss.'><a href="'.ADMIN_PATH.'">Dashboard</a></li>';
            // display allowed sections
            echo ext_format();
            ?>
        </ul>
    </div><!-- end nav -->

    <div id="global">