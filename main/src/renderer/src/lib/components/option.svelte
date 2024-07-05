<script lang="ts" customElements="option">
  import { onMount } from "svelte";

  export let name: string = "";
  export let _id: string = "";
  export let style: string = "";
  export let onClick: Function;

  export let type: "promise" | "incrementation" = "incrementation";

  export let selection: Array<string>;
  export let value: string;

  let index: number;

  if (!value) {
    index = 0;
    value = selection[0];
  } else
    index = value
      ? selection.indexOf(value) == -1
        ? 0
        : selection.indexOf(value)
      : 0;

  if (!_id || !onClick || !type) {
    throw new Error(
      "A required prop has not been defined \nverify: [name, id, onClick, type] props"
    );
  }

  onMount(() => {
    console.log(style);
    let button = document.getElementById(_id).querySelector("button");

    button.onmouseenter = () => {
      button.style.color = "rgb(86, 86, 86)";
    };

    button.onmouseleave = () => {
      button.style.color = "black";
    };

    button.onclick = () => {
      if (type == "incrementation") {
        if (index < selection.length - 1) {
          index++;
        } else index = 0;

        value = selection[index];
        onClick();
      } else if (type == "promise") {
        onClick();
      }
    };
  });
</script>

<div
  style="width: auto; height:auto; background:none; align-items: center; justify-content: center;"
  id={_id}
>
  <button
    style="background: none; border:none; align-items: center; justify-content: center; text-align:left; cursor:pointer; transition:all 1s ease-out; {style}"
  >
    {name ? `${name}: ` : ""}{value}
  </button>
</div>
