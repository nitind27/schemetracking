<?php 
include_once('api_connection.php');
header('Content-Type: application/json');
if($_SERVER['REQUEST_METHOD'] == "GET"){

mysqli_query($con,"set names utf8");

    $res=mysqli_query($con,"SELECT * FROM proposal_document where status = 'Active'");
    $response = mysqli_fetch_all($res,MYSQLI_ASSOC);
    
    foreach ($response as &$row) {
        if (isset($row['proposal_document_id'])) $row['proposal_document_id'] = (int)$row['proposal_document_id'];
    }
    
    echo json_encode($response);
	

}
?>

