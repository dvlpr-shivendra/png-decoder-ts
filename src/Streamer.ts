export default class Streamer {
    private data: Uint8Array;

    constructor(data: Uint8Array) {
        this.data = data;
    }

    read() {
        if (this.data.length === 0) throw new Error("No more data");

        const value = this.data[0];

        this.data = this.data.slice(1, this.data.length);

        return value;
    }

    readBytes(count: number) {
        if (this.data.length < count) throw new Error("Not enough data");

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

    readString(bytesCount: number) {
        return new TextDecoder().decode(this.readBytes(bytesCount));
    }
}