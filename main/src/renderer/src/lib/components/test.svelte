<script lang="ts">
  import ModelCard from "./modelCard.svelte";
  import { onMount } from "svelte";
  import { slide, fly, blur } from "svelte/transition";

  let validModels = [
    {
      name: "LLaMa 1",
      description: "Rudimentary Chat Model by Meta",
      id: Math.random().toString(36).substring(7),
      context: null,
    },
    {
      name: "LLaMa 2 7B",
      description: "Basic Chat Model by Meta",
      id: Math.random().toString(36).substring(7),
      context: null,
    },
    {
      name: "LLaMa 3 8B",
      description: "Advanced Chat Model by Meta",
      id: Math.random().toString(36).substring(7),
      context: null,
    },
    {
      name: "Mistral 8B",
      description: "Advanced Chat Model by Mistral AI",
      id: Math.random().toString(36).substring(7),
      context: null,
    },
    {
      name: "LLaVa",
      description: "Advanced Model that can read images",
      id: Math.random().toString(36).substring(7),
      context: null,
    },
  ];

  let installedModels = ["LLaMa 1", "Mistral 8B", "LLaVa"];

  function textfnc(
    loadBarContainer: HTMLElement,
    loadBar: HTMLElement,
    status: HTMLElement
  ) {
    console.log(loadBarContainer, loadBar, status);

    let tempval = 0;

    let interval = setInterval(() => {
      if (tempval < 100) {
        tempval += 10;
        status.innerHTML = `Arrived at tempval = ${tempval}`;
        loadBar.style.width = tempval + "%";
      } else {
        status.innerHTML = `Finished trial loading`;
        clearInterval(interval);
      }
    }, 1000);
  }

  onMount(() => {
    let differ = 50;
    let delayDiffer = validModels.length * differ;

    validModels.forEach((model) => {
      if (delayDiffer > 0) {
        delayDiffer -= differ;
      }
      new ModelCard({
        target: document.querySelector("#model-card"),
        props: {
          name: model.name,
          description: model.description,
          OnClick: textfnc,
          context: installedModels.includes(model.name)
            ? model.context || "No data available"
            : null,
          loadBar: {
            initialStatus: "loading",
            ready: false,
          },
          id: model.id,
          style:
            "border-top: 1px solid #000; border-top-right-radius: 20px; border-top-left-radius:20px; border-bottom-left-radius: 20px; border-bottom: none;",
          width: 500,
          height: 130,
          intensity: "3, 30",
          background: "rgba(255, 255, 255, 0.190)",
          color: "white",
          ButtonReactivity: {
            invert: ["65%", "100%"],
            scale: [1, 1.1],
          },
          loadState: true,
          transition: {
            in: {
              type: blur,
              duration: 500,
              delay: delayDiffer,
            },
          },
        },
      });
    });
  });
</script>

<body
  style="padding:0; margin:0; align-items:center; justify-content: center; width:800px; height:100%;"
>
  <div
    style="width:auto; height:80%; margin:auto;
    display:block; background-color: transparent; overflow-y:scroll;
    overflow-x:hidden; align-items:center; justify-content:center;
    position:absolute; bottom:50%; transform:translateY(50%)"
    id="model-card"
  ></div>
</body>
