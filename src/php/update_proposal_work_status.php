<?php 
include_once('api_connection.php');
header('Content-Type: application/json');
mysqli_query($con, "SET NAMES utf8");
try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method == 'POST') {
        
        $proposal_id = isset($_POST['proposal_id']) ? trim($_POST['proposal_id']) : '';
        $work_status = isset($_POST['work_status']) ? trim($_POST['work_status']) : '';
        $reject_reason = isset($_POST['reject_reason']) ? trim($_POST['reject_reason']) : '';
        $from_cate_id = isset($_POST['from_cate_id']) ? trim($_POST['from_cate_id']) : '';
        $forward_to = isset($_POST['forward_to']) ? trim($_POST['forward_to']) : '';
        $user_id = isset($_POST['user_id']) ? trim($_POST['user_id']) : '';
        
        if ($proposal_id === '') {
            throw new Exception('Proposal ID is required for update.', 400);
        }

        // Get existing work_status_record
        $stmt_select = $con->prepare("SELECT work_status_record FROM proposal WHERE proposal_id = ?");
        $stmt_select->bind_param('i', $proposal_id);
        $stmt_select->execute();
        $stmt_select->bind_result($existing_record);
        $stmt_select->fetch();
        $stmt_select->close();

        // New work status record string with NOW() function from MySQL replaced by PHP date
        $now = date('Y-m-d H:i:s');
        // $work_status_record = $user_id . "}" . $from_cate_id . "}" . $forward_to . "}1}}" . date('Y-m-d H:i:s');
        $new_record = $user_id . "}" . $from_cate_id . "}" . $forward_to . "}" . $work_status . "}" . $reject_reason . "}" . $now;

        // Append new record with pipe separator if existing record is not empty
        if (!empty($existing_record)) {
            $updated_record = $existing_record . "|" . $new_record;
        } else {
            $updated_record = $new_record;
        }
        
        // Update query to set the concatenated work_status_record
        
            // forward_to = ?, 
            // work_status = ?,
            
            // $forward_to,
            // $work_status,
        if(trim($forward_to)) {
            $query = "UPDATE proposal SET 
                work_status_record = ?,
                updated_at = NOW() 
                WHERE proposal_id = ?";
            $stmt = $con->prepare($query);
            $stmt->bind_param(
                'si',
                $updated_record,
                $proposal_id
            );
        }
        else {
            $query = "UPDATE proposal SET 
                work_status_record = ?, 
                forward_to = ?, 
                updated_at = NOW() 
                WHERE proposal_id = ?";
            $stmt = $con->prepare($query);
            $stmt->bind_param(
                'ssi',
                $updated_record,
                $forward_to,
                $proposal_id
            );
        }
        
        if ($stmt->execute()) {
            $message = "Proposal " . (
                $work_status == 2 ? 'verified' :
                ($work_status == 3 ? 'rejected' : 'forwarded')
            ) . " successfully.";
            echo json_encode([
                'error' => false,
                'message' => $message,
                'proposal_id' => $proposal_id,
            ]);
        } else {
            throw new Exception('Update failed: ' . $stmt->error, 500);
        }
        $stmt->close();
    }
} catch (Exception $e) {
    echo json_encode([
        'error' => true,
        'code' => $e->getCode(),
        'message' => $e->getMessage()
    ]);
}
?>
