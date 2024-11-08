<script>
    import * as Card from "$ui/components/ui/card";
    import { Label } from "$ui/components/ui/label";
    import * as RadioGroup from "$ui/components/ui/radio-group";
    import { Button } from "$ui/components/ui/button";
    import {onMount} from 'svelte';
    import {Sidebar, Header, FeelingBar} from '../../Components';
    import ProgressBar from "@okrad/svelte-progressbar";

    export let params;

    let currentQuestion = 0;
    let answers = [];
    let optionValue;

    // Store result object
    let score = null;
    let maxScore = 80;
    let progressColor = '#000000';
    let progressTextColor = '#000000';
    let resultHeading = "";
    let resultText = "";

    const reverseScored = [0, 4, 5, 8, 9, 14, 15, 18, 19];

    const questions = [
        {
            question: "I feel in tune with the people around me."
        },
        {
            question: "I lack companionship."
        },
        {
            question: "There is no one I can turn to."
        },
        {
            question: "I do not feel alone."
        },
        {
            question: "I feel part of a group of friends."
        },
        {
            question: "I have a lot in common with the people around me."
        },
        {
            question: "I am no longer close to anyone."
        },
        {
            question: "My interests and ideas are not shared by those around me."
        },
        {
            question: "I am an outgoing person."
        },
        {
            question: "There are people I feel close to."
        },
        {
            question: "I feel left out."
        },
        {
            question: "My social relationships are superficial."
        },
        {
            question: "No one really knows me well."
        },
        {
            question: "I feel isolated from others."
        },
        {
            question: "I can find companionship when I want it."
        },
        {
            question: "There are people who really understand me."
        },
        {
            question: "I am unhappy being so withdrawn."
        },
        {
            question: "People are around me but not with me."
        },
        {
            question: "There are people I can talk to."
        },
        {
            question: "There are people I can turn to."
        }
    ];

    const options = [
        {
            label: "Never",
            value: 1
        },
        {
            label: "Rarely",
            value: 2
        },
        {
            label: "Sometimes",
            value: 3
        },
        {
            label: "Often",
            value: 4
        },
    ];

    onMount(() => {
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

        console.log(answers);
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
        let sum = 0;

        for (let i=0; i<answers.length; i++) {
            if (reverseScored.indexOf(i) !== -1) {
                sum += 4 - answers[i] + 1;
            } else {
                sum += answers[i];
            }
        }

        score = sum;

        if (score < 20 || score > 80) {
            resultHeading = "Invalid score";
            resultText = "The calculated score was invalid. Please perform the test again.";
        } else {
            resultHeading = "Loneliness";
            resultText = "Higher score indicates a higher degree of loneliness. You have a loneliness measurement of " + (Math.trunc((score / 80) * 100)) +"%."
        }

        // Save the results
        const savedResults = JSON.parse(localStorage.getItem("418nsh.sats")) ?? [];
        savedResults.unshift({
            date: Math.trunc(Date.now() / 1000),
            type: 'UCLA (Loneliness)',
            score: `${score} of ${maxScore}`
        });
        localStorage.setItem("418nsh.sats", JSON.stringify(savedResults));
    };
</script>

<Header />

<div class="body sat">
    <Sidebar />

    <div class="content sb">
        <h1 class="heading">Loneliness (UCLA Scale)</h1>

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