<script>
  import { Tween } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import { interpolate } from "d3-interpolate";

  let { x, value, yScale, width, height, marginBottom, fill, i, year } = $props();

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
  role="img"
  aria-label={`timeline bar for year ${year}`}
  {x}
  y={yScale(tY.current)}
  {width}
  height={height - marginBottom - yScale(tY.current)}
  {fill}
>
  <title>{year}</title>
</rect>
