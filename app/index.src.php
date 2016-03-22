<?php
# Debug:
error_reporting(E_ALL); 
ini_set("display_errors", 1); 

# Mysql connection
define('DBHOST', 'localhost');
define('DBNAME', '');
define('DBUSER', '');
define('DBPASS', '');

# Application
header("Access-Control-Allow-Origin: *");
include 'Requests.php';
$app = new Requests();
