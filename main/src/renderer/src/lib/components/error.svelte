<script lang="ts" customElements="ErrorObject">
    
    export let Ehead:string = ""
    export let Ecode:string | number
    export let icon
    export let icon_animation: "wiggle" | "pulse" | "wigglejump"
    export let width:number | string
    export let height: number | string

    //height = 

</script>

<style>
    @keyframes wiggle {
        0%{
            transform: rotate(0deg);
        }
        33%{
            transform: rotate(30deg);
        }
        66%{
            transform: rotate(-30deg);
        }
        100%{
            transform: rotate(0deg);
        }
    }
</style>

<div>
    
</div>