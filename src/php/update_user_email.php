<?php 
include_once('api_connection.php');
header('Content-Type: application/json');
mysqli_query($con, "SET NAMES utf8");

try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method == 'POST') {
        
        $user_id = isset($_POST['user_id']) ? trim($_POST['user_id']) : '';
        $email = isset($_POST['email']) ? trim($_POST['email']) : '';
        
        if (empty($user_id) || empty($email)) {
            throw new Exception('All fields are required', 400);
        }

        $query = "UPDATE users SET 
                  email = ?,
                  updated_at = NOW()
                  WHERE user_id = ?";

        $stmt = $con->prepare($query);
        if (!$stmt) {
            throw new Exception('Prepare failed: ' . $con->error, 500);
        }
        $stmt->bind_param('si', $email,$user_id);
        
        if ($stmt->execute()) {
            echo json_encode([
                'error' => false,
                'code' => 200,
                'message' => "Email submitted successfully"
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
