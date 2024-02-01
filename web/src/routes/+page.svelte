<Hero />

<section class="page">
    <TextHeader>How the game works</TextHeader>
    <p>
        <Animated delay="0.2s">You buy RAM using EOS.</Animated>
        <Animated delay="0.3s">You use that RAM to store a seed in the contract.</Animated>
        <Animated delay="0.4s">In return you get a game ticket.</Animated>
        <Animated delay="0.5s">Once everyone is ready, you get a random number for each ticket.</Animated>
        <Animated delay="0.6s">You get back a percentage of the rewards based on your total.</Animated>
    </p>

    <figure class="h-[400px]"></figure>

    {#if !$loaded}
        <figure class="text-xl text-center text-white">
            Loading
        </figure>
    {:else}
        <TextHeader>Choose a round</TextHeader>
        <section id="rounds" class="rounds">
            {#each [...Array($totalRounds).keys()].map(x => x+1) as round}
                <Animated delay={0.05*round+'s'}>
                    <Button square blue={round !== $currentRound} on:click={() => selectRound(round)}>{round}</Button>
                </Animated>
            {/each}
        </section>

        <figure class="h-[300px]"></figure>

        <Animated>
            <GameBox />
        </Animated>
    {/if}


</section>

<script lang="ts">
    import { onMount } from 'svelte';
    import Hero from "../components/Hero.svelte";
    import TextHeader from "../components/TextHeader.svelte";
    import Animated from "../components/Animated.svelte";
    import Button from "../components/Button.svelte";
    import GameBox from "../components/GameBox.svelte";
    import ChainService from '../services/chain.service'
    import {loaded, currentRound, roundData, totalRounds} from "../store/stores";

    onMount(async () => {
        await ChainService.getGameData();
    });

    const selectRound = async (round: number) => {
        await ChainService.getGameData(round);
    }


</script>

<style lang="scss">

    .rounds {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        margin: 20px auto;
        max-width: 960px;
        gap: 5px;
    }

    p {
        font-size: 1.4rem;
        line-height: 1.5;
        color:white;
        max-width: 800px;
        margin: 20px auto 0;
        text-align: center;
    }

    .page {
        position: relative;
        padding: 20px 50px;
        z-index: 10;
        max-width: 1280px;
        margin: 0 auto;

        @media (max-width: 768px) {
            padding: 20px 20px;
        }
    }

</style>
