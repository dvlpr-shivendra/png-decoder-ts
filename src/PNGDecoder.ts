import Image from "./Image";
import Streamer from "./Streamer";
import pako from "pako";

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

interface Scanline {
    filter: FilterType
    data: Uint8Array
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

    private compressedData: Uint8Array;

    private scanlines: Scanline[] = [];

    private image: Image;

    constructor(data: Uint8Array) {
        this.streamer = new Streamer(data);

        this.validateHeader();
    }

    validateHeader() {
        const EXPECTED_HEADER = [137, 80, 78, 71, 13, 10, 26, 10];

        for (let i = 0; i < EXPECTED_HEADER.length; i++) {
            if (this.streamer.readByte() !== EXPECTED_HEADER[i]) {
                throw new Error('Corrupted Header');
            }
        }
    }

    decodeBitmap() {
        this.decodeChunks();

        const decompressedData = pako.inflate(this.compressedData);

        if (!this.interlaceMethod) this.decodeBitmapSimple(decompressedData);
        else throw new Error("Implement Adam7 PNG support.");

    }

    decodeChunks() {
        while (!this.streamer.atEnd) {
            this.processChunks();
        }
    }

    processChunks() {
        let chunkSize = this.streamer.readInt32();
        let chunkType = this.streamer.readString(4);
        let chunkData = this.streamer.readBytes(chunkSize);
        let chunkCrc = this.streamer.readInt32();

        if (chunkType === 'IHDR') this.processIHDR(chunkData);
        else if (chunkType === 'IDAT') this.processIDAT(chunkData);
        else if (chunkType === 'tEXt') this.processEText(chunkData);
        else if (chunkType === 'zTXt') this.processZText(chunkData);
        else if (chunkType === 'tIME') this.processTime(chunkData);
        else if (chunkType === 'IEND') { }
        else console.log(`TODO: Implement ${chunkType}`);
    }

    processEText(data: Uint8Array) {
        const streamer = new Streamer(data);
        let keyword = '';
        while (true) {
            const charCode: number = streamer.readByte()
            if (charCode === 0) break;
            keyword += String.fromCharCode(charCode)
        }
        console.log(`${keyword}: ${streamer.readString()}`);
    }

    processZText(data: Uint8Array) {
        const streamer = new Streamer(data);
        let keyword = '';
        while (true) {
            const charCode: number = streamer.readByte()
            if (charCode === 0) break;
            keyword += String.fromCharCode(charCode)
        }

        if (streamer.readByte() !== 0) {
            console.error("Unsupported compression method used for zTXt");
            return;
        }


        const textStreamer = new Streamer(pako.inflate(streamer.readBytes()))

        console.log(`${keyword}: ${textStreamer.readString()}`);
    }

    processTime(data: Uint8Array) {
        const streamer = new Streamer(data);
        const year = streamer.readInt16()
        let month: number | string = streamer.readByte()
        if (month < 10) {
            month = `0${month}`
        }
        let day: number | string = streamer.readByte()
        if (day < 10) {
            day = `0${day}`
        }
        let hour: number | string = streamer.readByte()
        if (hour < 10) {
            hour = `0${hour}`
        }
        let minute: number | string = streamer.readByte()
        if (minute < 10) {
            minute = `0${minute}`
        }
        let second: number | string = streamer.readByte()
        if (second < 10) {
            second = `0${second}`
        }
        console.log('Last modified at: ' + `${hour}:${minute}:${second} ${day}/${month}/${year}`);

    }

    processIDAT(data: Uint8Array) {
        if (!this.compressedData) {
            this.compressedData = data;
            return;
        }

        const mergedData: Uint8Array = new Uint8Array(
            this.compressedData.length + data.length
        );

        mergedData.set(this.compressedData, 0);
        mergedData.set(data, this.compressedData.length);

        this.compressedData = mergedData;
    }

    processIHDR(data: Uint8Array) {
        const streamer = new Streamer(data);

        this.width = streamer.readInt32();
        this.height = streamer.readInt32();
        this.bitDepth = streamer.readByte();
        this.colorType = streamer.readByte();
        this.compressionMethod = streamer.readByte()
        this.filterMethod = streamer.readByte();
        this.interlaceMethod = streamer.readByte();
    }


    get channels(): number {
        if (this.colorType === ColorType.RGB) return 3;
        else if (this.colorType === ColorType.RGBA) return 4;
        else throw new Error(`Implement ${ColorType[this.colorType]}`);
    }

    get bytesPerPixel(): number {
        return (this.bitDepth + 7) / 8 * this.channels;
    }

    computeScanlineSizeForWidth(width: number) {
        let size = width;
        size *= this.channels;
        size *= this.bitDepth;
        size += 7;
        size /= 8;
        return Math.floor(size);
    }

    decodeBitmapSimple(data: Uint8Array) {
        const streamer = new Streamer(data);

        for (let i = 0; i < this.height; i++) {
            const filter: FilterType = streamer.readByte();
            const scanlineSize = this.computeScanlineSizeForWidth(this.width);
            this.scanlines.push({ filter, data: streamer.readBytes(scanlineSize) });
        }

        this.image = new Image(this.height, this.width);

        this.unfilter();
    }

    unfilter() {
        const bytesPerScanline = this.scanlines[0].data.length;
        const bytesPerCompletePixel = Math.floor((this.bitDepth + 7) / 8) * this.channels;

        for (let i = 0; i < this.scanlines.length; i++) {
            const scanline = this.scanlines[i];
            switch (scanline.filter) {
                case FilterType.None:
                    break;
                case FilterType.Sub:
                    for (let j = bytesPerCompletePixel; j < bytesPerScanline; j++) {
                        const left = scanline.data[j - bytesPerCompletePixel];
                        scanline.data[j] += left;
                    }
                    break;
                case FilterType.Up:
                    for (let j = 0; j < bytesPerScanline; j++) {
                        const above = i > 0 ? this.scanlines[i - 1].data[j] : 0;
                        scanline.data[j] += above;
                    }
                    break;
                case FilterType.Average:
                    for (let j = 0; j < bytesPerScanline; j++) {
                        const left = j < bytesPerCompletePixel ? 0 : scanline.data[j - bytesPerCompletePixel];
                        const above = i > 0 ? this.scanlines[i - 1].data[j] : 0;
                        const average = Math.floor((left + above) / 2);
                        scanline.data[j] += average;
                    }
                    break;
                case FilterType.Paeth:
                    for (let j = 0; j < bytesPerScanline; j++) {
                        const left = j < bytesPerCompletePixel ? 0 : scanline.data[j - bytesPerCompletePixel];
                        const above = i > 0 ? this.scanlines[i - 1].data[j] : 0;
                        const upperLeft = j < bytesPerCompletePixel || i < 1 ? 0 : this.scanlines[i - 1].data[j - bytesPerCompletePixel];
                        const predictor = left + above - upperLeft;
                        const predictorLeft = Math.abs(predictor - left);
                        const predictorAbove = Math.abs(predictor - above);
                        const predictorUpperLeft = Math.abs(predictor - upperLeft);
                        let nearest = 0;
                        if (predictorLeft <= predictorAbove && predictorLeft <= predictorUpperLeft) {
                            nearest = left;
                        } else if (predictorAbove <= predictorUpperLeft) {
                            nearest = above;
                        } else {
                            nearest = upperLeft;
                        }
                        scanline.data[j] += nearest;
                    }
                    break;
                default:
                    break;
            }
            this.image.addRow(scanline.data);
        }
    }


    draw(canvas: HTMLCanvasElement) {
        if (this.image.height > canvas.height || this.image.width > canvas.width) {
            let newHeight = canvas.height;
            let newWidth = canvas.width;

            if (this.image.height > newHeight) {
                newWidth = Math.floor((this.image.width / this.image.height) * newHeight);
            }

            if (this.image.width > newHeight) {
                newHeight = Math.floor((this.image.height / this.image.width) * newWidth);
            }

            this.image.resize(newHeight, newWidth);
        }

        const ctx = canvas.getContext("2d");

        if (!ctx) throw new Error("Could not get context");

        for (let y = 0; y < this.image.height; y++) {
            for (let x = 0; x < this.image.width; x++) {
                const pixel = this.image.getPixel(x, y);

                ctx.fillStyle = `rgb(${pixel.r},${pixel.g},${pixel.b})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

}

export default PNGDecoder;