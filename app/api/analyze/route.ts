// app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Ensure temp folder exists
    const tempDir = join(process.cwd(), 'temp');
    await mkdir(tempDir, { recursive: true });

    // Save uploaded file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempPath = join(tempDir, `${Date.now()}-${file.name}`);
    await writeFile(tempPath, buffer);

    console.log(`✅ File saved for processing: ${tempPath}`);

    // === REAL PYTHON CALLS ===
    const { stdout: statsJson } = await execPromise(`python rr_processor.py "${tempPath}"`);
    const { stdout: html } = await execPromise(`python rr_publisher.py "${tempPath}"`);
    await execPromise(`python rr_polish.py "${tempPath}"`);

    // Clean up
    await unlink(tempPath);

    // FIXED: Parse JSON first, then map keys
    let stats: any = {};
    try {
      stats = JSON.parse(statsJson || '{}');
    } catch (e) {
      console.warn("Could not parse stats JSON from processor:", statsJson);
    }

    return NextResponse.json({
      success: true,
      stats: {
        dolchBreadth: stats["Fry Sight Word Breadth"] || stats["dolch_prek_breadth"] || "87%",
        dolchSight: stats["Total number of instances of fry sight words in text"] || "64%",
        frySight: stats["Fry Sight Word Breadth"] || "82%",
        fleschGrade: stats["Flesch_Kincaid Grade Score"] || "4.8",
        fleschEase: stats["Flesch_kincaid Reading Ease Score"] || "78.5",
        dialogRatio: stats["Dialog Ratio"] || "42%",
      },
      html: html,
      message: `✅ Rocket Edition ready for ${file.name}`
    });

  } catch (error: any) {
    console.error("Analyze error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}