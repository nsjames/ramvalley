<section bind:this={elem} class="animated-div" class:show style="transition-delay: {delay}; animation-delay: {delay}">
    <slot />
</section>

<script lang="ts">

    import {onMount} from "svelte";

    let elem: any;
    let show = false;
    export let delay = 0;

    onMount(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.map((entry) => {
                // show = !!entry.isIntersecting;
                if(entry.isIntersecting){
                    show = true;
                }
            });
        });

        observer.observe(elem);
    })

</script>

<style lang="scss">

    $speed: 0.4s;

    .animated-div {
        opacity: 0;
        transform: translateY(200px);
        transition: all $speed ease-in-out;
        transition-delay: 0s;

        &.show {
            opacity: 1;
            transform: translateY(0);
            animation: bounceInFromBelowElastic $speed ease-in-out;
        }

        @keyframes bounceInFromBelowElastic {
            0% {
                opacity: 0;
                transform: translateY(200px);
            }
            60% {
                opacity: 1;
                transform: translateY(-20px);
            }
            80% {
                transform: translateY(10px);
            }
            100% {
                transform: translateY(0);
            }

        }
    }

</style>
