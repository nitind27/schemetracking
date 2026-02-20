<?php 
include_once('api_connection.php');
header('Content-Type: application/json');
mysqli_query($con, "SET NAMES utf8");

try {
    $method = $_SERVER['REQUEST_METHOD'];
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    
    $pdfDir = __DIR__ . '/proposal_files/';

    if ($method == 'GET') {
        // GET API - Fetch proposals
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

        foreach ($response as &$row) {
            if (isset($row['proposal_id'])) $row['proposal_id'] = (int)$row['proposal_id'];
            if (isset($row['proposal_category_id'])) $row['proposal_category_id'] = (int)$row['proposal_category_id'];
            if (isset($row['taluka_id'])) $row['taluka_id'] = (int)$row['taluka_id'];
            if (isset($row['gp_id'])) $row['gp_id'] = (int)$row['gp_id'];
            if (isset($row['village_id'])) $row['village_id'] = (int)$row['village_id'];
            if (isset($row['user_id'])) $row['user_id'] = (int)$row['user_id'];
        }

        echo json_encode($response);
        exit;
    } 
    elseif ($method == 'POST') {
        
        $action = isset($_POST['action']) ? trim($_POST['action']) : '';
        $proposal_id = isset($_POST['proposal_id']) ? trim($_POST['proposal_id']) : '';
        $proposal_category_id = isset($_POST['proposal_category_id']) ? trim($_POST['proposal_category_id']) : '';
        $proposal_document_id = isset($_POST['proposal_document_id']) ? trim($_POST['proposal_document_id']) : '';
        $remarks = isset($_POST['remarks']) ? trim($_POST['remarks']) : '';
        $land_details = isset($_POST['land_details']) ? trim($_POST['land_details']) : '';
        $number_of_tree = isset($_POST['number_of_tree']) ? trim($_POST['number_of_tree']) : '';
        $beneficiaries = isset($_POST['beneficiaries']) ? trim($_POST['beneficiaries']) : '';
        $taluka_id = isset($_POST['taluka_id']) ? trim($_POST['taluka_id']) : '';
        $gp_id = isset($_POST['gp_id']) ? trim($_POST['gp_id']) : '';
        $village_id = isset($_POST['village_id']) ? trim($_POST['village_id']) : '';
        $from_cate_id = isset($_POST['from_cate_id']) ? trim($_POST['from_cate_id']) : '';
        $forward_to = isset($_POST['forward_to']) ? trim($_POST['forward_to']) : '';
        $work_status = isset($_POST['work_status']) ? trim($_POST['work_status']) : '';
        $user_id = isset($_POST['user_id']) ? trim($_POST['user_id']) : '';
        $work_status_record = $user_id . "}" . $from_cate_id . "}" . $forward_to . "}1}}" . date('Y-m-d H:i:s');
        
        $is_rejected = isset($_POST['is_rejected']) ? trim($_POST['is_rejected']) : '';
        
        $pdfDir = __DIR__ . '/proposal_files/';
        $docFileDir = __DIR__ . '/proposal_doc_files/';
        if (!is_dir($pdfDir)) {
            mkdir($pdfDir, 0777, true);
        }
        
        if ($action === '1') {
            $pdfOrigName = '';
            if (isset($_FILES['pdf']) && $_FILES['pdf']['error'] === UPLOAD_ERR_OK) {
                $pdfTmpPath = $_FILES['pdf']['tmp_name'];
                $pdfOrigName = basename($_FILES['pdf']['name']);
                $pdfFullPath = $pdfDir . $pdfOrigName;
                if (!move_uploaded_file($pdfTmpPath, $pdfFullPath)) {
                    throw new Exception('Failed to upload PDF file.', 500);
                }
            }
        
            $pdfOrigName2 = '';
            if (isset($_FILES['pdf2']) && $_FILES['pdf2']['error'] === UPLOAD_ERR_OK) {
                $pdfTmpPath2 = $_FILES['pdf2']['tmp_name'];
                $pdfOrigName2 = basename($_FILES['pdf2']['name']);
                $pdfFullPath2 = $pdfDir . $pdfOrigName2;
                if (!move_uploaded_file($pdfTmpPath2, $pdfFullPath2)) {
                    throw new Exception('Failed to upload PDF file.', 500);
                }
            }
            
            if (isset($_FILES['docFiles'])) {
                // Make sure directory exists
                if (!is_dir($docFileDir)) {
                    if (!mkdir($docFileDir, 0775, true)) {
                        throw new Exception('Failed to create document directory.', 500);
                    }
                }
            
                // Loop through all uploaded files
                foreach ($_FILES['docFiles']['name'] as $index => $origName) {
                    // Skip empty items (in case user selected fewer files)
                    if ($_FILES['docFiles']['error'][$index] !== UPLOAD_ERR_OK) {
                        // Optional: handle per-file error
                        continue;
                    }
            
                    $tmpPath   = $_FILES['docFiles']['tmp_name'][$index];
                    $baseName  = basename($origName);
                    $fullPath  = rtrim($docFileDir, '/\\') . DIRECTORY_SEPARATOR . $baseName;
            
                    if (!move_uploaded_file($tmpPath, $fullPath)) {  // [web:1][web:4]
                        throw new Exception('Failed to upload document file: ' . $baseName, 500);
                    }
                }
            }

        
            $query = "INSERT INTO proposal 
                (proposal_category_id, proposal_document_id, pdf, remarks, land_details, number_of_tree, beneficiaries, supporting_map_doc, taluka_id, gp_id, village_id, forward_to, work_status, work_status_record, user_id, status, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', NOW(), NOW())";
            
            // Bind all as string except integer fields if sure of types
            $stmt = $con->prepare($query);
            if (!$stmt) {
                die('Prepare failed: ' . $con->error);
            }
            $stmt->bind_param(
                'sssssssssssssss',
                $proposal_category_id,
                $proposal_document_id,
                $pdfOrigName,
                $remarks,
                $land_details,
                $number_of_tree,
                $beneficiaries,
                $pdfOrigName2,
                $taluka_id,
                $gp_id,
                $village_id,
                $forward_to,
                $work_status,
                $work_status_record,
                $user_id
            );
        
            if ($stmt->execute()) {
                echo json_encode([
                    'error' => false,
                    'message' => 'Proposal submitted successfully.',
                    'proposal_id' => $stmt->insert_id
                ]);
            } else {
                die('Submit failed: ' . $stmt->error);
            }
            $stmt->close();
            exit;
        }
        elseif ($action === '2') {
            // UPDATE API
        
            if ($proposal_id === '') {
                throw new Exception('Proposal ID is required for update.', 400);
            }
        
            // Get old PDF and supporting_map_doc filenames from database
            $getOldPdf = $con->prepare("SELECT pdf, supporting_map_doc, work_status_record, proposal_document_id FROM proposal WHERE proposal_id=?");
            $getOldPdf->bind_param('i', $proposal_id);
            $getOldPdf->execute();
            $getOldPdf->bind_result($oldPdf, $oldPdf2, $existing_record, $oldProposalDocumentId);
            $getOldPdf->fetch();
            $getOldPdf->close();
        
            $pdfFileName = $oldPdf; // Keep old PDF by default
            $pdfFileName2 = $oldPdf2; // Keep old supporting_map_doc by default
            $updated_record = $work_status_record;
            
            
            
            if ($is_rejected == "Yes" && !empty($existing_record)) {
                $updated_record = $existing_record . "|" . $work_status_record;
            }
        
            // Check if new PDF file uploaded for update
            if (isset($_FILES['pdf']) && $_FILES['pdf']['error'] === UPLOAD_ERR_OK) {
                $pdfTmpPath = $_FILES['pdf']['tmp_name'];
                $pdfNewName = basename($_FILES['pdf']['name']);
                // $pdfExt = strtolower(pathinfo($pdfNewName, PATHINFO_EXTENSION));
                // if ($pdfExt !== 'pdf') {
                //     throw new Exception('Only PDF files are allowed.', 400);
                // }
                // Delete old PDF file if exists
                if ($pdfNewName !== $oldPdf) {
                    if ($oldPdf && file_exists($pdfDir . $oldPdf)) {
                        unlink($pdfDir . $oldPdf);
                    }
                    $pdfFullPath = $pdfDir . $pdfNewName;
                    if (!move_uploaded_file($pdfTmpPath, $pdfFullPath)) {
                        throw new Exception('Failed to upload PDF file.', 500);
                    }
                    $pdfFileName = $pdfNewName;
                } else {
                    $pdfFileName = $oldPdf;
                }
            }
        
            // Check if new supporting_map_doc file uploaded for update
            if (isset($_FILES['pdf2']) && $_FILES['pdf2']['error'] === UPLOAD_ERR_OK) {
                $pdfTmpPath2 = $_FILES['pdf2']['tmp_name'];
                $pdfNewName2 = basename($_FILES['pdf2']['name']);
                // $pdfExt2 = strtolower(pathinfo($pdfNewName2, PATHINFO_EXTENSION));
                // if ($pdfExt2 !== 'pdf') {
                //     throw new Exception('Only PDF files are allowed.', 400);
                // }
                // Delete old supporting_map_doc file if exists
                if ($pdfNewName2 !== $oldPdf2) {
                    if ($oldPdf2 && file_exists($pdfDir . $oldPdf2)) {
                        unlink($pdfDir . $oldPdf2);
                    }
                    $pdfFullPath2 = $pdfDir . $pdfNewName2;
                    if (!move_uploaded_file($pdfTmpPath2, $pdfFullPath2)) {
                        throw new Exception('Failed to upload supporting_map_doc PDF file.', 500);
                    }
                    $pdfFileName2 = $pdfNewName2;
                } else {
                    $pdfFileName2 = $oldPdf2;
                }
            }
            
            
            // =========================
            //   docFiles / proposal_document_id
            // =========================
        
            // 1) OLD ko map karo: [id => filename]
            $oldFilesById = [];
            if (!empty($oldProposalDocumentId)) {
                $oldEntries = explode('|', $oldProposalDocumentId);
                foreach ($oldEntries as $entry) {
                    if ($entry === '') continue;
                    $parts = explode('}', $entry, 2);
                    if (count($parts) === 2) {
                        $id  = trim($parts[0]);
                        $fn  = trim($parts[1]);
                        $oldFilesById[$id] = $fn;   // fn empty bhi ho sakta hai
                    }
                }
            }
        
            // 2) NEW string (jo Flutter se aa raha hai, final hi ye use karna hai)
            $newProposalDocumentId = $proposal_document_id;
        
            // 3) NEW ko map karo: [id => filename] (yehi final structure hoga)
            $newFilesById = [];
            if (!empty($newProposalDocumentId)) {
                $newEntries = explode('|', $newProposalDocumentId);
                foreach ($newEntries as $entry) {
                    if ($entry === '') continue;
                    $parts = explode('}', $entry, 2);
                    if (count($parts) === 2) {
                        $id  = trim($parts[0]);
                        $fn  = trim($parts[1]);     // yahi final filename hai
                        $newFilesById[$id] = $fn;
                    }
                }
            }
        
            // 4) docFiles[] se aayi physical files upload karo
            //    Flutter side pe order/ mapping tum jis hisab se kar rahe ho,
            //    yahan simple basename se upload kar rahe hain.
            if (isset($_FILES['docFiles']['name']) && is_array($_FILES['docFiles']['name'])) {
                if (!is_dir($docFileDir)) {
                    mkdir($docFileDir, 0775, true);
                }
        
                foreach ($_FILES['docFiles']['name'] as $index => $origName) {
                    if ($origName === '' || $_FILES['docFiles']['error'][$index] !== UPLOAD_ERR_OK) {
                        continue;
                    }
                    $tmpPath  = $_FILES['docFiles']['tmp_name'][$index];
                    $baseName = basename($origName);
                    $fullPath = $docFileDir . $baseName;
        
                    if (!move_uploaded_file($tmpPath, $fullPath)) {
                        throw new Exception('Failed to upload document file: ' . $baseName, 500);
                    }
                    // Tum already $_POST['proposal_document_id'] me correct basename bhej rahe ho,
                    // isliye yahan string modify karne ki jarurat nahi.
                }
            }
        
            // 5) Sirf CHANGED IDs ke purane physical files delete karo
            //    Condition: old me filename tha, new me usi id ka filename alag hai.
            foreach ($newFilesById as $id => $newFn) {
                $oldFn = isset($oldFilesById[$id]) ? $oldFilesById[$id] : '';
                if ($oldFn !== '' && $oldFn !== $newFn) {
                    $oldPath = $docFileDir . $oldFn;
                    if (file_exists($oldPath)) {
                        unlink($oldPath);
                    }
                }
            }
            
            
        
            $query = "UPDATE proposal SET 
                proposal_category_id = ?, 
                proposal_document_id = ?,
                pdf = ?, 
                remarks = ?,
                land_details = ?,
                number_of_tree = ?,
                beneficiaries = ?,
                supporting_map_doc = ?,
                taluka_id = ?, 
                gp_id = ?, 
                village_id = ?, 
                forward_to = ?, 
                work_status = ?,
                work_status_record = ?,
                user_id = ?,
                updated_at = NOW() 
                WHERE proposal_id = ?";
            $stmt = $con->prepare($query);
            $stmt->bind_param(
                'isssssssiiisssii',
                $proposal_category_id,
                $proposal_document_id,
                $pdfFileName,
                $remarks,
                $land_details, 
                $number_of_tree, 
                $beneficiaries, 
                $pdfFileName2,
                $taluka_id,
                $gp_id,
                $village_id,
                $forward_to,
                $work_status,
                $updated_record,
                $user_id,
                $proposal_id
            );
            if ($stmt->execute()) {
                echo json_encode([
                    'error' => false,
                    'message' => 'Proposal updated successfully.',
                    'proposal_id' => $proposal_id,
                ]);
            } else {
                throw new Exception('Update failed: ' . $stmt->error, 500);
            }
            $stmt->close();
            exit;
        }

    }
    elseif ($method == 'DELETE') {
        // DELETE API - Delete proposal
        
        parse_str(file_get_contents('php://input'), $delete_vars);
        $proposal_id = isset($delete_vars['proposal_id']) ? trim($delete_vars['proposal_id']) : '';
        if ($proposal_id === '') {
            throw new Exception('proposal_id is required.', 400);
        }
    
        // Get PDF and supporting_map_doc filenames
        $pdfFile = null;
        $pdfFile2 = null;
        $stmt = $con->prepare("SELECT pdf, supporting_map_doc, proposal_document_id FROM proposal WHERE proposal_id = ?");
        $stmt->bind_param("i", $proposal_id);
        $stmt->execute();
        $stmt->bind_result($pdfFile, $pdfFile2, $docFiles);
        if (!$stmt->fetch()) {
            $stmt->close();
            throw new Exception('Proposal not found.', 404);
        }
        $stmt->close();
    
        // Delete proposal row
        $stmt2 = $con->prepare("DELETE FROM proposal WHERE proposal_id = ?");
        $stmt2->bind_param("i", $proposal_id);
        if ($stmt2->execute()) {
            $stmt2->close();
    
            // Define upload directory
            $pdfDir = __DIR__ . '/proposal_files/';
    
            // Delete the main PDF file if it exists
            if ($pdfFile && file_exists($pdfDir . $pdfFile)) {
                unlink($pdfDir . $pdfFile);
            }
    
            // Delete the supporting_map_doc PDF file if it exists
            if ($pdfFile2 && file_exists($pdfDir . $pdfFile2)) {
                unlink($pdfDir . $pdfFile2);
            }
            
            if (!empty($docFiles)) {
            $docFileDir = __DIR__ . '/proposal_doc_files/';
            
            // Parse pipe-separated filenames: "1}PDOC120251224426.jpg|3}PDOC320251224637.pdf|..."
            $fileNames = explode('|', $docFiles);
            
            foreach ($fileNames as $fileData) {
                if (!empty($fileData)) {
                    // Extract filename after "}" (PDOC120251224426.jpg)
                    $fileName = substr(strrchr($fileData, '}'), 1);
                    
                    if ($fileName && file_exists($docFileDir . $fileName)) {
                        unlink($docFileDir . $fileName);
                    }
                }
            }
        }
    
            echo json_encode([
                'error' => false,
                'message' => 'Proposal deleted successfully.'
            ]);
        } else {
            $stmt2->close();
            throw new Exception('Delete failed: ' . $stmt2->error, 500);
        }
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
