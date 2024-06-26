<script lang="ts">
  import { cn } from "../../../utils/cn.ts";

  export let className: string | undefined = undefined;
  export let containerClassName: string | undefined = undefined;
  export let isMouseEntered = false;
  export let intensity: string = "10, 100";
  export let style: string | undefined = undefined;
  export let id: string | undefined = undefined;

  const [Intx, Inty] = intensity.split(",").map(Number);
  const intensityObject = { x: 100 / Intx, y: 100 / Inty };

  let containerRef: HTMLDivElement;

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef) return;
    containerRef.style.transition = "transform .2s ease-out";
    const { left, top, width, height } = containerRef.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / intensityObject.x;
    const y = (e.clientY - top - height / 2) / intensityObject.y;
    containerRef.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
  };

  const handleMouseEnter = () => {
    isMouseEntered = true;
    if (!containerRef) return;
  };

  const handleMouseLeave = () => {
    if (!containerRef) return;
    isMouseEntered = false;
    containerRef.style.transform = `rotateY(0deg) rotateX(0deg)`;
  };
</script>

<div
  id="main-{id}"
  class={cn("flex items-center justify-center py-20", containerClassName)}
  style="perspective: 1000px; {style ? style : ''}"
>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    bind:this={containerRef}
    on:mouseenter={handleMouseEnter}
    on:mousemove={handleMouseMove}
    on:mouseleave={handleMouseLeave}
    class={cn(
      "relative flex items-center justify-center transition-all duration-200 ease-linear",
      className
    )}
    style="transform-style: preserve-3d;"
    {id}
  >
    <slot />
  </div>
</div>
