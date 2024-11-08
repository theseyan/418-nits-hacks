<script>
    import {Timeline, TimelineItem, TimelineSeparator, TimelineDot, TimelineConnector, TimelineContent, TimelineOppositeContent} from 'svelte-vertical-timeline';
    import {Jumper} from 'svelte-loading-spinners';
    import dayjs from 'dayjs';

    export let data;
</script>

{#if data === null}
    <div class="flex justify-center items-center p-4 relative">
        <Jumper size="70" color="#b7a3e5" unit="px" duration="1.5s" />
    </div>
{:else if data === false}
    Could not load timeline due to an error.
{:else}
    <Timeline position={"right"}>
        {#each data as stat}
            <TimelineItem>
                <TimelineOppositeContent></TimelineOppositeContent>
                <TimelineSeparator>
                    <TimelineDot />
                    <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                    <h2 class="time">
                        <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                        </svg>
                        {dayjs.unix(stat.date).format('hh:mm A')}
                    </h2>
                    <p class="text">
                        {stat.summary}
                    </p>
                </TimelineContent>
            </TimelineItem>
        {/each}
    </Timeline>
{/if}