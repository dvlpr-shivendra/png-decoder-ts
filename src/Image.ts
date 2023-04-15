type Pixel = {
    r: number
    g: number
    b: number
}

export default class Image {
    height: number
    width: number

    data: Uint8Array[];

    constructor(height: number, width: number, data: Uint8Array[] | undefined = undefined) {
        this.height = height;
        this.width = width;

        if (data) {
            this.data = data;
        } else {
            this.data = [];
        }
    }

    addRow(row: Uint8Array) {
        if (this.data.length === this.height) {
            throw new Error("Number of rows is already equal to the height of the image.");
        }
        this.data.push(row);
    }

    getPixel(x: number, y: number) {
        if (x >= this.width) {
            throw new Error(`x can not be greater or equal to the width, x is ${x}`);
        }

        if (y >= this.width) {
            throw new Error(`x can not be greater or equal to the width, y is ${y}`);
        }

        x = x * 3;

        return {
            r: this.data[y][x],
            g: this.data[y][x + 1],
            b: this.data[y][x + 2],
        };
    }

    setPixel(x: number, y: number, pixel: Pixel) {
        if (x >= this.width) {
            throw new Error(`x can not be greater or equal to the width, x is ${x}`);
        }

        if (y >= this.width) {
            throw new Error(`x can not be greater or equal to the width, y is ${y}`);
        }

        x = x * 3;

        if (!this.data[y]) {
            this.data[y] = new Uint8Array(this.width * 3);
        }

        this.data[y][x] = pixel.r;
        this.data[y][x + 1] = pixel.g;
        this.data[y][x + 2] = pixel.b;
    }

    resize(newHeight: number, newWidth: number) {
        const scaleX: number = newWidth / this.width;
        const scaleY: number = newHeight / this.height;

        const scaledImage = new Image(newHeight, newWidth);

        // Fill in every pixel in the scaled image
        for (let y = 0; y < newHeight; y++) {
            for (let x = 0; x < newWidth; x++) {
                const yNearest: number = Math.floor(y / scaleY);
                const xNearest: number = Math.floor(x / scaleX);

                const pixel: any = this.getPixel(xNearest, yNearest);
                scaledImage.setPixel(x, y, pixel);
            }
        }

        this.data = scaledImage.data;
        this.height = scaledImage.height;
        this.width = scaledImage.width;
    }
}