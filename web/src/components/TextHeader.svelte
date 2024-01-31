<section bind:this={elem} class="text-header" class:show>

    <div class="text">
        <slot />

        <section class="ball left"></section>
        <section class="ball left"></section>
        <section class="ball left"></section>
        <section class="ball right"></section>
        <section class="ball right"></section>
        <section class="ball right"></section>
    </div >
</section>

<script lang="ts">

    import {onMount} from "svelte";

    let elem: any;
    let show = false;

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

    .text-header {

        display: flex;
        justify-content: center;
        align-content: center;
        width:100%;
        overflow: hidden;
        text-align: center;


        .text {
            position: relative;
            color: white;
            font-size: 50px;
            font-family: 'Comicy',serif;
            top: 200px;
            opacity: 0;

            transition: all 0.5s ease-in-out;
            transition-property: top, opacity;

        }

        .ball {
            position: absolute;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: white;
            top: 50%;
            transform: translateY(-50%);
            opacity: 0;

            transition: all 0.5s ease-in-out;
            transition-delay: 0s;
            transition-property: left, right, opacity;

            &.left {
                left: -500px;
            }

            &.right {
                right: -500px;
            }
        }


        &.show {
            .text {
                top: 0;
                opacity: 1;
            }

            .ball {
                transition-delay: 0.2s;
                opacity: 1;
                &.left {
                    left: -50px;

                    &:nth-child(2) {
                        transition-delay: 0.3s;
                        left: -100px;
                    }

                    &:nth-child(3) {
                        transition-delay: 0.4s;
                        left: -150px;
                    }
                }

                &.right {
                    right: -50px;

                    &:nth-child(4) {
                        transition-delay: 0.3s;
                        right: -100px;
                    }

                    &:nth-child(5) {
                        transition-delay: 0.4s;
                        right: -150px;
                    }
                }

                //&:nth-child(2) {
                //    transition-delay: 0.3s;
                //    &.left {
                //        left: -100px;
                //    }
                //
                //    &.right {
                //        right: -100px;
                //    }
                //}
                //
                //&:nth-child(1) {
                //    transition-delay: 0.4s;
                //    &.left {
                //        left: -150px;
                //    }
                //
                //    &.right {
                //        right: -150px;
                //    }
                //}
            }
        }

    }

</style>
