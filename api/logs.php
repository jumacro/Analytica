<?php
/**
 * Created by PhpStorm.
 * User: suman
 * Date: 7/6/2016
 * Time: 10:52 AM
 */

require_once '../config.php';

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

$page = !empty($_GET['page']) ? (int) $_GET['page'] : 1;

if(!isset($_SESSION['groupby'])) $_SESSION['groupby'] = 'session_id';


$defaultNumRecords = 20;


// $show is set on index.php
if (!isset($show)) {
    // check defaults from DB or current sesion
    $show = (isset($_SESSION['limit'])) ? $_SESSION['limit'] : db_option(TBL_PREFIX.TBL_CMS, "recordsPerTable");
    // sanitize (retrieve default value from settings.php)
    if (!$show) { $show = $defaultNumRecords; }
}

// set query limits
$start = $page * $show - $show;
$limit = "$start,$show";



// query priority: filtered or default
$where = (!empty($_SESSION['filterquery'])) ? $_SESSION['filterquery'] : "1"; // will group by log id

$records = db_select_all(TBL_PREFIX.TBL_RECORDS, "*", $where." GROUP BY ".$_SESSION['groupby']." ORDER BY id DESC, client_id, domain_id LIMIT $limit");

$items = [];
// if there are no more records, display message
if (!empty($records))
{
    if (check_systemversion("php", "5.2.0")) {
        $usePrettyDate = true;
        require_once SYS_DIR.'prettyDate.php';
    }


    foreach ($records as $i => $r)
    {
        // wait for very recent visits
        $timeDiff = time() - strtotime($r['sess_date']);

        $receivingData = ($timeDiff > 0 && $timeDiff < 30);
        $safeToDelete = ($timeDiff > 3600);
        // delete logs with no mouse data
        if ( $safeToDelete && !count(array_sanitize(explode(",", $r['coords_x']))) ) {
            db_delete(TBL_PREFIX.TBL_RECORDS, "id='".$r['id']."' LIMIT 1");
            continue;
        }
        

        if (!empty($_SESSION['groupby']))
        {
            $browser = null;
            $ftu = null;
            switch ($_SESSION['groupby'])
            {
                case 'cache_id':
                    $pageId = $r['cache_id'];
                    $pages = db_select(TBL_PREFIX.TBL_RECORDS, "count(*) as num", "cache_id='".$pageId."'");
                    $GROUPED = "(" . $pages['num'] . " logs)";
                    $locationId = $GROUPED;
                    $displayId = 'pid='.$r['cache_id'];
                    $clientId = $GROUPED;
                    // check if cached page exists
                    $cache = db_select(TBL_PREFIX.TBL_CACHE, "file", "id='".$pageId."'");
                    if (!is_file(CACHE_DIR.$cache['file'])) { continue; }
                    break;

                case 'client_id':
                    $pages = db_select(TBL_PREFIX.TBL_RECORDS, "count(*) as num", "client_id='".$r['client_id']."'");
                    $GROUPED = "(" . $pages['num'] . " logs)";
                    $locationId = $GROUPED;
                    $displayId = 'cid='.$r['client_id'];
                    $pageId = $GROUPED;
                    $clientId = mask_client($r['client_id']);
                    break;
                case 'session_id':
                    $pages = db_select(TBL_PREFIX.TBL_RECORDS, "count(*) as num", "session_id='".$r['session_id']."'");
                    $GROUPED = "(" . $pages['num'] . " logs)";
                    $locationId = $GROUPED;
                    $displayId = 'sid='.$r['session_id'];
                    $pageId = $GROUPED;
                    $clientId = $r['session_id'];

                    break;

                case 'ip':
                    $pages = db_select(TBL_PREFIX.TBL_RECORDS, "count(*) as num", "ip='".$r['ip']."'");
                    $GROUPED = "(" . $pages['num'] . " logs)";
                    $locationId = mask_client(md5($r['ip']));
                    $displayId = 'lid='.base64_encode($r['ip']);
                    $pageId = $GROUPED;
                    $clientId = $GROUPED;
                    // check if IP exists
                    if (empty($r['ip'])) { continue; }
                    break;

                default:
                    break;
            }

            $displayDate     = $GROUPED;
            $browsingTime    = $GROUPED;
            $interactionTime = $GROUPED;
            $numClicks       = $GROUPED;

            $numNotes        = $GROUPED;

        } else {
            $browser = new Browser();
            $browser->setUserAgent($r['user_agent']);
            // display a start on first time visitors
            $ftu = ($r['ftu']) ? ' class="ftu"' : null;
            $abbrDate = date('Y/m/d', strtotime($r['sess_date']));
            // use pretty date?
            $displayDate = ($usePrettyDate) ?
                '<abbr title="'.prettyDate::getStringResolved($r['sess_date']).'">'.$abbrDate.'</abbr>' : $abbrDate;
            $browsingTime = $r['sess_time'];
            //$locationId = mask_client(md5($r['ip']));
            $lang = $browser->getLanguage();
            if ($lang != $browser::LANGUAGE_UNKNOWN) {
                $locationId = '<img src="styles/blank.gif" class="flag flag-'.$lang.'" alt="'.$lang.'" title="'.$lang.'" />';
            } else {
                $locationId = "?";
            }
            $displayId = 'id='.$r['id'];
            $pageId = $r['cache_id'];
            $clientId = mask_client($r['client_id']);

            $interactionTime = round(count(explode(",", $r['coords_x']))/$r['fps'], 2);
            $numClicks = count_clicks($r['clicks']);
            $notes = db_select(TBL_PREFIX.TBL_HYPERNOTES, "count(*) as num", "record_id='".$r['id']."'");
            $numNotes = $notes['num'] > 0 ? '<a href="./hypernotes/list.php?id='.$r['id'].'">'.$notes['num'].'</a>' : $notes['num'];
        }

        $cache = db_select(TBL_PREFIX.TBL_CACHE, "url", "id='".$pageId."'");
        $domain = url_get_domain($cache['url']);

        $replayUrl =  TRACKING_SERVER . "admin/ext/logs/track.php?".$displayId;
        $deleteUrl =  TRACKING_SERVER . "admin/ext/logs/delete.php?".$displayId;

        $item = [
            "ftu" => $ftu,
            "clientId" => $clientId,
            "locationId" => $locationId,
            "pageId" => $pageId,
            "domain" => $domain,
            "domain_id" => $r['domain_id'],
            "cache" => $cache,
            "recordData" => $r,
            "displayDate" => $displayDate,
            "interactionTime" => $interactionTime,
            "numClicks" => $numClicks,
            "numNotes" => $numNotes,
            "replayUrl" => $replayUrl,
            "deleteUrl" => $deleteUrl,
        ];

        $items[] = $item;
    }
}


header('Content-Type: application/json');
echo json_encode(array('rows' => $items));