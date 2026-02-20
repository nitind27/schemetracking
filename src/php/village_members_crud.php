<?php 
include_once('api_connection.php');
header('Content-Type: application/json');
mysqli_query($con, "SET NAMES utf8mb4");
try {
    $method = $_SERVER['REQUEST_METHOD'];
    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    if ($method == 'GET') {
        // Fetch all active members
        $sql = "SELECT * FROM sabhasad WHERE status = 'Active' ORDER BY id DESC";
        $res = mysqli_query($con, $sql);
        $response = mysqli_fetch_all($res, MYSQLI_ASSOC);
        foreach ($response as &$row) {
            $row['id'] = (int)$row['id'];
            // $row['village_detail_id'] = (int)$row['village_detail_id'];
            $row['user_id'] = (int)$row['user_id'];
        }
        echo json_encode($response);
        exit;
    } 
    elseif ($method == 'POST') {
        $action = isset($_POST['action']) ? trim($_POST['action']) : '';
        $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
        $village_id = isset($_POST['village_id']) ? (int)$_POST['village_id'] : 0;
        $name = isset($_POST['name']) ? trim($_POST['name']) : '';
        $Position = isset($_POST['Position']) ? trim($_POST['Position']) : '';
        $contact_number = isset($_POST['contact_number']) ? trim($_POST['contact_number']) : '';
        $user_id = isset($_POST['user_id']) ? trim($_POST['user_id']) : '';
        $photo_basename = '';
    
        // Folder where photos will be saved
        $photo_dir = 'village_member_profile/';
    
        // Helper function to upload photo without renaming
        function upload_photo($file, $photo_dir) {
            if ($file && isset($file['name']) && $file['name'] !== '') {
                $basename = basename($file['name']); // Use original filename as is
                $upload_path = $photo_dir . $basename;
                if (!is_dir($photo_dir)) {
                    mkdir($photo_dir, 0777, true);
                }
                if (move_uploaded_file($file['tmp_name'], $upload_path)) {
                    return $basename;
                }
            }
            return '';
        }
    
        if ($action === '1') {
            $sql = "SELECT * FROM sabhasad WHERE village_id = '$village_id' and status = 'Active' ORDER BY id DESC";
            $res = mysqli_query($con, $sql);
            $response = mysqli_fetch_all($res, MYSQLI_ASSOC);
            foreach ($response as &$row) {
                $row['id'] = (int)$row['id'];
                $row['user_id'] = (int)$row['user_id'];
            }
            echo json_encode($response);
            exit;
        }
        elseif ($action === '2') {
            // INSERT
            if (isset($_FILES['photo'])) {
                $photo_basename = upload_photo($_FILES['photo'], $photo_dir);
            }
            $query = "INSERT INTO sabhasad 
                (village_id, name, Position, contact_number, user_id, photo)
                VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $con->prepare($query);
            if (!$stmt) throw new Exception($con->error, 500);
            $stmt->bind_param('ssssss', $village_id, $name, $Position, $contact_number, $user_id, $photo_basename);
            if ($stmt->execute()) {
                echo json_encode(['error'=>false,'message'=>'Member details submitted successfully.','id'=>$stmt->insert_id]);
            } else {
                throw new Exception($stmt->error, 500);
            }
            $stmt->close();
            exit;
        }
        elseif ($action === '3') {
            // UPDATE
            if (!$id) throw new Exception('id required for update', 400);
    
            // Get existing photo from DB
            $stmt_old = $con->prepare("SELECT photo FROM sabhasad WHERE id=?");
            $stmt_old->bind_param('i', $id);
            $stmt_old->execute();
            $stmt_old->bind_result($old_photo);
            $stmt_old->fetch();
            $stmt_old->close();
    
            // Check if new photo is uploaded
            if (isset($_FILES['photo'])) {
                $new_photo_basename = upload_photo($_FILES['photo'], $photo_dir);
    
                // Only update if new photo is different
                if ($new_photo_basename && $new_photo_basename !== $old_photo) {
                    // Delete old photo if exists
                    if ($old_photo && file_exists($photo_dir . $old_photo)) {
                        unlink($photo_dir . $old_photo);
                    }
                    $photo_basename = $new_photo_basename;
                } else {
                    $photo_basename = $old_photo;
                }
            } else {
                // No new photo, keep old photo
                $photo_basename = $old_photo;
            }
    
            $query = "UPDATE sabhasad 
                SET village_id=?, name=?, Position=?, contact_number=?, user_id=?, photo=?
                WHERE id=?";
            $stmt = $con->prepare($query);
            $stmt->bind_param('ssssisi', $village_id, $name, $Position, $contact_number, $user_id, $photo_basename, $id);
            if ($stmt->execute()) {
                echo json_encode(['error'=>false,'message'=>'Member details updated successfully.','id'=>$id]);
            } else {
                throw new Exception($stmt->error, 500);
            }
            $stmt->close();
            exit;
        }
    }
    elseif ($method == 'DELETE') {
        // Parse input
        parse_str(file_get_contents('php://input'), $vars);
        $id = isset($vars['id']) ? (int)$vars['id'] : 0;
        if(!$id) throw new Exception('id required for delete', 400);

        // Find for existence
        $stmt = $con->prepare("SELECT id FROM sabhasad WHERE id=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $stmt->store_result();
        if ($stmt->num_rows == 0) {
            $stmt->close();
            throw new Exception('Not found', 404);
        }
        $stmt->close();

        // Mark as deleted (soft delete) or actually delete (hard)
        $stmt2 = $con->prepare("DELETE FROM sabhasad WHERE id=?");
        $stmt2->bind_param("i", $id);
        if ($stmt2->execute()) {
            echo json_encode(['error'=>false,'message'=>'Member details deleted successfully.']);
        } else {
            throw new Exception($stmt2->error, 500);
        }
        $stmt2->close();
        exit;
    } 
    else {
        throw new Exception("Unsupported HTTP method: $method", 405);
    }
} catch (Exception $e) {
    echo json_encode([
        'error' => true,
        'code' => $e->getCode(),
        'message' => $e->getMessage()
    ]);
}
?>
