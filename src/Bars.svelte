<script>
  import { Tween } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import { interpolate } from "d3-interpolate";

  let { x, value, yScale, width, height, marginBottom, fill, i } = $props();

  const tY = new Tween(0, {
    duration: 600,
    easing: cubicOut,
    interpolate,
    delay: i * 2,
  });

  $effect(() => {
    tY.target = value;
  });
</script>

<rect
  {x}
  y={yScale(tY.current)}
  {width}
  height={height - marginBottom - yScale(tY.current)}
  {fill}
/>
