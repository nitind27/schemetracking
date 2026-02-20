<?php 
include_once('api_connection.php');
header('Content-Type: application/json');
if($_SERVER['REQUEST_METHOD'] == "GET"){

mysqli_query($con,"set names utf8");

    $res=mysqli_query($con,"SELECT * FROM proposal_category where status = 'Active'");
    $response = mysqli_fetch_all($res,MYSQLI_ASSOC);
    
    foreach ($response as &$row) {
        if (isset($row['proposal_category_id'])) $row['proposal_category_id'] = (int)$row['proposal_category_id'];
    }
    
    echo json_encode($response);
	

}
?>