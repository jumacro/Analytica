<?php
/**
 * Created for analytics.
 * User: suman
 * Date: 12/4/16
 * Time: 6:16 PM
 */

$_lookupTables = array(TBL_RECORDS,TBL_CACHE,TBL_BROWSERS,TBL_OS,TBL_USERS,TBL_ROLES,TBL_EXTS,TBL_CMS,TBL_JSOPT);


function db_connect()
{
    //$idcnx = mysql_connect(DB_HOST, DB_USER, DB_PASSWORD) or trigger_error( mysql_error() );
    //mysql_select_db(DB_NAME, $idcnx) or trigger_error( mysql_error() );

    $DB_CONN = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);

    // Check connection
    if ($DB_CONN->connect_error) {
        die("Connection failed: " . $DB_CONN->connect_error);
    }

    $DB_CONN->query("set global sql_mode='STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY‌​_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';");
    $DB_CONN->query("set session sql_mode='STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';");
    return $DB_CONN;
}


function db_query($sql)
{
    $DB_CONN = db_connect();
    $result = $DB_CONN->query($sql);

    if($result === TRUE){
        if(!empty($DB_CONN->insert_id) && !is_object($result))
            return $DB_CONN->insert_id;
        else if(!empty($DB_CONN->affected_rows) && !is_object($result))
            return $DB_CONN->affected_rows;
        else return $result;
    }


    return $result;
}


function db_select($table, $column, $condition)
{
    $sql = "SELECT $column FROM $table WHERE $condition";
    $result = db_query($sql);

    if($result == false){
        return false;
    }

    if ($result->num_rows == 1) {
        return $result->fetch_assoc();

    }
    if ($result->num_rows > 0) {
        $opt = array();
        while ($row = $result->fetch_assoc()) {
            $opt[] = $row;

        }
        $result->close();

        return $opt;
    }

    return false;
}


function db_select_all($table, $column, $condition)
{
    $sql = "SELECT $column FROM $table WHERE $condition";

    $result = db_query($sql);
    if(is_bool($result)){
        return false;
    }

    // get ALL rows
    $opt = array();
    while ($row = $result->fetch_assoc()) {
        $opt[] = $row;
    }
    $result->close();
    return $opt;
}


function db_delete($table, $condition)
{
    $sql = "DELETE FROM $table WHERE $condition";
    $res = db_query($sql);

    return $res;
}


function db_insert($table, $fields, $values)
{
    $sql = "INSERT INTO $table ($fields) VALUES ($values)";

    $DB_CONN = db_connect();
    if($DB_CONN->query($sql, MYSQLI_STORE_RESULT) === TRUE){
        return $DB_CONN->insert_id;
    }

    if($DB_CONN->error){
        printf("Error - %s.\n %s \n", $DB_CONN->error, $sql);die;
    }


    return false;
}


function db_update($table, $tuples, $condition)
{
    $sql = "UPDATE $table SET $tuples WHERE $condition";
    $res = db_query($sql);

    return $res;
}


function db_check()
{
    global $_lookupTables;

    foreach ($_lookupTables as $table) {
        $res = db_query("SHOW TABLES LIKE '".TBL_PREFIX.$table."'");
        if ($res->num_rows > 0) {
            return true;
        }
    }

    return false;
}


function db_records($getColNames = false)
{
    $n = ($getColNames) ? "*" : "id";
    $res = db_query("SELECT $n FROM ".TBL_PREFIX.TBL_RECORDS);

    if ($getColNames) {
        while ($meta = $res->fetch_fields()) {
            $headers[] = $meta->name;
        }
        return $headers;
    } else {
        return $res->num_rows;
    }
}


function db_option($table, $optionName)
{

    $row = db_select($table, "value", "name='".$optionName."'");

    if(empty($row)) return false;
    return isset($row[0])?$row[0]['value']:$row['value'];
}

function db_version(){
    $DB_CONN = db_connect();
    return $DB_CONN->server_version;
}