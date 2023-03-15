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
    private readonly EXPECTED_HEADER = [137, 80, 78, 71, 13, 10, 26, 10];
    private height: number = 0;
    private width: number = 0;
    private bitDepth: number = 0;
    private colorType: ColorType = 0;
    private compressionMethod: number = 0;
    private filterMethod = 0;
    private interlaceMethod: InterlaceMethod = InterlaceMethod.None;

    constructor(data: Uint8Array) {
        this.streamer = new Streamer(data);

        this.validate();
    }

    validate() {
        for (let i = 0; i < this.EXPECTED_HEADER.length; i++) {
            if (this.streamer.read() !== this.EXPECTED_HEADER[i]) {
                throw new Error('Corrupted Header');
            }
        }
    }

    processIHDR() {
        this.streamer.read_bytes(4);
        this.streamer.read_bytes(4);

        this.width = new DataView(this.streamer.read_bytes(4).buffer).getInt32(0);
        this.height = new DataView(this.streamer.read_bytes(4).buffer).getInt32(0);
        this.bitDepth = this.streamer.read();
        this.colorType = this.streamer.read();
        this.compressionMethod = this.streamer.read()
        this.filterMethod = this.streamer.read()
        this.interlaceMethod = this.streamer.read()
    }
}

export default PNGDecoder;