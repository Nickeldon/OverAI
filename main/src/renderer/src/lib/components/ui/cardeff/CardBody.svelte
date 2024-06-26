<script lang="ts">
	import { cn } from '../../../utils/cn.ts';

	export let className: string;
	export let style: string | undefined = undefined;
	export let id: string | undefined = undefined;

</script>

<div style="{style ? style : ''}"
	class={cn(
		'h-96 w-96 [transform-style:preserve-3d]  [&>*]:[transform-style:preserve-3d]',
		className
	)}
	id={id}
>
	<slot />
</div>