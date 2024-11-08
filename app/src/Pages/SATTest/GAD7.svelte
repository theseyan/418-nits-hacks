<script>
    import * as Card from "$ui/components/ui/card";
    import { Label } from "$ui/components/ui/label";
    import * as RadioGroup from "$ui/components/ui/radio-group";
    import { Button } from "$ui/components/ui/button";
    import {Data} from '../../lib';
    import {onMount} from 'svelte';
    import {Sidebar, Header, FeelingBar} from '../../Components';
    import ProgressBar from "@okrad/svelte-progressbar";

    export let params;

    let currentQuestion = 0;
    let answers = [];
    let optionValue;

    // Store result object
    let score = null;
    let maxScore = 21;
    let progressColor = '#000000';
    let progressTextColor = '#000000';
    let resultHeading = "";
    let resultText = "";

    const questions = [
        {
            question: "Feeling nervous, anxious, or on edge."
        },
        {
            question: "Not being able to stop or control worrying."
        },
        {
            question: "Worrying too much about different things."
        },
        {
            question: "Trouble relaxing."
        },
        {
            question: "Being so restless that it's hard to sit still."
        },
        {
            question: "Becoming easily annoyed or irritable."
        },
        {
            question: "Feeling afraid as if something awful might happen."
        },
    ];

    const options = [
        {
            label: "Not at all",
            value: 0
        },
        {
            label: "Several days",
            value: 1
        },
        {
            label: "More than half the days",
            value: 2
        },
        {
            label: "Nearly every day",
            value: 3
        },
    ];

    onMount(async () => {
        document.title = "GAD-7 Anxiety Test — WellWave";
    });

    const nextQuestion = () => {
        if (!optionValue) {
            alert("Please choose an option before continuing.");
            return;
        }

        answers[currentQuestion] = Number(optionValue);

        // This was last question, submit.
        if (currentQuestion + 1 === questions.length) {
            submit(answers);
        }
        // or, Move to next question
        else {
            currentQuestion++;
            
            if (currentQuestion in answers) optionValue = String(answers[currentQuestion]);
            else optionValue = null;
        }
    };

    const previousQuestion = () => {
        if (currentQuestion === 0) {
            // This was the first question, do nothing.
            return;
        } else {
            if (optionValue) answers[currentQuestion] = Number(optionValue);
            currentQuestion--;

            optionValue = String(answers[currentQuestion]);
        }
    };

    const submit = (answers) => {
        score = answers.reduce((a, b) => a + b);

        if (score <= 4) {
            resultHeading = "Minimal anxiety";
            resultText = "Few or no symptoms. No specific action may be required.";
        }
        else if (score <= 9) {
            resultHeading = "Mild anxiety";
            resultText = "Low level of anxiety. Monitoring and self-care may be helpful.";
        }
        else if (score <= 14) {
            resultHeading = "Moderate anxiety";
            resultText = "Noticeable anxiety symptoms. Further assessment and possibly therapeutic intervention are recommended.";
        }
        else if (score <= 21) {
            resultHeading = "Severe anxiety";
            resultText = "Significant anxiety. Professional help is advised.";
        }
        else {
            resultHeading = "Invalid score";
            resultText = "The calculated score was invalid. Please perform the test again.";
        }

        // Save the results
        const savedResults = JSON.parse(localStorage.getItem("418nsh.sats")) ?? [];
        savedResults.unshift({
            date: Math.trunc(Date.now() / 1000),
            type: 'GAD-7 (Anxiety)',
            score: `${score} of ${maxScore}`
        });
        localStorage.setItem("418nsh.sats", JSON.stringify(savedResults));
    };
</script>

<Header />

<div class="body sat">
    <Sidebar />

    <div class="content sb">
        <h1 class="heading">Anxiety (GAD-7)</h1>

        {#if score === null}
            <Card.Root class="flex-initial">
                <Card.Header>
                    <Card.Title>{questions[currentQuestion].question}</Card.Title>
                    <Card.Description>{currentQuestion + 1} of {questions.length} questions</Card.Description>
                </Card.Header>
                <Card.Content>
                    <RadioGroup.Root bind:value={optionValue} on:change>
                        {#each options as option}
                            <div class="flex items-center space-x-2">
                                <RadioGroup.Item value="{String(option.value)}" id="opt-{option.value}" />
                                <Label for="opt-{option.value}">{option.label}</Label>
                            </div>
                        {/each}
                    </RadioGroup.Root>
                </Card.Content>
                <Card.Footer>
                    <Button disabled={currentQuestion === 0} on:click={previousQuestion}>Previous</Button>
                    <Button class="ml-4" on:click={nextQuestion}>{currentQuestion + 1 === questions.length ? "Submit" : "Next"}</Button>
                </Card.Footer>
            </Card.Root>
        {:else}
            <div class="flex gap-8">
                <div class="flex-initial w-1/5">
                    <ProgressBar series={[{perc: (score / maxScore) * 100, color: progressColor}]} valueLabel={score + " of " + maxScore} style="radial" labelColor={progressTextColor} cls="text-2xl font-medium" bgColor="#ffffff40" thickness={3} />
                </div>

                <Card.Root class="flex-1">
                    <Card.Header>
                        <Card.Title>Your Assessment Result</Card.Title>
                        <Card.Description>View your score for this self-assessed test.</Card.Description>
                    </Card.Header>
                    <Card.Content>
                        <h1 class="text-2xl font-medium">{resultHeading}</h1>
                        <p class="text-base font-medium">{resultText}</p>
                    </Card.Content>
                    <Card.Footer>
                        <Button href="#/sat">Return to Self Assessment Tests</Button>
                    </Card.Footer>
                </Card.Root>
            </div>
        {/if}
    </div>
</div>

<FeelingBar />