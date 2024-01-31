<section class="progress-bar">
    <figure class="bar" style="width: {percentage * 100}%;">
        <figure class="bottom"></figure>
    </figure>
</section>

<script lang="ts">

    export let value;
    export let total;

    $: percentage = value / total;
</script>

<style lang="scss">
    .progress-bar {
        width: 100%;
        height: 60px;
        background-color: #1a102b;
        box-shadow: 0 0 0 3px #08090d;
        border-radius: 10px;
        z-index: 2;
        position: relative;
        padding: 2px;


        .bar {
            position: relative;
            background:#ffdb31;
            z-index: 1;
            border-radius: 10px;
            height: 100%;
            overflow: hidden;

            .bottom {
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
        }
    }
</style>
