import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

interface ProposalDocument extends RowDataPacket {
  proposal_document_id: number;
  document_name: string;
  status?: string;
}

// GET - Fetch proposal document details by IDs
// Query param: document_ids - comma-separated or pipe-separated IDs like "1}|2}|5" or "1,2,5"
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const documentIdsParam = searchParams.get('document_ids');

    if (!documentIdsParam) {
      return NextResponse.json(
        { error: 'document_ids parameter is required' },
        { status: 400 }
      );
    }

    // Parse the document IDs - handle both "1}|2}|5" and "1,2,5" formats
    let documentIds: number[] = [];
    
    // Try pipe-separated format first (with }| separator)
    if (documentIdsParam.includes('}|')) {
      documentIds = documentIdsParam
        .split('}|')
        .map(id => {
          // Remove any trailing } and trim
          const cleanId = id.replace('}', '').trim();
          return parseInt(cleanId, 10);
        })
        .filter(id => !isNaN(id) && id > 0);
    } else {
      // Try comma-separated format
      documentIds = documentIdsParam
        .split(',')
        .map(id => parseInt(id.trim(), 10))
        .filter(id => !isNaN(id) && id > 0);
    }

    if (documentIds.length === 0) {
      return NextResponse.json({
        documents: [],
        message: 'No valid document IDs found'
      });
    }

    // Fetch documents from proposal_document table
    const placeholders = documentIds.map(() => '?').join(',');
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        proposal_document_id,
        name AS document_name,
        status
      FROM proposal_document
      WHERE proposal_document_id IN (${placeholders})
      ORDER BY proposal_document_id ASC`,
      documentIds
    );

    const documents = (Array.isArray(rows) ? rows : []) as ProposalDocument[];

    // Create a map of found document IDs
    const foundIds = new Set(documents.map(d => d.proposal_document_id));

    // Create result with all requested IDs and their status
    const result = documentIds.map(id => {
      const document = documents.find(d => d.proposal_document_id === id);
      return {
        proposal_document_id: id,
        document_name: document?.document_name || 'Unknown Document',
        exists: foundIds.has(id),
        status: document?.status || null
      };
    });

    return NextResponse.json({
      success: true,
      documents: result,
      total: result.length,
      found: documents.length
    });
  } catch (error) {
    console.error('Error fetching proposal documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposal documents', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

