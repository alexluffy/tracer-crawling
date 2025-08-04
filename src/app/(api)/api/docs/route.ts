import { NextRequest, NextResponse } from 'next/server';
import { getApiDocs } from '@/lib/swagger';

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Get API documentation in OpenAPI format
 *     description: Returns the complete OpenAPI specification for the Demo Tracer API
 *     tags:
 *       - Documentation
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
export async function GET(request: NextRequest) {
  try {
    const spec = getApiDocs();
    return NextResponse.json(spec);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate API documentation' },
      { status: 500 }
    );
  }
}