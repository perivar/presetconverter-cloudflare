#pragma endian little
import std.mem;
import std.string;
import std.sys;
import std.io;

// Function to generate a color from a u32 integer
// We use a simple hash multiplier (Golden Ratio) to ensure
// similar IDs (like "Comp" and "Cont") get very different colors.
fn chunk_color(u32 seed) {
    return (seed * 0x9E3779B9) & 0xFFFFFF;
};


// VST3 Preset Header
struct VST3Header {
   char magic[4];        // "VST3"
   u32 version;          // Version number (1)
   char class_id[32];    // ASCII-encoded class ID
   u64 list_offset;      // Offset to chunk list
};

// Generic Chunk Data
struct VST3Chunk<auto len> {
   u8 chunk_data[len];   // Raw chunk data
   std::print(std::format("chunk_data len: {}", len));
};

// Chunk Entry in List
struct VST3ChunkEntry {
   char id[4];           // Chunk ID ("Info", "Comp", "Cont")
   u64 offset;           // Offset to chunk data
   u64 size;             // Size of chunk data
   
   // Convert the 4-char ID array into a single u32 integer for hashing.
   // We cast each char to u32 and shift them into position.
   u32 color_seed = (u32(id[0]) << 24) | (u32(id[1]) << 16) | (u32(id[2]) << 8) | u32(id[3]);

   std::print(std::format("id: '{}': offset: {}, size: {}", id, offset, size));
   
   // Pass the calculated seed to the function inside the color attribute
   VST3Chunk<size> data @ offset [[color(chunk_color(color_seed))]];
};

// Chunk List
struct VST3ChunkList {
   char list_id[4];      // "List"
   u32 count;            // Number of chunks
   VST3ChunkEntry chunks[count];
};

// Main VST3 Preset Structure
struct VST3Preset {
   VST3Header header;

   // Validate header magic
   str value = header.magic;
   str expectedValue = "VST3";
   
   std::assert(
      value == expectedValue,
      std::format(
         "Invalid header value! Expected {}, got {} at position 0x{:X}",
         expectedValue, value, $ - std::string::length(expectedValue)));

   // Chunk list at specified offset
   VST3ChunkList chunk_list @ header.list_offset;
};

VST3Preset preset @ 0x00;
