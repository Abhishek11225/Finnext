import { NextRequest, NextResponse } from "next/server";
import { getOptionalEnv } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const cloudName = getOptionalEnv("CLOUDINARY_CLOUD_NAME");
    const apiKey = getOptionalEnv("CLOUDINARY_API_KEY");
    const apiSecret = getOptionalEnv("CLOUDINARY_API_SECRET");

    if (cloudName && apiKey && apiSecret) {
      // Create a FormData to send to Cloudinary's upload API
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`;
      
      const fileBuffer = await file.arrayBuffer();
      const base64File = Buffer.from(fileBuffer).toString("base64");
      const dataUri = `data:${file.type};base64,${base64File}`;

      const uploadFormData = new FormData();
      uploadFormData.append("file", dataUri);
      uploadFormData.append("upload_preset", "ml_default"); // standard default preset
      uploadFormData.append("api_key", apiKey);

      const res = await fetch(cloudinaryUrl, {
        method: "POST",
        body: uploadFormData,
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Cloudinary upload failed:", errText);
        throw new Error("Failed to upload to Cloudinary: " + errText);
      }

      const json = await res.json();
      return NextResponse.json({ url: json.secure_url });
    } else {
      // Fallback if Cloudinary is not configured
      console.warn("Cloudinary is not configured. Returning a mock upload URL.");
      return NextResponse.json({
        url: `https://res.cloudinary.com/dz4zyjg3s/image/upload/v1781879600/mock_portfolio_${Date.now()}.png`,
        message: "Cloudinary not configured. Fallback URL returned.",
      });
    }
  } catch (error: any) {
    console.error("Portfolio upload API error:", error);
    return NextResponse.json({ error: "Internal Server Error during upload" }, { status: 500 });
  }
}
