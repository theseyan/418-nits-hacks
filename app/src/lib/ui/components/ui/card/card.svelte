<script>
	import { cn } from "$ui/utils.js";
	let className = undefined;
	export { className as class };
</script>

<div
	class={cn("bg-card bg-opacity-20 text-card-foreground rounded-lg shadow-sm", className)}
	{...$$restProps}
>
	<slot />
</div>
