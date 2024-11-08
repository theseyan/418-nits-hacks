<script>
    import * as Card from "$ui/components/ui/card";
    import * as Accordion from "$ui/components/ui/accordion";
    import {onMount} from 'svelte';

    import {Sidebar, Header, FeelingBar, MoodRating} from '../../Components';
    import {currentUser} from '../../lib/Auth';
    import TodayAnalysisChart from "./TodayAnalysisChart.svelte";
    import {Data} from '../../lib';

    let todayData = null;
    let todayMood = null;

    onMount(async () => {
        document.title = "Home — WellWave";

        try {
            todayData = await Data.fetchTodayAnalyses();

            // Calculate overall mood today
            let overallMood = 0;
            for (const analysis of todayData) {
                overallMood += analysis.mood;
            }
            overallMood /= todayData.length;
            todayMood = Math.round(overallMood);
        } catch (e) {
            console.error(e);
            todayData = false;
        }
    });
</script>

<Header />

<div class="body home">
    <Sidebar />

    <div class="content sb">
        <h1 class="heading">Hello, {$currentUser.fullName.split(" ")[0]}.</h1>

        <div class="flex gap-4">
            <Card.Root class="flex-initial overall-mood">
                <Card.Header>
                    <Card.Title>My Mood</Card.Title>
                    <Card.Description>Your overall mood today.</Card.Description>
                </Card.Header>
                <Card.Content class="text-center relative">
                    <MoodRating mood={todayMood} data={todayData} />
                </Card.Content>
            </Card.Root>
            <Card.Root class="flex-1">
                <Card.Header>
                    <Card.Title>Mood over time</Card.Title>
                    <Card.Description>Visualize your mood changes today.</Card.Description>
                </Card.Header>
                <Card.Content class="relative">
                    <TodayAnalysisChart data={todayData} />
                </Card.Content>
            </Card.Root>
        </div>

        <div class="flex gap-4 my-4">
            <Card.Root class="flex-1">
                <Card.Header>
                    <Card.Title>Frequently Asked Questions</Card.Title>
                    <Card.Description>Get up to speed with FAQs.</Card.Description>
                </Card.Header>
                <Card.Content>
                    <Accordion.Root>
                        <Accordion.Item value="q1" class="border-gray-300">
                            <Accordion.Trigger>What is this data?</Accordion.Trigger>
                            <Accordion.Content>
                                <b>My Mood:</b> Displays your average mood over the current day on a scale of 0 to 100, where a score nearing
                                0 indicates negative emotions and a score nearing 100 indicates positive emotions.
                                <br /><br />
                                <b>Mood over time:</b> Chart visualizes the changes in your happiness and anxiety throughout the day. We believe
                                these emotions are useful to track and understand for better awareness.
                            </Accordion.Content>
                        </Accordion.Item>
                        <Accordion.Item value="q2" class="border-gray-300">
                            <Accordion.Trigger>Can I test myself for Depression, Anxiety, etc.?</Accordion.Trigger>
                            <Accordion.Content>
                                Yes! We have comprehensive <a href="#/sat" class="link">Self-Assessment Tests</a> built in which you can take anytime to find out your
                                score. All of our tests are widely accepted standard SATs used by real psychologists in the field.
                            </Accordion.Content>
                        </Accordion.Item>
                        <Accordion.Item value="q3" class="border-gray-300">
                            <Accordion.Trigger>What about Privacy?</Accordion.Trigger>
                            <Accordion.Content>
                                <b>We care about your privacy.</b> Data is only stored on our servers with strict isolation and GDPR compliance.
                                Personality and emotion data is anonymized before being sent to any external service, making it impossible
                                to track them back to any user.
                            </Accordion.Content>
                        </Accordion.Item>
                    </Accordion.Root>
                </Card.Content>
            </Card.Root>
            <Card.Root class="flex-initial h-fit quick-links">
                <Card.Header>
                    <Card.Title>Quick Links</Card.Title>
                    <Card.Description>Go where you want to.</Card.Description>
                </Card.Header>
                <Card.Content>
                    <a href="#/myday" class="link">View My Day</a>
                    <a href="#/meditation" class="link">Meditate with Music</a>
                    <a href="#/sat" class="link">Take a Self-Assessment Test</a>
                    <a href="#/about" class="link">About us</a>
                </Card.Content>
            </Card.Root>
        </div>
    </div>
</div>

<FeelingBar />