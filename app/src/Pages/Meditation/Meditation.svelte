<script>
    import * as Card from "$ui/components/ui/card";
    import * as Accordion from "$ui/components/ui/accordion";
    import {onMount} from 'svelte';
    import { fade } from 'svelte/transition';
    import {push} from 'svelte-spa-router';
    import dayjs from 'dayjs';
    import duration from 'dayjs/plugin/duration';
    import {Sidebar, Header, FeelingBar} from '../../Components';

    const DEFAULT_TIMER = 5 * 60; // 5 minutes timer by default

    const BG_IMAGES = [
        "/images/meditation/wallpaper-1.jpg",
        "/images/meditation/wallpaper-2.jpg",
        "/images/meditation/wallpaper-3.jpg",
        "/images/meditation/wallpaper-4.jpg"
    ];

    const BG_AUDIO = [
        {
            src: "/audio/meditation/sound-1.mp3",
            title: "Autumn Sky Meditation",
            author: "NaturesEye"
        },
        {
            src: "/audio/meditation/sound-2.mp3",
            title: "Deep Serene Meditation",
            author: "Grand Project"
        },
        {
            src: "/audio/meditation/sound-3.mp3",
            title: "Relaxing soul Meditation",
            author: "DanaMusic"
        },
        {
            src: "/audio/meditation/sound-4.mp3",
            title: "The Old Water Mill Meditation",
            author: "NaturesEye"
        },
    ];

    dayjs.extend(duration);

    export let params;
    let session = null;
    let time = DEFAULT_TIMER;
    let timeString = '00:00';
    let paused = true;
    let timer = null;
    let audioElement;
    
    // A randomized choice from the list
    const CHOICE = Math.floor(Math.random() * (BG_AUDIO.length));

    // Update time string when time changes
    $: timeString = dayjs.duration(time * 1000).format('m:ss');

    // Countdown timer
    $: if (paused === false) {
        if (timer === null) timer = setInterval(() => {
            if (time <= 0) {
                paused = true;
                audioElement.currentTime = 0;
            } else {
                time--;
            }
        }, 1000);
    } else {
        clearInterval(timer);
        timer = null;
    }

    // Audio
    $: if (paused === false && audioElement) {
        audioElement.play();
    } else if (paused === true && audioElement) {
        audioElement.pause();
    }

    // Updates the timer
    const updateTime = (num) => {
        if (time + num <= 0) time = 0;
        else time += num;
    };

    onMount(() => {
        document.title = "Meditate — WellWave"
    });

    $: if (params.type && params.type === 'session') {
        session = true;
        time = DEFAULT_TIMER;
        paused = true;
    } else {
        session = null;
    }
</script>

{#if session === null}
    <Header />

    <div class="body meditation">
        <Sidebar />

        <div class="content sb">
            <h1 class="heading">Meditate</h1>

            <a href="#/meditation/session" class="meditate-action-box">
                Start Session
            </a>

            <div class="flex my-8">
                <Card.Root class="flex-1">
                    <Card.Header>
                        <Card.Title>FAQs on Meditation</Card.Title>
                        <Card.Description>Learn why it's important for you.</Card.Description>
                    </Card.Header>
                    <Card.Content>
                        <Accordion.Root>
                            <Accordion.Item value="q1" class="border-gray-300">
                                <Accordion.Trigger>What is meditation?</Accordion.Trigger>
                                <Accordion.Content>
                                    Meditation is a mental exercise that involves focusing your attention, often on your breath, a word,
                                    or an object, to achieve a state of mental clarity, emotional calmness, and deep relaxation.
                                    <br /><br />
                                    It's a simple but powerful way to <b>reduce stress, improve focus, and cultivate mindfulness in daily life</b>.
                                </Accordion.Content>
                            </Accordion.Item>
                            <Accordion.Item value="q2" class="border-gray-300">
                                <Accordion.Trigger>How often should I meditate?</Accordion.Trigger>
                                <Accordion.Content>
                                    For beginners, starting with 5-10 minutes daily is a great way to build consistency without feeling overwhelmed.
                                    Over time, you can gradually increase your session length as your comfort and focus improve.
                                    <br /><br />
                                    The key is <b>regularity rather than length</b>, so try to practice every day.
                                </Accordion.Content>
                            </Accordion.Item>
                            <Accordion.Item value="q3" class="border-gray-300">
                                <Accordion.Trigger>Can meditation help reduce stress?</Accordion.Trigger>
                                <Accordion.Content>
                                    Yes, meditation is widely known for its ability to reduce stress.
                                    <br />
                                    By focusing on the present moment and allowing the mind to relax, <b>meditation can lower cortisol levels (the stress hormone)
                                    and help you manage anxiety more effectively</b>. Over time, it promotes a more balanced emotional state.
                                </Accordion.Content>
                            </Accordion.Item>
                        </Accordion.Root>
                    </Card.Content>
                </Card.Root>
            </div>
        </div>
    </div>

    <FeelingBar />
{:else}
    <div class="meditate-root" style="background-image: url('{BG_IMAGES[CHOICE]}')" transition:fade={{ duration: 300 }}>
        <div class="meditate-header">
            <a href="#/meditation" class="exit">
                <svg class="w-6 h-6 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12l4-4m-4 4 4 4"/>
                </svg>                  
                Exit Session
            </a>
        </div>
        <div class="content">
            <div class="timer">
                <h1 class="count">{timeString}</h1>
                
                <div class="buttons">
                    <button on:click={() => updateTime(60)}>
                        <svg class="w-6 h-6 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7 7V5"/>
                        </svg>                          
                    </button>
                    <button on:click={() => {paused = !paused}} style="background-color: #a35fdc;">
                        {#if paused === true}
                            <svg class="w-6 h-6 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                <path fill-rule="evenodd" d="M8.6 5.2A1 1 0 0 0 7 6v12a1 1 0 0 0 1.6.8l8-6a1 1 0 0 0 0-1.6l-8-6Z" clip-rule="evenodd"/>
                            </svg>               
                        {:else}
                            <svg class="w-6 h-6 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                <path fill-rule="evenodd" d="M8 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H8Zm7 0a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1Z" clip-rule="evenodd"/>
                            </svg>                          
                        {/if}
                    </button>
                    <button on:click={() => updateTime(-60)}>
                        <svg class="w-6 h-6 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"/>
                        </svg>                          
                    </button>
                </div>
            </div>
        </div>
        <div class="footer">
            <h1 class="title">{BG_AUDIO[CHOICE].title}</h1>
            <h2 class="subtitle">By {BG_AUDIO[CHOICE].author}</h2>
        </div>
        <audio bind:this={audioElement} loop src="{BG_AUDIO[CHOICE].src}"></audio>
    </div>
{/if}