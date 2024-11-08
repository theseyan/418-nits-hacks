<script>
    import { Line } from 'svelte-chartjs';
    import {Chart as ChartJS, Title, Tooltip, Legend, LineElement, LinearScale, PointElement, CategoryScale, TimeScale} from 'chart.js';
    import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm';
    import {onMount, tick} from 'svelte';
    import {Jumper} from 'svelte-loading-spinners';
    import dayjs from 'dayjs';

    export let data;
    let chartRef;

    // Register components
    ChartJS.register(
        Title,
        Tooltip,
        Legend,
        LineElement,
        LinearScale,
        PointElement,
        CategoryScale,
        TimeScale
    );

    // Define scales
    const scales = {
        x: {
            type: 'time',
            ticks: {
                source: 'labels',
            },
            time: {
                minUnit: 'minute',
                displayFormats: {
                    minute: "HH",
                }
            }
        },
        y: {
            min: 0,
            max: 100
        }
    };

    // Data
    let chartData = {
        labels: [
            dayjs().startOf('day').add(0, 'hours').toDate(),
            dayjs().startOf('day').add(3, 'hours').toDate(),
            dayjs().startOf('day').add(6, 'hours').toDate(),
            dayjs().startOf('day').add(9, 'hours').toDate(),
            dayjs().startOf('day').add(12, 'hours').toDate(),
            dayjs().startOf('day').add(15, 'hours').toDate(),
            dayjs().startOf('day').add(18, 'hours').toDate(),
            dayjs().startOf('day').add(21, 'hours').toDate(),
        ],
        datasets: [
            {
                label: 'Happiness',
                // fill: true,
                lineTension: 0.1,
                backgroundColor: 'rgba(184, 185, 210, .3)',
                borderColor: 'rgb(35, 26, 136)',
                // borderCapStyle: 'butt',
                // borderDash: [],
                borderDashOffset: 0.0,
                // borderJoinStyle: 'miter',
                pointBorderColor: 'rgb(35, 26, 136)',
                pointBackgroundColor: 'rgb(255, 255, 255)',
                pointBorderWidth: 8,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: 'rgb(0, 0, 0)',
                pointHoverBorderColor: 'rgba(220, 220, 220, 1)',
                pointHoverBorderWidth: 2,
                pointRadius: 1,
                pointHitRadius: 10,
                data: [],
            },
            {
                label: 'Anxiety',
                fill: true,
                lineTension: 0.1,
                backgroundColor: 'rgba(225, 204,230, .3)',
                borderColor: 'rgb(205, 130, 158)',
                borderCapStyle: 'butt',
                borderDash: [],
                borderDashOffset: 0.0,
                borderJoinStyle: 'miter',
                pointBorderColor: 'rgb(205, 130,1 58)',
                pointBackgroundColor: 'rgb(255, 255, 255)',
                pointBorderWidth: 8,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: 'rgb(0, 0, 0)',
                pointHoverBorderColor: 'rgba(220, 220, 220,1)',
                pointHoverBorderWidth: 2,
                pointRadius: 1,
                pointHitRadius: 10,
                data: [],
            }
        ],
    };

    $: if (data !== null && data !== false && chartData.datasets[0].data.length === 0) {
        let unsortedHappiness = [];
        let unsortedAnxiety = [];

        for (const analysis of data) {
            // Happiness
            unsortedHappiness.push({
                x: new Date(analysis.date * 1000),
                y: analysis.happiness
            });

            // Anxiety
            unsortedAnxiety.push({
                x: new Date(analysis.date * 1000),
                y: analysis.anxiety
            });
        }

        // Sort the data by time, in ascending order
        unsortedHappiness.sort((a, b) => b.x.getTime() - a.x.getTime());
        unsortedAnxiety.sort((a, b) => b.x.getTime() - a.x.getTime());

        // Set data
        chartData.datasets[0].data = unsortedHappiness;
        chartData.datasets[1].data = unsortedAnxiety;

        // Update chart
        if (chartRef) tick().then(chartRef.update);
    }
</script>

{#if data !== null && data !== false}
    <Line bind:chart={chartRef} data={chartData} height={60} options={{ responsive: true, scales: scales, maintainAspectRatio: true }} />
{:else if data === false}
    <div class="flex justify-center items-center p-4">
        Could not load due to an error.
    </div>
{:else if data === null}
    <div class="flex justify-center items-center p-4">
        <Jumper size="70" color="#b7a3e5" unit="px" duration="1.5s" />
    </div>
{/if}