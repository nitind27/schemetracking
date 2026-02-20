<?php 
include_once('api_connection.php');
header('Content-Type: application/json');
if($_SERVER['REQUEST_METHOD'] == "GET"){

mysqli_query($con,"set names utf8");

    // $res=mysqli_query($con,"SELECT * FROM `user_category` WHERE is_3_2_dropdown = '1' and status = 'Active' ORDER BY category_name DESC");
    $res=mysqli_query($con,"SELECT * FROM `user_category` WHERE user_category_id = '24' and status = 'Active' ORDER BY category_name DESC");
    $response = mysqli_fetch_all($res,MYSQLI_ASSOC);
    
    foreach ($response as &$row) {
        if (isset($row['user_category_id'])) $row['user_category_id'] = (int)$row['user_category_id'];
    }
    
    echo json_encode($response);
	

}
?>