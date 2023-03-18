<template>
  <div class="container">
    <h1>World's best PNG decoder</h1>
  </div>
</template>

<script setup lang="ts">
import PNGDecoder from "./PNGDecoder";
fetch('http://localhost:5173/PNGs/1x1.png')
  .then(response => response.blob())
  .then(data => data.arrayBuffer())
  .then(buffer => {
    const data = new Uint8Array(buffer);
    const decoder = new PNGDecoder(data);
    decoder.decodeBitmap();
  });
</script>
