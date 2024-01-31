<section class="hero">
    <section id="hidablehero">
        <img class="logo" src="/images/logo.png" />
        <section class="cta">
            <Button big>
                Play
            </Button>
        </section>
        <img class="gradient" src="/images/hero_bg_gradient.png" />
        <img class="clouds" src="/images/hero_bg_clouds.png" />
        <img class="mountains" src="/images/hero_bg_mountains.png" />
        <img class="mid" src="/images/hero_bg_mid.png" />
        <img class="overlay" src="/images/hero_bg_overlay.png" />
    </section>
    <figure class="sizer"></figure>
</section>

<script lang="ts">

    import { onMount } from 'svelte';
    import Button from "./Button.svelte";

    onMount(() => {

        const scrollModifier = 0.4;

        // move down as the user scrolls
        const hero = document.querySelector('.hero');
        const cta = document.querySelector('.cta');
        const logo = document.querySelector('.logo');
        const gradient = document.querySelector('.gradient');
        const clouds = document.querySelector('.clouds');
        const mountains = document.querySelector('.mountains');
        const mid = document.querySelector('.mid');
        const overlay = document.querySelector('.overlay');
        const sizer = document.querySelector('.sizer');
        const hideableHero = document.querySelector('#hidablehero');

        const startingPositions = {
            big: {
                cta: 42,
                logo: 10,
                gradient: 0,
                clouds: -20,
                mountains: 22,
                mid: 30,
                overlay: 60,
            },
            mid: {
                cta: 46,
                logo: 8,
                gradient: 0,
                clouds: -2,
                mountains: 28,
                mid: 20,
                overlay: 50,
            },
            small: {
                cta: 30,
                logo: 2,
                gradient: 0,
                clouds: 2,
                mountains: 10,
                mid: 10,
                overlay: 15,
            }
        }

        const movements = {
            big: {
                cta: 0.1,
                logo: 0.05,
                gradient: 0,
                clouds: 0.12,
                mountains: 0.02,
                mid: 0.3,
                overlay: 0.4,
            },
            mid: {
                cta: 0,
                logo: 0.1,
                gradient: 0,
                clouds: 0.12,
                mountains: 0.005,
                mid: 0.05,
                overlay: 0.2,
            },
            small: {
                cta: 0,
                logo: 0.1,
                gradient: 0,
                clouds: 0.12,
                mountains: 0.0005,
                mid: 0.005,
                overlay: 0.02,
            }
        }

        const setHero = () => {
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            const widthKey = screenWidth >= 1500 ? 'big' : screenWidth >= 960 ? 'mid' : 'small';

            const startingCta = startingPositions[widthKey].cta;
            const startingLogo = startingPositions[widthKey].logo;
            const startingClouds = startingPositions[widthKey].clouds;
            const startingMountains = startingPositions[widthKey].mountains;
            const startingMid = startingPositions[widthKey].mid;
            const startingOverlay = startingPositions[widthKey].overlay;

            const scroll = window.scrollY;

            const getScaleWithMinimum = (mod:number, scale: number, minimum: number) => {
                const calc = mod - (scroll * scale) * scrollModifier;
                const val = parseFloat(calc) < minimum ? minimum : calc;
                return `scale(${val})`;
            }

            logo.style.top = `${startingLogo + scroll * movements[widthKey].logo * scrollModifier}%`;
            cta.style.top = `${startingCta + scroll * movements[widthKey].cta * scrollModifier}%`;
            clouds.style.top = `${startingClouds - scroll * movements[widthKey].clouds * scrollModifier}%`;
            mountains.style.top = `${startingMountains + scroll * movements[widthKey].mountains * scrollModifier}%`;
            mid.style.top = `${startingMid - scroll * movements[widthKey].mid * scrollModifier}%`;
            overlay.style.top = `${startingOverlay - (scroll - 50) * movements[widthKey].overlay * scrollModifier}%`;


            // zoom mountains
            mountains.style.transform = `scale(${1 + (scroll * 0.0015) * scrollModifier})`;
            // reverse zoom mid
            mid.style.transform = getScaleWithMinimum(1.4, 0.0025, 1); //`scale(${1.4 - (scroll * 0.0025)})`;
            overlay.style.transform = getScaleWithMinimum(1.2, 0.004, 1); //`scale(${1.5 - (scroll * 0.002)})`;
            cta.style.transform = getScaleWithMinimum(1, 0.002, 0.5); //`scale(${1.2 - (scroll * 0.002)})`;


            clouds.style.filter = `blur(${scroll * 0.1}px)`;
            mountains.style.filter = `blur(${(scroll - 20) * 0.03}px)`;
            mid.style.filter = `blur(${10 - (scroll * 0.08)}px)`;
            overlay.style.filter = `blur(${15 - (scroll * 0.1)}px)`;

            // scale down logo
            let scale = 1 - ((scroll - 150) * 0.002 * scrollModifier);
            logo.style.transform = `scale(${scale > 1 ? 1 : scale})`;
            // blur logo but delay it by 100px
            logo.style.filter = scroll < 100 ? '' : `blur(${(scroll - 100) * 0.1 * scrollModifier}px)`;
            cta.style.filter = scroll < 100 ? '' : `blur(${(scroll - 150) * 0.1 * scrollModifier}px)`;


            const rect = overlay.getBoundingClientRect();
            const bottomPosition = window.innerHeight - (window.innerHeight - rect.bottom);
            if(bottomPosition < window.innerHeight){

                sizer.style.top = `${bottomPosition - 100}px`;
                sizer.style.height = `${screenHeight - bottomPosition + 100}px`;
                if(bottomPosition < 0){
                    hideableHero.style.opacity = '0';
                } else {
                    hideableHero.style.opacity = '1';
                }
            } else {
                sizer.style.height = `0px`;
                sizer.style.top = '0px';
                hideableHero.style.opacity = '1';
            }
        }

        setHero();

        window.addEventListener('scroll', () => {
            setHero();
        });

        window.addEventListener('resize', () => {
            setHero();
        });


    });


</script>

<style lang="scss">



    .hero {
        position: relative;
        width: 100%;
        height: calc(100vh + 200px);
        overflow: hidden;

        @media (max-width: 960px) {
            height: 500px;
        }

        .sizer {
            position: fixed;
            left:0;
            right:0;
            height: 0;
            background: #23183d;
            z-index: 6;
            width: 100vw;
        }

        img {
            position: absolute;
            width: 100%;
            height: auto;
            margin: 0 auto;

            pointer-events: none;
        }

        .gradient {
            top:0;
            left: 0;
            right: 0;
            z-index: 0;
        }

        .logo {
            top: 150px;
            left: 0;
            right: 0;
            margin: auto;
            z-index: 2;
            max-width: 500px;
            width: 100%;

            @media (max-width: 960px) {
                max-width: 200px;
            }
        }

        .cta {
            position: absolute;
            top: 150px;
            left: 0;
            right: 0;
            margin: auto;
            z-index:3;
            max-width: 500px;
            display: flex;
            justify-content: center;
            align-content: center;

            animation: jumpIn 0.7s ease-in-out 1;
        }

        @keyframes jumpIn {
            0% {
                transform: translateY(-300px) scale(0.2);
                filter: blur(50px);
                z-index: 1;
            }
            30% {
                transform: translateY(20px) scale(1.1);
                filter: blur(0px);
                z-index: 3;
            }
            50% {
                transform: translateY(-20px) scale(0.9);
            }
            80% {
                transform: translateY(10px) scale(1.05);
            }
            100% {
                transform: translateY(0px) scale(1);
            }
        }

        .clouds {
            top: 0;
            left: 0;
            right: 0;
            z-index: 1;
            animation: float 5s ease-in-out infinite;
        }

        .mountains {
            top: 400px;
            left: 0;
            right: 0;
            z-index: 2;
        }

        .mid {
            top: 400px;
            left: 0;
            right: 0;
            z-index: 3;
            filter: blur(10px);
        }

        .overlay {
            top: 800px;
            left: 0;
            right: 0;
            z-index: 4;
            filter: blur(15px);
        }
    }

    @keyframes float {
        0% {
            transform: translateY(0px);
        }
        50% {
            transform: translateY(10px);
        }
        100% {
            transform: translateY(0px);
        }
    }

    @keyframes pulsate {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(0.9);
        }
        100% {
            transform: scale(1);
        }
    }
</style>
