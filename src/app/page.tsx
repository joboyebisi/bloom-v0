"use client";

// import { Button } from "@/components/ui/button"; // No longer needed here
import { ImageUploader } from "@/components/image-uploader";
import { ModelViewer } from "@/components/model-viewer";
import { useModelContext } from "@/context/model-context";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Upload, Cpu, Eye, Download } from 'lucide-react'; // Added Download icon
import { Button } from "@/components/ui/button"; // Added Button import
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Home() {
  // Get state from context
  const { generatedModelUrl, isLoading, error, clearError } = useModelContext();
  // Ref for the hidden download link
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  // Show error toast if generation fails
  useEffect(() => {
    if (error) {
      toast.error("Generation Failed: " + error, {
         // Keep toast visible until dismissed or error cleared
        duration: Infinity, 
        onDismiss: clearError, // Clear error state when toast is dismissed
      });
    }
  }, [error, clearError]);

  // Function to handle the download attempt based on selected format
  const handleDownloadAttempt = async (format: "glb" | "stl" | "obj") => {
     if (generatedModelUrl && !isLoading) {
         if (format === "glb") {
            // For GLB, use the existing direct download logic
            if (downloadLinkRef.current) {
              downloadLinkRef.current.href = generatedModelUrl; // GLB URL is already absolute
              downloadLinkRef.current.download = `bloom-model-${Date.now()}.glb`;
              downloadLinkRef.current.click();
            }
         } else {
          // For STL/OBJ, call the conversion API
          toast.info(`Requesting ${format.toUpperCase()} conversion... This may take a moment.`);
          try {
            const apiUrl = process.env.NEXT_PUBLIC_CONVERSION_API_URL;
            if (!apiUrl) {
              throw new Error("Conversion API URL is not configured.");
            }

            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                glb_url: generatedModelUrl,
                output_format: format,
              }),
            });

            if (!response.ok) {
              let errorMsg = `Failed to convert to ${format.toUpperCase()}`;
              try {
                const errorResult = await response.json();
                errorMsg = errorResult.error || errorMsg;
              } catch (e) {
                // If parsing error JSON fails, use the status text
                errorMsg = `${errorMsg} (Status: ${response.status} ${response.statusText})`;
              }
              throw new Error(errorMsg);
            }

            // Get filename from Content-Disposition header if available
            const disposition = response.headers.get('content-disposition');
            let filename = `bloom-model-${Date.now()}.${format}`;
            if (disposition && disposition.indexOf('attachment') !== -1) {
              const filenameRegex = /filename[^;=\n]*=((['"])(.*?)\2|[^;\n]*)/;
              const matches = filenameRegex.exec(disposition);
              if (matches != null && matches[3]) {
                filename = matches[3];
              }
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a); // Required for Firefox
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            toast.success(`Successfully downloaded ${filename}`);

          } catch (apiError) {
            console.error(`Error converting to ${format.toUpperCase()}:`, apiError);
            toast.error(apiError instanceof Error ? apiError.message : `Could not convert to ${format.toUpperCase()}`);
          }
         }
     }
  };

  return (
    // Main container now includes Hero + Flex container
    <main className="flex flex-grow flex-col items-center justify-start p-4 gap-8 md:gap-12">
      
      {/* Hero Section - MOVED HERE */}
      <section className="w-full text-center py-10 md:py-16 bg-gradient-to-r from-cyan-50 via-blue-50 to-purple-50 rounded-lg shadow-sm">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800 px-4">
          BLOOM: AI-Aided 3D/VR Content Authoring for Dental Educators
        </h1>
        <p className="text-md md:text-lg max-w-3xl mx-auto text-gray-600 px-4">
          Create 3D Models from your dental image bank that can be used for teaching on VR-Haptics Dental Simulators, VR Headsets or for teaching in classroom.
        </p>
      </section>

      {/* How It Works Section - ADDED HERE */}
      <section className="w-full px-4 md:px-6 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-10 text-gray-800">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          {/* Step 1 */}
          <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg shadow-sm">
            <Upload className="w-12 h-12 text-blue-600 mb-4" strokeWidth={1.5} />
            <h3 className="text-lg font-semibold mb-2">Step 1: Upload</h3>
            <p className="text-sm text-gray-600">
              Upload 2D images or provide text descriptions of the desired dental scenario.
            </p>
          </div>
          {/* Step 2 */}
          <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg shadow-sm">
            <Cpu className="w-12 h-12 text-blue-600 mb-4" strokeWidth={1.5} />
            <h3 className="text-lg font-semibold mb-2">Step 2: Generate</h3>
            <p className="text-sm text-gray-600">
              Our AI-powered tool processes your input to generate a 3D model.
            </p>
          </div>
          {/* Step 3 */}
          <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg shadow-sm">
            <Eye className="w-12 h-12 text-blue-600 mb-4" strokeWidth={1.5} />
            <h3 className="text-lg font-semibold mb-2">Step 3: Use</h3>
            <p className="text-sm text-gray-600">
              View, interact with, and download your custom 3D learning asset for use in VR simulators.
            </p>
          </div>
        </div>
      </section>

      {/* Container for Uploader and Viewer (side-by-side on md+) */}
      <div className="w-full flex flex-col md:flex-row items-center md:items-start justify-center gap-8">
          {/* Viewer Area */}
          <div className="w-full md:w-2/3 flex flex-col items-center justify-center order-1 md:order-2">
            <div className="w-full max-w-3xl h-[500px] flex items-center justify-center border rounded bg-gray-50 mb-4 md:mb-0">
              {generatedModelUrl ? (
                <ModelViewer 
                  modelUrl={`/api/proxy-model?url=${encodeURIComponent(generatedModelUrl)}`} 
                />
              ) : isLoading ? (
                <div className="text-center">
                  <p className="text-lg font-semibold">Generating Model...</p>
                  <p className="text-sm text-gray-600">Please wait.</p>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <p>Upload an image using the panel on the left.</p>
                  <p>(Generated 3D model will appear here)</p>
                </div>
              )}
            </div>
            {/* Visible Download Button (triggers modal) */}
            <div className="mt-4 text-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline"
                    disabled={!generatedModelUrl || isLoading}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Model
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDownloadAttempt("glb")} disabled={!generatedModelUrl || isLoading}>
                    Download as GLB
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadAttempt("stl")} disabled={!generatedModelUrl || isLoading}>
                    Download as STL
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadAttempt("obj")} disabled={!generatedModelUrl || isLoading}>
                    Download as OBJ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* Hidden actual download link (primarily for GLB direct download) */}
              <a 
                ref={downloadLinkRef}
                href={generatedModelUrl || '#'}
                download={generatedModelUrl ? `bloom-model-${Date.now()}.glb` : undefined}
                style={{ display: 'none' }} // Keep hidden
              >
                Hidden Download Trigger
              </a>
            </div>
          </div>
          
          {/* Uploader Area */}
          <div className="w-full md:w-1/3 flex justify-center items-start order-2 md:order-1">
            <ImageUploader />
          </div>
      </div>
    </main>
  );
}