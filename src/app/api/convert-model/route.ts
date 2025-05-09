import { NextRequest, NextResponse } from 'next/server';

// TODO: Use an environment variable for this URL in a real application
const PYTHON_MICROSERVICE_URL = 'http://localhost:8001/convert';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelUrl, targetFormat } = body;

    if (!modelUrl || !targetFormat) {
      return NextResponse.json({ error: 'Missing modelUrl or targetFormat' }, { status: 400 });
    }

    if (targetFormat.toLowerCase() !== 'stl' && targetFormat.toLowerCase() !== 'obj') {
      return NextResponse.json({ error: 'Invalid targetFormat. Must be stl or obj.' }, { status: 400 });
    }

    console.log(`API Route (convert-model): Calling Python microservice for ${modelUrl} to ${targetFormat}`);

    // Call the Python microservice
    const microserviceResponse = await fetch(PYTHON_MICROSERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        glb_url: modelUrl, // Parameter name expected by the Python service
        output_format: targetFormat.toLowerCase(), // Parameter name expected
      }),
    });

    if (!microserviceResponse.ok) {
      // Try to get error details from the microservice response
      let errorBody = 'Conversion microservice failed.';
      try {
        const errJson = await microserviceResponse.json();
        errorBody = errJson.detail || JSON.stringify(errJson);
      } catch (e) {
        errorBody = await microserviceResponse.text();
      }
      console.error(`Error from Python microservice (status ${microserviceResponse.status}):`, errorBody);
      return NextResponse.json({ error: `Conversion failed: ${errorBody}` }, { status: microserviceResponse.status });
    }

    // Stream the response from the microservice (the converted file) back to the client
    const fileData = await microserviceResponse.arrayBuffer();
    const contentType = microserviceResponse.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = microserviceResponse.headers.get('content-disposition');

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    if (contentDisposition) {
      headers.set('Content-Disposition', contentDisposition);
    }
    // Set Content-Length if available, though arrayBuffer implies it's known
    headers.set('Content-Length', fileData.byteLength.toString());

    console.log(`API Route (convert-model): Successfully received converted file. Type: ${contentType}, Size: ${fileData.byteLength} bytes. Forwarding to client.`);
    
    return new NextResponse(fileData, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error("API Route Error (convert-model) - Outer catch:", error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error during conversion proxying.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 