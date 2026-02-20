<?php 
include_once('api_connection.php');
header('Content-Type: application/json');
if($_SERVER['REQUEST_METHOD'] == "GET"){

mysqli_query($con,"set names utf8");

   $response = array(
       'अध्यक्ष',
       'सचिव',
       'खजिनदार',
       'सदस्य'
    );
    
    echo json_encode($response);
	

}
?>