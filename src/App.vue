<template>
  <div class="container">
    <h1>World's best PNG decoder</h1>

    <canvas ref="canvas" height="320" width="640"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, type Ref } from "vue";
import PNGDecoder from "./PNGDecoder";

type CanvasRef = HTMLCanvasElement | null;
const canvas: Ref<CanvasRef> = ref(null)

const image = new URLSearchParams(window.location.search).get('image');


fetch(`http://localhost:5173/PNGs/${image}.png`)
  .then(response => response.blob())
  .then(data => data.arrayBuffer())
  .then(buffer => {
    const data = new Uint8Array(buffer);
    const decoder = new PNGDecoder(data);
    decoder.decodeBitmap();

    if (!canvas.value) return;

    decoder.draw(canvas.value);
  });
</script>
