<?php 
include_once('api_connection.php');
header('Content-Type: application/json');

if($_SERVER['REQUEST_METHOD'] == "POST"){
    mysqli_query($con,"set names utf8");
    $forward_to = isset($_POST['forward_to']) ? trim($_POST['forward_to']) : '';

    // No condition on p.forward_to
    $sql = "SELECT 
                p.*, 
                c.name AS proposal_category_name, 
                t.name AS taluka_name, 
                g.gpname AS gp_name, 
                v.marathi_name AS village_name
            FROM proposal p
            LEFT JOIN proposal_category c ON p.proposal_category_id = c.proposal_category_id
            LEFT JOIN taluka t ON p.taluka_id = t.taluka_id
            LEFT JOIN grampanchyat g ON p.gp_id = g.gp_id
            LEFT JOIN village v ON p.village_id = v.village_id
            WHERE p.status = 'Active'";
    $res = mysqli_query($con, $sql);
    $response = mysqli_fetch_all($res, MYSQLI_ASSOC);

    // Filter proposals matching forward_to within work_status_record
    $filtered = [];
    foreach ($response as &$row) {
        $found = false;
        $records = explode('|', $row['work_status_record']);
        // $records = array_reverse($records);
        $totalRecords = count($records);
        // for ($i=0; $i<$totalRecords; $i++) {
        //     // Example format: 469}0}}24}2025-09-12 05:37:14
        //     $record = $records[$i];
        //     $parts = explode('}', $record);
        //     if (isset($parts[2]) && trim($parts[2]) == $forward_to) {
        //         if($totalRecords > ($i+1)) {
        //             $record2 = $records[$i+1];
        //             $parts2 = explode('}', $record2);
        //             if (isset($parts2[1]) && trim($parts2[1]) == $forward_to && isset($parts2[3]) && trim($parts2[3]) == '2') {
        //                 $found = true;
        //                 break;
        //             }
        //         }
        //         else {
        //             $found = true;
        //             break;
        //         }
        //     }
        // }
        
        $lastIndex = -1; // agar nahi mila to -1
        foreach ($records as $index => $record) {
            $parts = explode("}", $record);
        
            // check if 2nd index exist & equal "24"
            if (isset($parts[2]) && $parts[2] == $forward_to) {
                $lastIndex = $index;
            }
        }
        
        // echo $lastIndex;
        
        if($lastIndex >= 0) {
            $record = $records[$lastIndex];
            $parts = explode('}', $record);
            if (isset($parts[2]) && trim($parts[2]) == $forward_to) {
                if($totalRecords > ($lastIndex+1)) {
                    $record2 = $records[$lastIndex+1];
                    $parts2 = explode('}', $record2);
                    if (isset($parts2[1]) && trim($parts2[1]) == $forward_to && isset($parts2[3]) && (trim($parts2[3]) == '1' || trim($parts2[3]) == '2')) {
                        $found = true;
                    }
                }
                else {
                    $found = true;
                }
            }
        }
        if ($found) {
            if (isset($row['proposal_id'])) $row['proposal_id'] = (int)$row['proposal_id'];
            if (isset($row['proposal_category_id'])) $row['proposal_category_id'] = (int)$row['proposal_category_id'];
            if (isset($row['taluka_id'])) $row['taluka_id'] = (int)$row['taluka_id'];
            if (isset($row['gp_id'])) $row['gp_id'] = (int)$row['gp_id'];
            if (isset($row['village_id'])) $row['village_id'] = (int)$row['village_id'];
            if (isset($row['user_id'])) $row['user_id'] = (int)$row['user_id'];
            $filtered[] = $row;
        }
    }
    echo json_encode($filtered);
}

?>