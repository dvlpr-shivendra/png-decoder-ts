import Streamer from "./components/Streamer";

enum ColorType {
    Grayscale = 0,
    RGB = 2,
    IndexedColor,
    GrayscaleWithAlpha,
    RGBA = 6,
}

enum FilterType {
    None,
    Sub,
    Up,
    Average,
    Paeth,
}

enum InterlaceMethod {
    None,
    Adam7,
}

class PNGDecoder {
    private streamer: Streamer;
    private height: number = 0;
    private width: number = 0;
    private bitDepth: number = 0;
    private colorType: ColorType = 0;
    private compressionMethod: number = 0;
    private filterMethod = 0;
    private interlaceMethod: InterlaceMethod = InterlaceMethod.None;

    constructor(data: Uint8Array) {
        this.streamer = new Streamer(data);

        this.validateHeader();
    }

    validateHeader() {
        const EXPECTED_HEADER = [137, 80, 78, 71, 13, 10, 26, 10];

        for (let i = 0; i < EXPECTED_HEADER.length; i++) {
            if (this.streamer.read() !== EXPECTED_HEADER[i]) {
                throw new Error('Corrupted Header');
            }
        }
    }

    decodeBitmap() {
        this.decodeChunks();
    }

    decodeChunks() {
        while (!this.streamer.atEnd) {
            this.processChunk();
        }
    }

    processChunk() {
        let chunkSize = this.streamer.readInt32();
        let chunkType = this.streamer.readString(4);
        let chunkData = this.streamer.readBytes(chunkSize);
        let chunkCrc = this.streamer.readInt32();

        if (chunkType === 'IHDR') this.processIHDR(chunkData);
    }

    processIHDR(data: Uint8Array) {
        const streamer = new Streamer(data);

        this.width = streamer.readInt32();
        this.height = streamer.readInt32();
        this.bitDepth = streamer.read();
        this.colorType = streamer.read();
        this.compressionMethod = streamer.read()
        this.filterMethod = streamer.read();
        this.interlaceMethod = streamer.read();
    }


    public get channels(): number {
        if (this.colorType === ColorType.RGB) return 3;
        else if (this.colorType === ColorType.RGBA) return 4;
        else throw new Error(`Implement ${ColorType[this.colorType]}`);
    }

    public get bytesPerPixel(): number {
        return (this.bitDepth + 7) / 8 * this.channels;
    }
}

export default PNGDecoder;