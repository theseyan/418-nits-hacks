<script>
    import * as Card from "$ui/components/ui/card";
    import {onMount} from 'svelte';
    import {Sidebar, Header, FeelingBar} from '../../Components';

    onMount(() => {
        document.title = "About — WellWave"
    });
</script>

<Header />

<div class="body about">
    <Sidebar />

    <div class="content sb">
        <h1 class="heading">About</h1>

        <div class="font-medium">
            Presenting WellWave, our solution to the glaring issue of mental health wellbeing all around the world.
            Prototype for PS 3 (Open Innovation) of NITS Hacks 7.0.
            <br /><br />
            Developed by Team "418 I'm A Teapot" representing NIT Agartala, consisting of:
            <ul class="list-disc mx-4">
                <li><b>Sayan Jyoti Das</b> (CSE '27)</li>
                <li><b>Abhishek Sakhare</b> (CE '27)</li>
                <li><b>Parag Debnath</b> (CSE '27)</li>
            </ul>
        </div>
    </div>
</div>

<FeelingBar />