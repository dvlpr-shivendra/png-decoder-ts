export default class Streamer {
    private data: Uint8Array;

    constructor(data: Uint8Array) {
        this.data = data;
    }

    readByte() {
        if (this.data.length === 0) throw new Error("No more data");

        const value = this.data[0];

        this.data = this.data.slice(1, this.data.length);

        return value;
    }

    readBytes(count: number = -1) {
        if (this.data.length < count) throw new Error("Not enough data");

        if (count === -1) {
            count = this.data.length;
        }

        const bytes = this.data.slice(0, count);

        this.data = this.data.slice(count, this.data.length);

        return bytes;
    }

    get atEnd() {
        return this.data.length === 0;
    }

    readInt32() {
        return new DataView(this.readBytes(4).buffer).getInt32(0);
    }

    readString(bytesCount: number = -1) {
        if (bytesCount === -1) {
            bytesCount = this.data.length;
        }
        return new TextDecoder().decode(this.readBytes(bytesCount));
    }
}