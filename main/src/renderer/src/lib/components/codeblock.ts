
import hljs from "highlight.js";

export function getCodeBlock({code, language = "", style = ""}) {
  hljs.highlightAll();
  let parent = document.createElement("div");
  parent.style.borderRadius = "10px";
  parent.style.margin = "10px";
  parent.style.padding = "20px";
  parent.style.backgroundColor = "#616161c1";

  let pre = document.createElement("pre");
  //pre.style.backgroundColor = "transparent";
  //pre.style.padding = "20px";
  //pre.style.borderLeft = "3px solid #f36d33";
  //pre.style.overflow = "auto";

  let codeElement = document.createElement("code");
  //codeElement.style.backgroundColor = "transparent";
  language ? codeElement.classList.add(`language-${language}`) : null;
  codeElement.innerText = code;
  
  pre.appendChild(codeElement);
  parent.appendChild(pre);

  return parent;
}
/*
<svelte:options customElement="code-block" />

<script type="ts">
  import hljs from "highlight.js";
  import { onMount } from "svelte";

  hljs.highlightAll();

  export let code = "";
  export let style = "";

  let codeBlock

  onMount(() => {
    codeBlock = document.querySelector("#code-block");
  });

</script>

<link rel="stylesheet" href="../assets/packages/highlightjs/default.min.css" />

<div id="code-block" {style}>
  <pre>
        <code>{code}</code>
      </pre>
</div>

<slot />

<style>

  div{
    border-radius: 10px;
    margin: 10px;
    padding: 20px;
    background-color: #616161c1;
  }

  pre {
    background-color: transparent;
    padding: 20px;
    border-left: 3px solid #f36d33;
    overflow: auto;
  }
</style>
*/