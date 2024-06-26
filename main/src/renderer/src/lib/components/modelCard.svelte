<script lang="ts" customElements="model-card">
  import { onMount } from "svelte";
  import CardBody from "./ui/cardeff/CardBody.svelte";
  import CardContainer from "./ui/cardeff/CardContainer.svelte";
  import CardItem from "./ui/cardeff/CardItem.svelte";
  import { scale } from "svelte/transition";

  export let className: string = "";
  export let name: string = "";
  export let description: string = "";
  export let id: string;
  export let style: string = "";
  export let context: string | undefined = undefined;
  export let OnClick: Function = null;
  export let height: number | string = "auto";
  export let width: number | string = "auto";
  export let background: string = "transparent";
  export let color: string = "white";
  export let ButtonReactivity: object = {
    invert: ["65%", "100%"],
    scale: [1, 1.1],
  };
  export let loadBar: object = {
    value: 0,
    max: 100,
    size: 200,
  };
  export let intensity: string;
  export let transition: SvelteTransitionObject | undefined = undefined;
  export let loadState: boolean = true;
  let loadKey = {};

  let isMouseEntered = false;
  let mainId = id;

  try {
    if (intensity.split(",").map(Number).length != 2) {
      throw new Error(
        "The intensity property must be of dimension 2 in the form '(x, y)'"
      );
    }
  } catch (e) {
    throw new Error(
      "The intensity property must be of dimension 2 in the form '(x, y)'"
    );
  }

  if (!id) {
    throw new Error("You must have a id prop");
  }

  if (ButtonReactivity) {
    Object.entries(ButtonReactivity).forEach(([_, value]) => {
      if (value.length != 2) {
        throw new Error(
          "The ButtonReactivity object must have a length of 2 for each key-value pair"
        );
      }
    });
  }

  try {
    if (transition) {
      if (!transition?.in?.type && !transition?.out?.type) {
        throw new Error(
          "The transition prop must have at least one valid Svelte transformation object"
        );
      } else if (!transition?.in?.duration && !transition?.out?.duration) {
        throw new Error(
          "The transition prop must have at least one valid duration object"
        );
      }
    }
  } catch (e) {
    console.log(e);
  }

  function getLoadBars() {
    if (!loadBar) {
      throw new Error("A loadbar prop must be provided to pursue the loading");
    }

    let loadbarContainer = document.createElement("div");
    loadbarContainer.style.width = "75%";
    loadbarContainer.style.height = "1.5px";
    loadbarContainer.style.backgroundColor = "rgba(255, 255, 255, 0.199)";
    loadbarContainer.style.backdropFilter = "blur(5px)";
    loadbarContainer.style.position = "absolute";
    loadbarContainer.style.bottom = "60%";
    loadbarContainer.style.right = "10%";
    loadbarContainer.style.transition = "all .5s ease-out";
    loadbarContainer.style.opacity = "0";
    loadbarContainer.style.textOverflow = "ellipsis";

    let loadbar: HTMLDivElement = document.createElement("div");
    loadbar.style.width = "0%";
    loadbar.style.height = "100%";
    loadbar.style.backgroundColor = "rgba(255, 255, 255, 0.699)";
    loadbar.style.transition = "all 5s ease-out";
    loadbar.style.margin = "0";
    loadbar.style.borderTopRightRadius = "10px";
    loadbar.style.borderBottomRightRadius = "10px";
    loadbar.id = "loadbar";

    let loadStatus = document.createElement("span");
    loadStatus.style.maxWidth = "300px";
    loadStatus.style.position = "absolute";
    loadStatus.style.top = "5px";
    loadStatus.style.fontSize = "14px";
    loadStatus.style.left = "20px";
    loadStatus.innerText = "waiting for status";
    loadStatus.style.opacity = "0.7";
    loadStatus.style.textOverflow = "ellipsis";
    loadStatus.style.whiteSpace = "nowrap";
    loadStatus.style.overflow = "hidden";

    loadbarContainer.appendChild(loadbar);
    loadbarContainer.appendChild(loadStatus);

    document
      .getElementById(mainId)
      .querySelector("#user-content")
      .appendChild(loadbarContainer);

    return [loadbarContainer, loadbar, loadStatus];
  }

  function initLoadingIntro(
    btnImg: HTMLImageElement,
    btnStyles: CSSStyleDeclaration
  ) {
    let [loadBarContainer, _loadBar, statusCont] = getLoadBars();

    let status = document.createElement("span");
    status.style.opacity = "0";
    status.style.transition = "all 1s ease-out";
    status.style.position = "absolute";
    status.style.bottom = "43%";
    status.style.left = "70px";
    status.style.fontSize = "12px";
    status.innerText = loadBar["status"] || "Starting the downloading process";

    document
      .getElementById(mainId)
      .querySelector("#user-content")
      .appendChild(status);

    btnImg.style.pointerEvents = "none";
    btnStyles.pointerEvents = "none";
    btnImg.src = "./src/lib/assets/icons/loading.png";
    btnStyles.animationPlayState = "running";
    btnImg.style.animationPlayState = "running";

    setTimeout(() => {
      (
        document
          .getElementById(mainId)
          .querySelector("#user-content") as HTMLElement
      ).style.bottom = "20%";

      setTimeout(() => {
        status.style.opacity = ".7";
        setTimeout(() => {
          loadBar["ready"] = true;
        }, 4000);
      }, 300);
    }, 1000);

    let waitForLoadBar = setInterval(() => {
      if (loadBar["ready"]) {
        clearInterval(waitForLoadBar);
        loadBarContainer.style.opacity = "1";
        status.style.transition = "none";
        status.style.opacity = "0";

        if (!OnClick) {
          throw new Error(
            "An OnClick event must be provided to pursue the loading"
          );
        }

        try {
          OnClick(loadBarContainer, _loadBar, statusCont);
        } catch (e) {
          throw new Error(
            "The OnClick Event must require three prop being [LoadingBarContainer, loadingBar, statusContainer]"
          );
        }
      }
    }, 100);
  }

  function load() {
    if (!context) {
      const animation = document.createElement("style");

      animation.innerHTML = `
    @keyframes loadingFade {
      0% {
        opacity: 1;
      }
      100% {
        opacity: 0;
      }
    }

    @keyframes loadingSpin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `;

      document.head.appendChild(animation);

      console.log(mainId);

      let btnContainer = document.createElement("button");
      let btnStyles = btnContainer.style;
      btnStyles.position = "absolute";
      btnStyles.left = "0";
      btnStyles.padding = "0";
      btnStyles.marginLeft = "30px";
      btnStyles.bottom = "40%";
      btnStyles.transition = "all .2s ease-out";
      btnStyles.cursor = "pointer";
      btnStyles.background = "none";
      btnStyles.border = "none";
      btnStyles.alignItems = "center";
      btnStyles.justifyContent = "center";
      btnStyles.animation = "loadingFade 2s infinite";
      btnStyles.animationPlayState = "paused";
      btnStyles.zIndex = "98";
      btnStyles.width = "22px";
      btnStyles.height = "22px";

      let btnImg = document.createElement("img");
      btnImg.style.height = "22px";
      btnImg.style.filter = `invert(${ButtonReactivity["invert"] ? (ButtonReactivity["invert"][0] ? ButtonReactivity["invert"][0] : "0%") : "0%"})`;
      btnImg.style.zIndex = "99";
      btnImg.style.transition = "all 0.2s ease-out";
      btnImg.style.animation = "loadingSpin 2s infinite";
      btnImg.style.animationPlayState = "paused";

      btnImg.src = "./src/lib/assets/icons/install.svg";

      btnContainer.appendChild(btnImg);

      document
        .getElementById(mainId)
        .querySelector("#user-content")
        .appendChild(btnContainer);

      console.log(
        document.getElementById(mainId).querySelector("#user-content")
      );

      document
        .getElementById(mainId)
        .querySelector("#user-content button img")
        .addEventListener("mouseover", () => {
          btnStyles.transform = `scale(${ButtonReactivity["scale"] ? (ButtonReactivity["scale"][1] ? ButtonReactivity["scale"][1] : "1") : "1"})`;
          btnImg.style.filter = `invert(${ButtonReactivity["invert"] ? (ButtonReactivity["invert"][1] ? ButtonReactivity["invert"][1] : "0%") : "0%"})`;
        });

      document
        .getElementById(mainId)
        .querySelector("#user-content button img")
        .addEventListener("mouseout", () => {
          btnStyles.transform = `scale(${ButtonReactivity["scale"] ? (ButtonReactivity["scale"][0] ? ButtonReactivity["scale"][0] : "1") : "1"})`;
          btnImg.style.filter = `invert(${ButtonReactivity["invert"] ? (ButtonReactivity["invert"][0] ? ButtonReactivity["invert"][0] : "0%") : "0%"})`;
        });

      document
        .getElementById(mainId)
        .querySelector("#user-content button img")
        .addEventListener("click", () => {
          let card = document.getElementById(mainId);
          (card.querySelector("#model-card-body") as HTMLElement).style.height =
            "170px";
          (card.querySelector("#model-name") as HTMLElement).style.fontSize =
            "26px";
          (card.querySelector("#model-name") as HTMLElement).style.top = "40px";

          initLoadingIntro(btnImg, btnStyles);
        });
    } else{
      let contextText = document.createElement('span')
      contextText.innerText = context
      let contextStyles = contextText.style
      contextStyles.position = "absolute";
      contextStyles.left = "1%";
      contextStyles.padding = "0";
      contextStyles.marginLeft = "30px";
      contextStyles.bottom = "40%";
      contextStyles.height = '20px'
      contextStyles.fontFamily = 'Gilroy, sans-serif'
      contextStyles.fontSize = '14px'
      contextStyles.fontWeight = '100'

      document
        .getElementById(mainId)
        .querySelector("#user-content")
        .appendChild(contextText);
    }
  }

  onMount(() => {
    load();
  });

  function dynamicTransition(node, params) {
    let { type, duration, delay, easing } = params;

    if (!type) {
      type = scale;
      duration = 0;
      delay = 0;
    }

    const transformRequest = (type) => {
      return type ? type : null;
    };

    const tr = transformRequest(type);
    return tr(node, { duration, delay, easing });
  }
</script>

{#if loadState}
  <div
    id="main-container-transition"
    style="width: auto; height:auto; background:none"
    in:dynamicTransition|global={{
      type: transition?.in?.type ? transition.in.type : null,
      duration:
        transition?.in?.duration && transition?.in?.type
          ? transition.in.duration
          : 0,
      delay:
        transition?.in?.delay && transition?.in?.type ? transition.in.delay : 0,
    }}
    out:dynamicTransition|global={{
      type: transition?.out?.type ? transition.out.type : null,
      duration:
        transition?.out?.duration && transition?.out?.type
          ? transition.out.duration
          : 0,
      delay:
        transition?.out?.delay && transition?.out?.type
          ? transition.out.delay
          : 0,
    }}
  >
    <CardContainer
      bind:isMouseEntered
      {intensity}
      style="border-radius: 20px; width:{width
        ? width + 'px'
        : width}; height: {height
        ? height + 'px'
        : height}px; margin:0; margin-bottom:10px;
    color: {color}; transition: all 1s ease-in-out;"
      id={mainId}
      {className}
    >
      <CardBody
        className=" "
        style="width:{width
          ? width + 'px'
          : width}; background-color: {background}; height:{height
          ? height + 'px'
          : height}; font-family: gilroy, sans-serif; transition: all 1s ease-in-out; {style}; "
        id="model-card-body"
      >
        <CardItem
          {isMouseEntered}
          translateZ={-50}
          style="font-size:23px; position:absolute; top:35px; left:30px; font-family: gilroy, sans-serif; transition:all 1s ease-in-out;"
          id="model-name"
        >
          {name}
        </CardItem>
        <CardItem
          {isMouseEntered}
          translateZ={-60}
          style="position:absolute; bottom:0; left:0; width:100%; height:60px; display:flex;"
        >
          <div style="width: 100%; height:100%">
            <div
              style="width:100%; height:100%; display:flex; justify-content:center; align-items:center; font-family: gilroy, sans-serif; transition:all .2s ease-out; position:absolute; bottom:0;"
              id="user-content"
            ></div>
          </div>
        </CardItem>
        <div
          style="position: absolute; right:0; top:0; height:100%; width:auto; font-family: gilroy, sans-serif; align-items:center; justify-content:center; display:flex;"
        >
          <CardItem
            {isMouseEntered}
            translateZ={-20}
            style="font-family: gilroy, sans-serif; max-width:300px; max-height:65px; padding:10px; margin-right:25px; text-align: right; -webkit-line-clamp: 2; -webkit-box-orient: vertical; display:-webkit-box;overflow:hidden; text-overflow:ellipsis; "
          >
            {description}
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>
  </div>
{/if}

<style>
  @font-face {
    font-family: "gilroy";
    src: url("./src/lib/assets/fonts/Gilroy-Light.otf") format("truetype");
  }
</style>
