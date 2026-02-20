import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import fs from 'fs';
import path from 'path';

export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT 
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
      WHERE p.status = 'Active'`
    );

    const response = rows.map((row) => ({
      ...row,
      proposal_id: row.proposal_id ? parseInt(row.proposal_id) : null,
      proposal_category_id: row.proposal_category_id
        ? parseInt(row.proposal_category_id)
        : null,
      taluka_id: row.taluka_id ? parseInt(row.taluka_id) : null,
      gp_id: row.gp_id ? parseInt(row.gp_id) : null,
      village_id: row.village_id ? parseInt(row.village_id) : null,
      user_id: row.user_id ? parseInt(row.user_id) : null,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

export async function POST(request: Request) {
  let connection;
  try {
    const formData = await request.formData();
    const action = formData.get('action') as string;
    const proposal_id = formData.get('proposal_id') as string;
    const proposal_category_id = formData.get('proposal_category_id') as string;
    const proposal_document_id = formData.get('proposal_document_id') as string;
    const remarks = formData.get('remarks') as string;
    const land_details = formData.get('land_details') as string;
    const number_of_tree = formData.get('number_of_tree') as string;
    const beneficiaries = formData.get('beneficiaries') as string;
    const taluka_id = formData.get('taluka_id') as string;
    const gp_id = formData.get('gp_id') as string;
    const village_id = formData.get('village_id') as string;
    const from_cate_id = formData.get('from_cate_id') as string;
    const forward_to = formData.get('forward_to') as string;
    const work_status = formData.get('work_status') as string;
    const user_id = formData.get('user_id') as string;
    const is_rejected = formData.get('is_rejected') as string;

    const work_status_record = `${user_id}}${from_cate_id}}${forward_to}}1}}${new Date()
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ')}`;

    const pdfDir = path.join(process.cwd(), 'tmp', 'uploads', 'proposal_files');
    const docFileDir = path.join(process.cwd(), 'tmp', 'uploads', 'proposal_doc_files');

    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    connection = await pool.getConnection();

    if (action === '1') {
      // INSERT
      let pdfOrigName = '';
      const pdfFile = formData.get('pdf') as File | null;
      if (pdfFile && pdfFile.size > 0) {
        pdfOrigName = path.basename(pdfFile.name);
        const buffer = Buffer.from(await pdfFile.arrayBuffer());
        const pdfFullPath = path.join(pdfDir, pdfOrigName);
        await fs.promises.writeFile(pdfFullPath, buffer);
      }

      let pdfOrigName2 = '';
      const pdfFile2 = formData.get('pdf2') as File | null;
      if (pdfFile2 && pdfFile2.size > 0) {
        pdfOrigName2 = path.basename(pdfFile2.name);
        const buffer = Buffer.from(await pdfFile2.arrayBuffer());
        const pdfFullPath2 = path.join(pdfDir, pdfOrigName2);
        await fs.promises.writeFile(pdfFullPath2, buffer);
      }

      // Handle docFiles
      const docFiles = formData.getAll('docFiles') as File[];
      if (docFiles.length > 0) {
        if (!fs.existsSync(docFileDir)) {
          fs.mkdirSync(docFileDir, { recursive: true });
        }

        for (const file of docFiles) {
          if (file.size > 0) {
            const baseName = path.basename(file.name);
            const fullPath = path.join(docFileDir, baseName);
            const buffer = Buffer.from(await file.arrayBuffer());
            await fs.promises.writeFile(fullPath, buffer);
          }
        }
      }

      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO proposal 
          (proposal_category_id, proposal_document_id, pdf, remarks, land_details, number_of_tree, beneficiaries, supporting_map_doc, taluka_id, gp_id, village_id, forward_to, work_status, work_status_record, user_id, status, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', NOW(), NOW())`,
        [
          proposal_category_id,
          proposal_document_id,
          pdfOrigName,
          remarks,
          land_details,
          number_of_tree,
          beneficiaries,
          pdfOrigName2,
          taluka_id,
          gp_id,
          village_id,
          forward_to,
          work_status,
          work_status_record,
          user_id,
        ]
      );

      return NextResponse.json({
        error: false,
        message: 'Proposal submitted successfully.',
        proposal_id: result.insertId,
      });
    } else if (action === '2') {
      // UPDATE
      if (!proposal_id) {
        return NextResponse.json(
          {
            error: true,
            code: 400,
            message: 'Proposal ID is required for update.',
          },
          { status: 400 }
        );
      }

      // Get old PDF and supporting_map_doc filenames from database
      const [existingRows] = await connection.query<RowDataPacket[]>(
        'SELECT pdf, supporting_map_doc, work_status_record, proposal_document_id FROM proposal WHERE proposal_id = ?',
        [proposal_id]
      );

      if (existingRows.length === 0) {
        return NextResponse.json(
          { error: true, message: 'Proposal not found' },
          { status: 404 }
        );
      }

      const oldPdf = existingRows[0].pdf || '';
      const oldPdf2 = existingRows[0].supporting_map_doc || '';
      const existing_record = existingRows[0].work_status_record || '';
      const oldProposalDocumentId = existingRows[0].proposal_document_id || '';

      let pdfFileName = oldPdf;
      let pdfFileName2 = oldPdf2;
      let updated_record = work_status_record;

      if (is_rejected === 'Yes' && existing_record) {
        updated_record = `${existing_record}|${work_status_record}`;
      }

      // Check if new PDF file uploaded for update
      const pdfFile = formData.get('pdf') as File | null;
      if (pdfFile && pdfFile.size > 0) {
        const pdfNewName = path.basename(pdfFile.name);
        if (pdfNewName !== oldPdf) {
          if (oldPdf && fs.existsSync(path.join(pdfDir, oldPdf))) {
            fs.unlinkSync(path.join(pdfDir, oldPdf));
          }
          const buffer = Buffer.from(await pdfFile.arrayBuffer());
          const pdfFullPath = path.join(pdfDir, pdfNewName);
          await fs.promises.writeFile(pdfFullPath, buffer);
          pdfFileName = pdfNewName;
        }
      }

      // Check if new supporting_map_doc file uploaded for update
      const pdfFile2 = formData.get('pdf2') as File | null;
      if (pdfFile2 && pdfFile2.size > 0) {
        const pdfNewName2 = path.basename(pdfFile2.name);
        if (pdfNewName2 !== oldPdf2) {
          if (oldPdf2 && fs.existsSync(path.join(pdfDir, oldPdf2))) {
            fs.unlinkSync(path.join(pdfDir, oldPdf2));
          }
          const buffer = Buffer.from(await pdfFile2.arrayBuffer());
          const pdfFullPath2 = path.join(pdfDir, pdfNewName2);
          await fs.promises.writeFile(pdfFullPath2, buffer);
          pdfFileName2 = pdfNewName2;
        }
      }

      // Handle docFiles for update
      const oldFilesById: Record<string, string> = {};
      if (oldProposalDocumentId) {
        const oldEntries = oldProposalDocumentId.split('|');
        for (const entry of oldEntries) {
          if (!entry) continue;
          const parts = entry.split('}', 2);
          if (parts.length === 2) {
            const id = parts[0].trim();
            const fn = parts[1].trim();
            oldFilesById[id] = fn;
          }
        }
      }

      const newProposalDocumentId = proposal_document_id || '';
      const newFilesById: Record<string, string> = {};
      if (newProposalDocumentId) {
        const newEntries = newProposalDocumentId.split('|');
        for (const entry of newEntries) {
          if (!entry) continue;
          const parts = entry.split('}', 2);
          if (parts.length === 2) {
            const id = parts[0].trim();
            const fn = parts[1].trim();
            newFilesById[id] = fn;
          }
        }
      }

      // Upload new docFiles
      const docFiles = formData.getAll('docFiles') as File[];
      if (docFiles.length > 0) {
        if (!fs.existsSync(docFileDir)) {
          fs.mkdirSync(docFileDir, { recursive: true });
        }

        for (const file of docFiles) {
          if (file.size > 0) {
            const baseName = path.basename(file.name);
            const fullPath = path.join(docFileDir, baseName);
            const buffer = Buffer.from(await file.arrayBuffer());
            await fs.promises.writeFile(fullPath, buffer);
          }
        }
      }

      // Delete old files that were changed
      for (const [id, newFn] of Object.entries(newFilesById)) {
        const oldFn = oldFilesById[id] || '';
        if (oldFn && oldFn !== newFn) {
          const oldPath = path.join(docFileDir, oldFn);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
      }

      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE proposal SET 
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
          WHERE proposal_id = ?`,
        [
          proposal_category_id,
          proposal_document_id,
          pdfFileName,
          remarks,
          land_details,
          number_of_tree,
          beneficiaries,
          pdfFileName2,
          taluka_id,
          gp_id,
          village_id,
          forward_to,
          work_status,
          updated_record,
          user_id,
          proposal_id,
        ]
      );

      if (result.affectedRows > 0) {
        return NextResponse.json({
          error: false,
          message: 'Proposal updated successfully.',
          proposal_id: parseInt(proposal_id),
        });
      } else {
        return NextResponse.json(
          { error: true, message: 'Update failed' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: true, message: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in proposal CRUD:', error);
    return NextResponse.json(
      {
        error: true,
        code: 500,
        message: error instanceof Error ? error.message : 'Operation failed',
      },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

export async function DELETE(request: Request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const proposal_id = searchParams.get('proposal_id');

    if (!proposal_id) {
      return NextResponse.json(
        { error: true, message: 'proposal_id is required.' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    // Get PDF and supporting_map_doc filenames
    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT pdf, supporting_map_doc, proposal_document_id FROM proposal WHERE proposal_id = ?',
      [proposal_id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: true, message: 'Proposal not found.' },
        { status: 404 }
      );
    }

    const pdfFile = rows[0].pdf || '';
    const pdfFile2 = rows[0].supporting_map_doc || '';
    const docFiles = rows[0].proposal_document_id || '';

    // Delete proposal row
    const [result] = await connection.execute<ResultSetHeader>(
      'DELETE FROM proposal WHERE proposal_id = ?',
      [proposal_id]
    );

    if (result.affectedRows > 0) {
      const pdfDir = path.join(process.cwd(), 'tmp', 'uploads', 'proposal_files');
      const docFileDir = path.join(
        process.cwd(),
        'tmp',
        'uploads',
        'proposal_doc_files'
      );

      // Delete the main PDF file if it exists
      if (pdfFile && fs.existsSync(path.join(pdfDir, pdfFile))) {
        fs.unlinkSync(path.join(pdfDir, pdfFile));
      }

      // Delete the supporting_map_doc PDF file if it exists
      if (pdfFile2 && fs.existsSync(path.join(pdfDir, pdfFile2))) {
        fs.unlinkSync(path.join(pdfDir, pdfFile2));
      }

      // Delete docFiles
      if (docFiles) {
        const fileNames = docFiles.split('|');
        for (const fileData of fileNames) {
          if (fileData) {
            const fileName = fileData.split('}').pop();
            if (fileName && fs.existsSync(path.join(docFileDir, fileName))) {
              fs.unlinkSync(path.join(docFileDir, fileName));
            }
          }
        }
      }

      return NextResponse.json({
        error: false,
        message: 'Proposal deleted successfully.',
      });
    } else {
      return NextResponse.json(
        { error: true, message: 'Delete failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting proposal:', error);
    return NextResponse.json(
      {
        error: true,
        code: 500,
        message: error instanceof Error ? error.message : 'Delete failed',
      },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

