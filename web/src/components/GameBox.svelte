<section class="game-box">
    <figure class="ribbon">
        <img src="/images/ribbon.png" alt="ribbon" />
        <figure class="text">Play The Game</figure>
    </figure>

    <figure class="h-[30px]"></figure>

    <Animated>
        <section class="row-texts">
            <figure>Phase</figure>
            <figure>{Object.keys(PHASES)[activePhase]}</figure>
        </section>
    </Animated>

    <Animated delay="0.1s">
        <section class="phases">
            {#each Object.values(PHASES) as phase, index}
                <section id={`phase_${phase}`} class="phase" class:active={activePhase === phase} class:finished={activePhase > phase}>
                    <figure class="bg"></figure>
                    <figure class="stamp">
                        <img src="/images/stamp.png" />
                    </figure>
                    <section class="icon">
                        <img src={PHASE_IMAGES[phase]} />
                    </section>

                    {#if activePhase !== PHASES.REWARDS}
                        <figure class="time-left">
                            {formattedTime}
                        </figure>
                    {/if}
                    <section class="rays">
                        <img src="/images/rays.png" />
                    </section>
                </section>
            {/each}
        </section>
    </Animated>

    <section class="row-texts">
        <figure>Tickets Used</figure>
        <figure>{$userData ? $userData.tickets_used : 0}/{$userData ? $userData.tickets + $userData.tickets_used : 0}</figure>
    </section>
    <ProgressBar value={$userData ? $userData.tickets_used : 0} total={$userData ? $userData.tickets + $userData.tickets_used : 0} />

    {#if $roundData.total_points > 0}
        <section class="row-texts">
            <figure>Points</figure>
            <figure>{$userData ? $userData.points : 0}/{$roundData.total_points}</figure>
        </section>
        <ProgressBar value={$userData ? $userData.points : 0} total={$roundData.total_points} />
    {/if}

    <section class="mt-8">
        {#if !$user}
            <Button big blue fill on:click={() => ChainService.login()}>Login</Button>
        {:else}
            <section class="flex gap-2">
                <Button big secondary on:click={() => ChainService.logout()} disabled={$working}>Log out</Button>
                <section class="flex-1">
                    {#if activePhase === PHASES.SEEDS}
                        <Button on:click={sendSeeds} big blue fill disabled={$working} working={$working}>Send Seeds</Button>
                    {:else if activePhase === PHASES.TICKETS}
                        <Button on:click={useTicket} big blue fill disabled={$working || (!$userData || !$userData.tickets)} working={$working}>Use Ticket</Button>
                    {:else if activePhase === PHASES.REWARDS}
                        <Button on:click={claimReward} big blue fill disabled={$working} working={$working}>Claim Rewards</Button>
                    {/if}
                </section>
            </section>

            {#if $user == getGameAccount()}
                <section class="mt-8">
                    <label>Round</label>
                    <input bind:value={startRound} type="number" placeholder="Round" />
                    <br />
                    <label>Raw seed</label>
                    <input bind:value={rawSeed} placeholder="Raw seed" />
                    <br />
                    <label>Round duration (seconds)</label>
                    <input bind:value={roundDuration} placeholder="Round duration (seconds)" />
                    <br />
                    <Button on:click={start} big blue disabled={$working}>Start</Button>
                    <br />
                    <Button on:click={sendProof} big blue disabled={$working}>Send proof</Button>
                </section>
            {/if}
        {/if}


    </section>

</section>

<script lang="ts">
    import Animated from "./Animated.svelte";
    import {writable} from "svelte/store";
    import ProgressBar from "./ProgressBar.svelte";
    import {onMount} from "svelte";
    import Button from "./Button.svelte";
    import ChainService from "../services/chain.service";
    import {user, currentRound, roundData, userData, working} from "../store/stores";
    import {bufferToHex, getGameAccount, randomString, sha256} from "../services/utils.service";


    const PHASES = {
        SEEDS: 0,
        TICKETS: 1,
        REWARDS: 2
    }

    const PHASE_IMAGES = {
        [PHASES.SEEDS]: '/images/icon_seed.png',
        [PHASES.TICKETS]: '/images/icon_ticket.png',
        [PHASES.REWARDS]: '/images/icon_reward.png'
    }

    $: seedPhaseEnd = +new Date($roundData.start_date) + (1000 * $roundData.seed_phase_duration);
    $: claimPhaseEnd = +new Date($roundData.proof_date) + (1000 * $roundData.redeem_phase_duration);
    $: activePhase = (() => {
        const now = +new Date();

        if($roundData.raw_salt === "0000000000000000000000000000000000000000000000000000000000000000"){
            return PHASES.SEEDS;
        }

        if(now < claimPhaseEnd){
            return PHASES.TICKETS;
        }

        return PHASES.REWARDS;
    })();


    $: timeLeft = (() => {
        if (activePhase === PHASES.SEEDS) {
            return writable(seedPhaseEnd - +new Date());
        }

        if (activePhase === PHASES.TICKETS) {
            return writable(claimPhaseEnd - +new Date());
        }

        return writable(0)
    })();
    setInterval(() => {
        timeLeft.update((value) => {
            if (value > 0) {
                return value - 1000;
            }

            return value;
        });
    }, 1000);

    setInterval(() => {
        if($timeLeft <= 0){
            if(activePhase !== PHASES.REWARDS) {
                ChainService.refresh();
            }
        }
    }, 5000);

    $: formattedTime = (() => {
        if ($timeLeft <= 0) {
            return '00:00:00';
        }

        let hours:any = Math.floor($timeLeft / 1000 / 60 / 60);
        let minutes:any = Math.floor($timeLeft / 1000 / 60 % 60);
        let seconds:any = Math.floor($timeLeft / 1000 % 60);

        hours = hours < 10 ? `0${hours}` : hours;
        minutes = minutes < 10 ? `0${minutes}` : minutes;
        seconds = seconds < 10 ? `0${seconds}` : seconds;

        return `${hours}:${minutes}:${seconds}`;
    })();

    const sendSeeds = async () => {
        const result = await ChainService.sendSeeds();
        console.log(result);
    }

    const selectRound = async (round) => {
        await ChainService.selectRound(round);
    }

    let startRound = $currentRound+1;
    let rawSeed = 'ramgame';
    let roundDuration = 20;

    const start = async () => {
        let startRaw = await sha256(rawSeed);
        let startProof = await sha256(bufferToHex(startRaw), 'hex');
        await ChainService.startRound(startRound, startProof, roundDuration);
    }

    const sendProof = async () => {
        let proof = await sha256(rawSeed);
        await ChainService.sendProof(startRound, proof);
    }

    const useTicket = async () => {
        await ChainService.useTicket($currentRound);
    }

    const claimReward = async () => {
        const claimed = await ChainService.claimReward($currentRound);
        alert(`You claimed ${claimed}!`);
    }

    onMount(async () => {
        await ChainService.setup();
    })
</script>

<style lang="scss">
    label {
        font-family: 'Comicy', serif;
        font-size: 13px;
        color: white;
        -webkit-text-stroke: 1px black;
        text-shadow: 0 3px 0 black, 1px 3px 0 black, -1px 3px 0 black;
        display: block;
    }
    .game-box {
        width: 100%;
        height: 100%;
        background-color: #033773;
        padding: 40px;
        border-radius: 10px;
        max-width: 900px;
        margin: 0 auto;
        box-shadow: 0 10px 0 #002d62, 0 -4px 0 #065195;
        position: relative;

        .ribbon {
            position: absolute;
            top: -60px;
            left: 0;
            right: 0;
            margin: 0 auto;
            width: 90%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
            img {
                width: 100%;
                height: auto;
            }

            .text {
                font-family: 'Comicy', serif;
                color: white;
                font-size: 50px;
                position: absolute;
                top: 15px;
                bottom: 0;
                left: 0;
                right: 0;
                text-align: center;
                -webkit-text-stroke: 2px black;
                text-shadow: 0 4px 0 black, 1px 4px 0 black, -1px 4px 0 black;
            }
        }

        .row-texts {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
            font-family: 'Comicy', serif;
            font-size: 22px;
            margin-bottom: 5px;
            z-index: 2;
            position: relative;

            & > figure {
                &:first-child {
                    color: #9d7cda;
                }

                &:last-child {
                    color: #fff;
                }
            }
        }

        .phases {
            display: flex;
            justify-content: space-between;
            gap: 40px;


            @media (max-width: 1100px) {
                flex-direction: column;
                height: auto;
            }

            .phase {
                position: relative;
                width: 100%;
                z-index: 1;
                height: 250px;

                .bg {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1;
                    background: #1a102b;
                    border-radius: 10px;
                }

                .stamp {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 3;

                    img {
                        width: 80%;
                        max-width: 250px;
                        height: auto;
                    }
                }

                .icon {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2;
                    opacity: 0.2;

                    img {
                        width: 60%;
                        max-width: 200px;
                        height: auto;
                    }

                }
                .time-left {
                    position: absolute;
                    bottom: 30px;
                    left: 0;
                    right: 0;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 2;
                    font-family: 'Comicy', serif;
                    font-size: 2rem;
                    color: white;
                    -webkit-text-stroke: 1px black;
                    text-shadow: 0 3px 0 black, 1px 3px 0 black, -1px 3px 0 black;

                }

                .rays {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    right: 0;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    width: 300%;
                    left: -100%;
                    z-index: 1;
                    mix-blend-mode: soft-light;


                    animation: spin 40s linear infinite;
                }

                @keyframes spin {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }

                &.active {
                    z-index: 2;

                    .bg {
                        background: rgb(16,100,198);
                        background: linear-gradient(180deg, rgba(16,100,198,1) 0%, rgba(3,55,115,1) 100%);
                        box-shadow: 0 0 0 6px white, 0 0 34px 0 white;
                        animation: pulse 5s infinite;

                        @keyframes pulse {
                            0%, 100% {
                                box-shadow: 0 0 0 6px white, 0 0 20px 0 rgba(255,255,255,0.7);
                            }
                            30% {
                                box-shadow: 0 0 0 6px white, 0 0 150px 0 rgba(255,255,255,0.2);
                            }

                        }
                    }

                    .rays {
                        display: flex;
                    }

                    .icon {
                        opacity: 1;
                    }

                    .time-left {
                        display: flex;
                    }
                }

                &.finished {
                    .stamp {
                        display: flex;
                    }
                }
            }
        }
    }
</style>
