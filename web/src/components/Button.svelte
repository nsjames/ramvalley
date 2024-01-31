<section on:click class="button" class:big class:square class:blue class:secondary class:fill class:disabled>
    <figure class="bg"></figure>
    <figure class="bg-top"></figure>
    <figure class="text">
        {#if !working}
            <slot />
        {:else}
            <figure class="hidden">
                <slot />
            </figure>
            <!-- spinner -->
            <figure class="spinner" style="text-shadow: none;">
                <i class="fas fa-fan fa-spin"></i>
            </figure>
        {/if}
    </figure>
</section>

<script lang="ts">
    export let big: boolean = false;
    export let square: boolean = false;
    export let blue: boolean = false;
    export let secondary: boolean = false;
    export let fill: boolean = false;
    export let disabled: boolean = false;
    export let working: boolean = false;

</script>

<style lang="scss">
    .button {
        padding: 10px 50px;
        position: relative;
        display: inline-flex;
        align-content: center;
        justify-content: center;
        border-radius: 10px;
        overflow: hidden;
        cursor: pointer;
        user-select: none;

        border-bottom: 4px solid #ec7500;
        box-shadow: 0 0 0 2px black, 0 5px 0 0 rgba(0,0,0,0.2);

        transition: all 0.2s ease;
        transition-property: transform, background;

        &:hover {
            border-bottom: 4px solid #ec7500;
            box-shadow: 0 0 0 2px black, 0 5px 0 0 rgba(0,0,0,0.2);
            transform: translateY(-5px);
        }

        &:active {
            border-bottom: 4px solid #ec7500;
            box-shadow: 0 0 0 2px black, 0 2px 0 0 rgba(0,0,0,0.2);
            transform: translateY(5px);
        }

        .bg {
            position: absolute;
            top:0;
            bottom:0;
            left:0;
            right:0;
            background:#ffdb31;
            z-index: 1;
        }

        .bg-top {
            position: absolute;
            top:50%;
            border-radius: 10px;
            bottom:-50%;
            left:2px;
            right:2px;
            background: rgb(248,195,31);
            background: linear-gradient(90deg, rgba(248,195,31,1) 0%, rgba(250,166,12,1) 100%);
            z-index: 2;
        }

        .text {
            font-size: 24px;
            font-weight: bold;
            color:white;
            -webkit-text-stroke: 1px black;
            text-shadow: 0 3px 0 black, 1px 3px 0 black, -1px 3px 0 black;
            position: relative;
            z-index: 3;

            font-family: 'Comicy', serif;
        }

        &.square {
            padding: 10px 24px;
        }

        &.big {
            padding: 14px 60px;
            .text {
                font-size: 36px;
            }

            @media (max-width: 960px) {
                padding: 8px 40px;
                .text {
                    font-size: 24px;
                }
            }
        }

        &.blue {
            border-bottom: 4px solid #004284;
            box-shadow: 0 0 0 2px black, 0 5px 0 0 rgba(0,0,0,0.2);
            .bg {
                background:#047bcc;
            }
            .bg-top {
                background: rgb(4,71,137);
                background: linear-gradient(90deg, rgba(4,71,137,1) 0%, rgba(3,104,172,1) 100%);
            }

            &:hover {
                border-bottom: 4px solid #ec7500;

                .bg {
                    background:#ffdb31;
                }

                .bg-top {
                    background: rgb(248,195,31);
                    background: linear-gradient(90deg, rgba(248,195,31,1) 0%, rgba(250,166,12,1) 100%);
                }
            }
        }

        &.secondary {
            border-bottom: 4px solid #51728d;
            box-shadow: 0 0 0 2px black, 0 5px 0 0 rgba(0,0,0,0.2);
            .bg {
                background: #b3cde8;
            }
            .bg-top {
                background: #81a7c9;
                background: linear-gradient(90deg, #91a2b0 0%, #8f9ba9 100%);
            }

            &:hover {
                border-bottom: 4px solid #004284;

                .bg {
                    background:#047bcc;
                }

                .bg-top {
                    background: rgb(4,71,137);
                    background: linear-gradient(90deg, rgba(4,71,137,1) 0%, rgba(3,104,172,1) 100%);
                }
            }
        }

        &.fill {
            width: 100%;
        }

        &.disabled {
            opacity: 0.5;
            cursor: not-allowed;
            &:active {
                pointer-events: none;
            }
        }
    }
</style>
