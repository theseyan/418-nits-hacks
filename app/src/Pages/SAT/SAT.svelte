<script>
    import * as Card from "$ui/components/ui/card";
    import * as Accordion from "$ui/components/ui/accordion";
    import { Button } from "$ui/components/ui/button";
    import * as Table from "$ui/components/ui/table";
    import {onMount} from 'svelte';
    import dayjs from 'dayjs';
    import {Sidebar, Header, FeelingBar} from '../../Components';

    let testHistory = [];

    onMount(() => {
        document.title = "Self Assessment Tests — WellWave";

        // Load test history
        testHistory = JSON.parse(localStorage.getItem('418nsh.sats')) ?? [];
    })
</script>

<Header />

<div class="body sat">
    <Sidebar />

    <div class="content sb">
        <h1 class="heading">Self Assessment Tests</h1>

        <div class="flex gap-4 mb-4">
            <Card.Root class="flex-1 border-t-4 border-green-600">
                <Card.Header>
                    <Card.Title>Anxiety</Card.Title>
                    <Card.Description class="font-medium">GAD-7 is a brief self report questionnaire used for measuring the severity of generalized anxiety disorder (GAD).</Card.Description>
                </Card.Header>
                <Card.Content>
                    <div class="flex items-center p-4">
                        <div class="flex-1 text-center">
                            <h1>
                                <span class="block text-xl font-medium">7</span>
                                <span class="uppercase text-xs font-medium text-gray-600">Questions</span>
                            </h1>
                        </div>
                        <div class="flex-1 text-center">
                            <h1 class="text-sm">
                                <span class="block text-xl font-medium">5-7</span>
                                <span class="uppercase text-xs font-medium text-gray-600">Minutes</span>
                            </h1>
                        </div>
                    </div>
                </Card.Content>
                <Card.Footer class="justify-center">
                    <Button href="#/sat/gad-7">Take Test</Button>
                </Card.Footer>
            </Card.Root>

            <Card.Root class="flex-1 border-t-4 border-amber-600">
                <Card.Header>
                    <Card.Title>Depression</Card.Title>
                    <Card.Description class="font-medium">PHQ-9 (Patient Health Questionnaire-9) is a widely used tool for screening, diagnosing, and measuring the severity of depression.</Card.Description>
                </Card.Header>
                <Card.Content>
                    <div class="flex items-center p-4">
                        <div class="flex-1 text-center">
                            <h1>
                                <span class="block text-xl font-medium">9</span>
                                <span class="uppercase text-xs font-medium text-gray-600">Questions</span>
                            </h1>
                        </div>
                        <div class="flex-1 text-center">
                            <h1 class="text-sm">
                                <span class="block text-xl font-medium">5-10</span>
                                <span class="uppercase text-xs font-medium text-gray-600">Minutes</span>
                            </h1>
                        </div>
                    </div>
                </Card.Content>
                <Card.Footer class="justify-center">
                    <Button href="#/sat/phq-9">Take Test</Button>
                </Card.Footer>
            </Card.Root>

            <Card.Root class="flex-1 border-t-4 border-blue-600">
                <Card.Header>
                    <Card.Title>Loneliness</Card.Title>
                    <Card.Description class="font-medium"> The UCLA Loneliness Scale is designed to assess an individual's subjective feelings of loneliness and social isolation.</Card.Description>
                </Card.Header>
                <Card.Content>
                    <div class="flex items-center p-4">
                        <div class="flex-1 text-center">
                            <h1>
                                <span class="block text-xl font-medium">20</span>
                                <span class="uppercase text-xs font-medium text-gray-600">Questions</span>
                            </h1>
                        </div>
                        <div class="flex-1 text-center">
                            <h1 class="text-sm">
                                <span class="block text-xl font-medium">5-10</span>
                                <span class="uppercase text-xs font-medium text-gray-600">Minutes</span>
                            </h1>
                        </div>
                    </div>
                </Card.Content>
                <Card.Footer class="justify-center">
                    <Button href="#/sat/ucla">Take Test</Button>
                </Card.Footer>
            </Card.Root>
        </div>
        
        <Card.Root class="mb-4">
            <Card.Header>
                <Card.Title>Test History</Card.Title>
                <Card.Description>Private to you.</Card.Description>
            </Card.Header>
            <Card.Content>
                {#if testHistory.length > 0}
                <Table.Root>
                    <Table.Header>
                      <Table.Row class="border-gray-300">
                        <Table.Head class="w-[250px]">Date</Table.Head>
                        <Table.Head>Type</Table.Head>
                        <Table.Head>Score</Table.Head>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {#each testHistory as testResult}
                      <Table.Row class="border-gray-300">
                        <Table.Cell class="font-medium">{dayjs.unix(testResult.date).format("MMM D, H:mm a")}</Table.Cell>
                        <Table.Cell>{testResult.type}</Table.Cell>
                        <Table.Cell>{testResult.score}</Table.Cell>
                      </Table.Row>
                      {/each}
                    </Table.Body>
                  </Table.Root>
                  {:else}
                    No history to show yet.
                  {/if}
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Header>
                <Card.Title>Frequently Asked Questions</Card.Title>
                <Card.Description>FAQs on Self Assessment Tests.</Card.Description>
            </Card.Header>
            <Card.Content>
                <Accordion.Root>
                    <Accordion.Item value="q1" class="border-gray-300">
                        <Accordion.Trigger>Who should take these tests?</Accordion.Trigger>
                        <Accordion.Content>
                            These tests are suitable for anyone who suspects they may be experiencing symptoms of anxiety, depression, loneliness, etc.
                            They are often used by healthcare providers during assessments but can also be taken independently for self-awareness.
                            <br /><br />
                            While these tests can provide insight into your mental health, <b>they are not diagnostic tools</b>.
                            They should not be used to self-diagnose. If your scores indicate moderate to severe symptoms,
                            it's important to seek advice from a healthcare professional.
                        </Accordion.Content>
                    </Accordion.Item>
                    <Accordion.Item value="q2" class="border-gray-300">
                        <Accordion.Trigger>How often should I take these tests?</Accordion.Trigger>
                        <Accordion.Content>
                            There is no strict rule for how often you should take these tests.
                            However, if you are tracking your mental health over time, you might take them periodically
                            (e.g., weekly or monthly) to monitor changes in your symptoms and scores.
                        </Accordion.Content>
                    </Accordion.Item>
                    <Accordion.Item value="q3" class="border-gray-300">
                        <Accordion.Trigger>Are these tests confidential?</Accordion.Trigger>
                        <Accordion.Content>
                            <b>Your test scores and data are completely confidential and never sent to our servers.</b>
                            We take privacy seriously and ensure assessment data never leaves your device.
                            <br /><br />
                            Since you take these tests independently, it's up to you to decide who you share your results with.
                        </Accordion.Content>
                    </Accordion.Item>
                </Accordion.Root>
            </Card.Content>
        </Card.Root>
    </div>
</div>

<FeelingBar />