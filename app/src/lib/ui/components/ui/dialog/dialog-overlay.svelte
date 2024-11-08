<script>
	import { Dialog as DialogPrimitive } from "bits-ui";
	import { fade } from "svelte/transition";
	import { cn } from "$ui/utils.js";
	let className = undefined;
	export let transition = fade;
	export let transitionConfig = {
		duration: 100,
	};
	export { className as class };
</script>

<DialogPrimitive.Overlay
	{transition}
	{transitionConfig}
	class={cn("bg-foreground/20 fixed inset-0 z-50", className)}
	{...$$restProps}
/>
