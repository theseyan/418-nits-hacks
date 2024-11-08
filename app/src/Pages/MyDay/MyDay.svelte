<script>
    import * as Card from "$ui/components/ui/card";
    import {onMount} from 'svelte';
    import dayjs from "dayjs";

    import {Sidebar, Header, FeelingBar} from '../../Components';
    import {Data} from '../../lib';
    import DayTimeline from "./DayTimeline.svelte";

    // Data
    let todayAnalysis = null;
    let bestMoodTime, worstMoodTime;
    let noData = false;

    onMount(async () => {
        document.title = "My Day — WellWave";

        try {
            todayAnalysis = await Data.getTodayDayAnalysis();

            // Check if no data for today
            if (todayAnalysis === null) {
                noData = true;
                return;
            }

            // Calculate best and worst mood timings
            bestMoodTime = todayAnalysis.data.sort((a, b) => b.mood - a.mood)[0].date;
            worstMoodTime = todayAnalysis.data.sort((a, b) => a.mood - b.mood)[0].date;

            bestMoodTime = dayjs.unix(bestMoodTime).format('hh:mm A');
            worstMoodTime = dayjs.unix(worstMoodTime).format('hh:mm A');

            // Sort the data by time
            todayAnalysis.data = todayAnalysis.data.sort((a, b) => b.date - a.date);
        } catch (e) {
            console.error(e);
            todayAnalysis = false;
        }
    });
</script>

<Header />

<div class="body myday">
    <Sidebar />

    <div class="content sb">
        <h1 class="heading">My Day</h1>

        {#if noData === false}
            <div class="day-timeline mb-4">
                <DayTimeline data={todayAnalysis ? todayAnalysis.data : null} />
            </div>

            {#if todayAnalysis}
                <div class="flex gap-4">
                    <Card.Root class="flex-initial">
                        <Card.Header>
                            <Card.Title>Best Overall Mood</Card.Title>
                            <Card.Description>You were feeling best during this time.</Card.Description>
                        </Card.Header>
                        <Card.Content class="text-center">
                            <h1 class="font-semibold text-emerald-600">{bestMoodTime}</h1>
                        </Card.Content>
                    </Card.Root>
                    <Card.Root class="flex-initial">
                        <Card.Header>
                            <Card.Title>Worst Overall Mood</Card.Title>
                            <Card.Description>You were at your worst during this time.</Card.Description>
                        </Card.Header>
                        <Card.Content class="text-center">
                            <h1 class="font-semibold text-amber-600">{worstMoodTime}</h1>
                        </Card.Content>
                    </Card.Root>
                </div>

                <div class="flex gap-4 my-4">
                    <Card.Root class="flex-1">
                        <Card.Header>
                            <Card.Title>Summary of the Day</Card.Title>
                            <Card.Description>Reflect on your day.</Card.Description>
                        </Card.Header>
                        <Card.Content>
                            <p class="font-medium text-sm">
                                {todayAnalysis.summary}
                            </p>
                        </Card.Content>
                    </Card.Root>
                    <Card.Root class="flex-1">
                        <Card.Header>
                            <Card.Title>Feedback</Card.Title>
                            <Card.Description>Get insights into your day.</Card.Description>
                        </Card.Header>
                        <Card.Content>
                            <p class="font-medium text-sm">
                                {todayAnalysis.feedback}
                            </p>
                        </Card.Content>
                    </Card.Root>
                </div>
            {:else if todayAnalysis === false}
                Could not load Day analysis due to an error. Please reload the page.
            {/if}
        {:else}
            <div class="page-notif flex items-center justify-center p-8 flex-col">
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21a9 9 0 0 1-.5-17.986V3c-.354.966-.5 1.911-.5 3a9 9 0 0 0 9 9c.239 0 .254.018.488 0A9.004 9.004 0 0 1 12 21Z"/>
                </svg>
                <h1>Nothing here... yet</h1>
            </div>
        {/if}
    </div>
</div>

<FeelingBar />