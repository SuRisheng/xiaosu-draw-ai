#!/usr/bin/env node
/**
 * png-extract.js — Extract embedded draw.io XML from a .drawio.png file.
 *
 * When draw.io exports with --embed-diagram (-e / --final), it stores the
 * source .drawio XML in a PNG zTXt chunk with keyword "mxfile". This tool
 * extracts that XML for modification or re-import.
 *
 * If no embedded XML is found (plain PNG, not --final exported), exits with
 * code 1 and a clear message.
 *
 * Usage:
 *   node scripts/png-extract.js <file.drawio.png>                  # Output XML to stdout
 *   node scripts/png-extract.js <file.drawio.png> --output out.xml # Save to file
 *   node scripts/png-extract.js <file.drawio.png> --info           # Show embed info only
 *
 * No external dependencies — pure Node.js (fs + zlib).
 */

const fs = require('fs');
const zlib = require('zlib');

// ── PNG Chunk Reader ──────────────────────────────────────────────

function readChunks(buffer) {
    const chunks = [];
    let offset = 8; // Skip PNG signature (8 bytes)

    while (offset < buffer.length - 4) {
        if (offset + 8 > buffer.length) break;
        const length = buffer.readUInt32BE(offset);
        const type = buffer.toString('ascii', offset + 4, offset + 8);

        if (offset + 12 + length > buffer.length) break;

        const dataStart = offset + 8;
        const dataEnd = dataStart + length;
        const data = buffer.slice(dataStart, dataEnd);

        chunks.push({ type, length, data, offset });

        offset = dataEnd + 4; // +4 for CRC
        if (type === 'IEND') break;
    }

    return chunks;
}

// ── Extraction ────────────────────────────────────────────────────

function extractXML(buffer) {
    const chunks = readChunks(buffer);
    const mxfileChunks = [];

    for (const chunk of chunks) {
        if (chunk.type !== 'zTXt') continue;

        // zTXt format: keyword\0 compression_method compressed_text
        const nullPos = chunk.data.indexOf(0);
        if (nullPos === -1) continue;

        const keyword = chunk.data.toString('ascii', 0, nullPos);

        // Accept both variants:
        //   "mxfile"       — draw.io ≤ v22, stores full <mxfile>…</mxfile>
        //   "mxGraphModel" — draw.io ≥ v30, stores <mxGraphModel>…</mxGraphModel> only
        if (keyword !== 'mxfile' && keyword !== 'mxGraphModel') continue;

        const compressionMethod = chunk.data[nullPos + 1];
        const compressedData = chunk.data.slice(nullPos + 2);

        try {
            let xml = zlib.inflateSync(compressedData).toString('utf-8');

            // draw.io ≥ v30 URL-encodes the mxGraphModel data before compression
            if (xml.startsWith('%3C')) {
                xml = decodeURIComponent(xml);
            }

            // Wrap bare mxGraphModel (no outer mxfile) in a valid .drawio skeleton
            if (keyword === 'mxGraphModel' && !xml.startsWith('<?xml') && !xml.startsWith('<mxfile')) {
                xml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="drawio" version="26.0.0" type="device">
  <diagram name="Page-1" id="page-1">
    ${xml}
  </diagram>
</mxfile>`;
            }

            mxfileChunks.push({ keyword, xml, length: xml.length });
        } catch (e) {
            // Try raw (uncompressed) — some tools store it uncompressed
            try {
                let xml = compressedData.toString('utf-8');
                // URL-decode if needed
                if (xml.startsWith('%3C')) {
                    xml = decodeURIComponent(xml);
                }
                if (xml.startsWith('<?xml') || xml.startsWith('<mxfile') || xml.startsWith('<mxGraphModel')) {
                    if (keyword === 'mxGraphModel' && !xml.startsWith('<?xml') && !xml.startsWith('<mxfile')) {
                        xml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="drawio" version="26.0.0" type="device">
  <diagram name="Page-1" id="page-1">
    ${xml}
  </diagram>
</mxfile>`;
                    }
                    mxfileChunks.push({ keyword, xml, length: xml.length });
                }
            } catch (_) {}
        }
    }

    return mxfileChunks;
}

// ── Main ──────────────────────────────────────────────────────────

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log(`png-extract.js — Extract embedded draw.io XML from .drawio.png

Usage:
  node scripts/png-extract.js <file.drawio.png>                  # Output XML to stdout
  node scripts/png-extract.js <file.drawio.png> --output out.xml # Save to file
  node scripts/png-extract.js <file.drawio.png> --info           # Show embed info
`);
        process.exit(0);
    }

    const filepath = args[0];
    if (!fs.existsSync(filepath)) {
        console.error(`ERROR: File not found: ${filepath}`);
        process.exit(1);
    }

    const buffer = fs.readFileSync(filepath);

    // Check PNG signature
    const signature = buffer.slice(0, 8);
    const isPNG = signature.toString('hex') === '89504e470d0a1a0a';
    if (!isPNG) {
        console.error('ERROR: Not a valid PNG file (bad signature).');
        process.exit(1);
    }

    const chunks = extractXML(buffer);

    if (args.includes('--info')) {
        console.log(`File: ${filepath}`);
        console.log(`PNG size: ${(buffer.length / 1024).toFixed(1)} KB`);
        console.log(`Total chunks: ${readChunks(buffer).length}`);
        console.log(`Embedded XML: ${chunks.length > 0 ? 'YES (' + chunks.length + ' mxfile chunk(s))' : 'NOT FOUND'}`);
        if (chunks.length > 0) {
            for (const c of chunks) {
                console.log(`  XML size: ${c.length} chars (${(c.length / 1024).toFixed(1)} KB)`);
            }
        }
        process.exit(chunks.length > 0 ? 0 : 1);
    }

    if (chunks.length === 0) {
        console.error('ERROR: No embedded draw.io XML found in this PNG.');
        console.error('This PNG was likely NOT exported with --embed-diagram (-e).');
        console.error('Supported chunk keywords: "mxfile" (draw.io ≤ v22) or "mxGraphModel" (draw.io ≥ v30).');
        console.error('Ask the user to provide the original .drawio file, or re-export with:');
        console.error('  drawio -x -f png --embed-diagram -o output.drawio.png input.drawio');
        process.exit(1);
    }

    const xml = chunks[0].xml;

    const outputIdx = args.indexOf('--output');
    if (outputIdx !== -1 && outputIdx + 1 < args.length) {
        const outputPath = args[outputIdx + 1];
        fs.writeFileSync(outputPath, xml, 'utf-8');
        console.log(`Extracted ${xml.length} chars of XML → ${outputPath}`);
    } else {
        console.log(xml);
    }
}

module.exports = { readChunks, extractXML };

if (require.main === module) {
    main();
}
