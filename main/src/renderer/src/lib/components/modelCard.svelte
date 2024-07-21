<script lang="ts" customElements="model-card">
  import { onMount } from "svelte";
  import CardBody from "./ui/cardeff/CardBody.svelte";
  import CardContainer from "./ui/cardeff/CardContainer.svelte";
  import CardItem from "./ui/cardeff/CardItem.svelte";
  import { scale } from "svelte/transition";

  export let className: string = "";
  export let name: string = "";
  export let description: string = "";
  export let simplified_name: string = "";
  export let id: string;
  export let style: string = "";
  export let context: string | undefined = undefined;
  export let OnInstall: Function = null;
  export let OnClick: Function = null;
  export let OnFinish: Function = null;
  export let OnDelete: Function = null;
  export let OnError: Function = null;
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

  let loadState: boolean = true;
  let isMouseEntered = false;
  let mainId = id;
  let delbtnClicked = false;
  let downloadReadyCoolDown = 3000;
  let animation;

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

  if (!simplified_name) {
    throw new Error("There must be a valid simplified name prop");
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

    let loadSpeedCont = document.createElement('div')
    loadSpeedCont.style.width = "65px"
    loadSpeedCont.style.position = "absolute"
    loadSpeedCont.style.right = "0"
    loadSpeedCont.style.top = "6px";
    loadSpeedCont.style.transformOrigin = "right"
    loadSpeedCont.style.display = "flex"
    loadSpeedCont.style.flexDirection = "right"

    let loadSpeed = document.createElement("span");
    loadSpeed.style.fontWeight = "50";
    loadSpeed.style.fontSize = "13px";
    loadSpeed.style.opacity = "0.7";
    loadSpeed.style.position = "relative"
    loadSpeed.style.transformOrigin = "right"

    /*let loadSpeedUnit = document.createElement('span')
    loadSpeedUnit.style.fontWeight = "50";
    loadSpeedUnit.style.fontSize = "13px";
    loadSpeedUnit.style.opacity = "0.7";
    loadSpeedUnit.style.position = "absolute"
    loadSpeedUnit.style.right = "0"
    loadSpeedUnit.style.transformOrigin = "left"*/

    loadbarContainer.appendChild(loadbar);
    loadbarContainer.appendChild(loadStatus);
    loadSpeedCont.appendChild(loadSpeed);
    //loadSpeedCont.appendChild(loadSpeedUnit)
    loadbarContainer.appendChild(loadSpeedCont)

    document
      .getElementById(mainId)
      .querySelector("#user-content")
      .appendChild(loadbarContainer);

    return [loadbarContainer, loadbar, loadStatus, loadSpeed/*, loadSpeedUnit*/];
  }

  function initLoadingIntro(
    btnImg: HTMLImageElement,
    btnStyles: CSSStyleDeclaration
  ) {
    let [loadBarContainer, _loadBar, statusCont, speedCont/*, UnitCont*/] = getLoadBars();

    let status = document.createElement("span");
    status.style.opacity = "0";
    status.style.transition = "all 1s ease-out";
    status.style.position = "absolute";
    status.style.bottom = "43%";
    status.style.left = "70px";
    status.style.fontSize = "12px";
    status.id = "download-status-obj";
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
        }, downloadReadyCoolDown);
      }, 300);
    }, 1000);

    let waitForLoadBar = setInterval(() => {
      if (loadBar["ready"]) {
        clearInterval(waitForLoadBar);
        loadBarContainer.style.opacity = "1";
        status.style.transition = "none";
        status.style.opacity = "0";

        if (!OnInstall) {
          throw new Error(
            "An OnInstall event must be provided to pursue the loading"
          );
        }

        if (!OnFinish) {
          throw new Error(
            "An OnFinish event must be provided to pursue the loading"
          );
        }

        OnInstall(
          simplified_name.replace(" ", "").toLowerCase().trim(),
          _loadBar,
          statusCont,
          speedCont/*,
          UnitCont*/,
          () => {
            OnFinish().then(() => {
              loadBarContainer.style.opacity = "0";
              btnStyles.opacity = "0";
              document.getElementById(mainId).style.height = "130px";
            });
          }
        )
          .then((data) => {
            context = `Parameters: ${data?.parameters.replace("B", " B") || "0 B"}illion | Size: ${data?.size.toFixed(2) || 0.0}GB`;
            setTimeout(() => {
              btnStyles.opacity = "0";
              loadBarContainer.style.opacity = "0";

              loadBarContainer.ontransitionend = () => {
                document
                  .getElementById(mainId)
                  ?.querySelector("#user-content")
                  ?.removeChild(loadBarContainer);

                document
                  .getElementById(mainId)
                  ?.querySelector("#user-content")
                  ?.removeChild(btnImg.parentElement);

                (
                  document
                    .getElementById(mainId)
                    .querySelector("#user-content") as HTMLDivElement
                ).style.bottom = "0";

                (
                  document
                    .getElementById(mainId)
                    .querySelector("#model-card-body") as HTMLDivElement
                ).style.height = "130px";

                setTimeout(setComponentContextEvents, 200);
              };
            }, 500);
          })
          .catch((e: ErrorEvent) => {
            if (e.message != "install failed") {
              console.log(e);
              throw new Error(
                "The OnInstall Event must require three prop being [LoadingBarContainer, loadingBar, statusContainer]"
              );
            } else {
              loadBar["ready"] = false;
              loadBarContainer.style.opacity = "0";

              (
                document
                  .getElementById(mainId)
                  .querySelector("#user-content") as HTMLDivElement
              ).style.bottom = "0";

              btnStyles.cursor = "pointer";
              btnStyles.animation = "none";
              setTimeout(() => {
                btnStyles.opacity = "1";
                btnStyles.transform = "rotate(0deg)";
                btnStyles.animation = "loadingFade 2s infinite";
                btnStyles.animationPlayState = "paused";
              }, 100);

              btnImg.src = "./src/lib/assets/icons/install.svg";
              btnImg.style.animation = "none";

              setTimeout(() => {
                btnImg.style.transform = "rotate(0deg)";
                btnImg.style.opacity = "1";
                btnImg.style.animation = "loadingSpin 2s infinite";
                btnImg.style.animationPlayState = "paused";

                status.style.opacity = "1";
                status.style.color = "red";
                status.innerText = `Failed to download ${simplified_name}`;
              }, 100);

              (
                document
                  .getElementById(mainId)
                  .querySelector("#model-card-body") as HTMLDivElement
              ).style.height = "130px";

              document.getElementById("model-name").style.top = "35px";
              document.getElementById("model-name").style.fontSize = "23px";

              setTimeout(() => {
                document
                  .getElementById(mainId)
                  .querySelector("#user-content")
                  .removeChild(loadBarContainer);

                btnImg.style.pointerEvents = "all";
                btnStyles.pointerEvents = "all";
                downloadReadyCoolDown = 1000;
              }, 400);
            }
          });
      }
    }, 100);
  }

  function load() {
    //loadKey[mainId] = true
    //loadKey = {}
    if (!context) {
      animation = document.createElement("style");

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

      let btnContainer = document.createElement("button");
      btnContainer.id = "model-install-btn";

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
      btnStyles.pointerEvents = "all";
      btnStyles.userSelect = "all";

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
          if (
            card
              .querySelector("#user-content")
              .querySelector("#download-status-obj")
          )
            card
              .querySelector("#user-content")
              .removeChild(
                card
                  .querySelector("#user-content")
                  .querySelector("#download-status-obj")
              );

          (card.querySelector("#model-card-body") as HTMLElement).style.height =
            "170px";
          (card.querySelector("#model-name") as HTMLElement).style.fontSize =
            "26px";
          (card.querySelector("#model-name") as HTMLElement).style.top = "40px";

          initLoadingIntro(btnImg, btnStyles);
        });
    } else {
      setComponentContextEvents();
    }
  }

  function setComponentContextEvents() {
    let mainContainer = document.getElementById(mainId);
    let modelCardBody = mainContainer.querySelector(
      "#model-card-body"
    ) as HTMLDivElement;
    let modelName = mainContainer.querySelector(
      "#model-name"
    ) as HTMLSpanElement;
    let modelContext = mainContainer.querySelector(
      "#model-context"
    ) as HTMLSpanElement;
    let userContent = mainContainer.querySelector(
      "#user-content"
    ) as HTMLDivElement;
    let delTransition = mainContainer.querySelector(
      "#del-transition"
    ) as HTMLDivElement;

    let contextText = document.createElement("span");
    contextText.innerText = context || "No data available";
    let contextStyles = contextText.style;
    contextStyles.position = "absolute";
    contextStyles.left = "1%";
    contextStyles.padding = "0";
    contextStyles.marginLeft = "30px";
    contextStyles.bottom = "40%";
    contextStyles.height = "20px";
    contextStyles.fontFamily = "Gilroy, sans-serif";
    contextStyles.fontSize = "14px";
    contextStyles.fontWeight = "100";
    contextStyles.transition = "all 1s ease-out";
    contextStyles.opacity = "0";

    let deletebtnCont = document.createElement("div");
    deletebtnCont.style.height = "70px";
    deletebtnCont.style.width = "70px";
    deletebtnCont.style.borderRadius = "50% 0 0 0";
    deletebtnCont.style.background =
      "radial-gradient(circle at bottom right, black, transparent 70%)";
    deletebtnCont.style.transition = "all 1s ease-out";
    deletebtnCont.style.zIndex = "99 !important";

    let imgcontainer = document.createElement("button");
    imgcontainer.style.background = "none";
    imgcontainer.style.border = "none";
    imgcontainer.style.cursor = "pointer";
    imgcontainer.style.position = "absolute";
    imgcontainer.style.height = "20px";
    imgcontainer.style.width = "50px";
    imgcontainer.style.bottom = "10px";
    imgcontainer.style.right = "10px";
    imgcontainer.style.alignItems = "center";
    imgcontainer.style.justifyContent = "center";
    imgcontainer.style.opacity = ".5";
    imgcontainer.style.transition = "all 1s ease-out";

    let delete_txt = document.createElement("span");
    delete_txt.innerText = "delete";
    delete_txt.style.color = "red";
    delete_txt.style.position = "absolute";
    delete_txt.style.display = "block";
    delete_txt.style.right = "0";
    delete_txt.style.bottom = "0px";
    delete_txt.style.fontSize = "15px";
    delete_txt.style.opacity = "0";
    delete_txt.style.transition = "all 1s ease-in-out";

    let img = document.createElement("img");
    img.style.height = "20px";
    img.style.position = "absolute";
    img.style.right = "0";
    img.style.bottom = "0";
    img.style.filter = "grayscale(100%) invert(100%)";
    img.style.transition = "all 1s ease-out";
    img.src = "./src/lib/assets/icons/delete-red.svg";

    const showdel = () => {
      delete_txt.style.right = "25px";
      delete_txt.style.opacity = "1";
      imgcontainer.style.opacity = "1";
      img.style.filter = "grayscale(10%) invert(0%)";
    };

    const hidedel = () => {
      delete_txt.style.right = "0";
      delete_txt.style.opacity = "0";
      imgcontainer.style.opacity = "0.5";
      img.style.filter = "grayscale(100%) invert(100%)";
    };

    imgcontainer.appendChild(img);
    imgcontainer.appendChild(delete_txt);
    deletebtnCont.appendChild(imgcontainer);

    userContent.appendChild(contextText);

    mainContainer.querySelector("#importance-layer").appendChild(deletebtnCont);

    deletebtnCont.onmouseenter = () => {
      deletebtnCont.style.height = "120px";
      deletebtnCont.style.width = "120px";
      showdel();
    };

    deletebtnCont.onmouseleave = () => {
      deletebtnCont.style.height = "70px";
      deletebtnCont.style.width = "70px";
      hidedel();
    };

    deletebtnCont.onclick = () => {
      delbtnClicked = true;
    };

    imgcontainer.onclick = () => {
      delete_txt.style.display = "none";
      imgcontainer.style.pointerEvents = "none";
      imgcontainer.style.userSelect = "none";

      delTransition.style.opacity = "1";
      delTransition.style.width = "200%";

      img.style.opacity = "0";
      img.ontransitionend = () => {
        img.src = "./src/lib/assets/icons/loading.png";
        img.style.filter = "grayscale(100%)";
        img.style.animation = "loadingSpin 2s infinite";

        img.ontransitionend = () => {
          img.style.opacity = "1";

          if (!OnDelete) {
            throw new Error(
              "An async delete function must be provided to pursue the model deletion"
            );
          }

          OnDelete(simplified_name.replace(" ", "").trim().toLowerCase())
            .then(() => {
              context = null;
              deletebtnCont.style.opacity = "0";

              deletebtnCont.ontransitionend = () => {
                load();
                mainContainer
                  .querySelector("#importance-layer")
                  .removeChild(deletebtnCont);

                userContent.removeChild(contextText);

                delTransition.style.opacity = "0";
                delTransition.style.width = "0%";
              };
            })
            .catch(() => {
              img.style.opacity = "0";
              img.style.animation = "none";
              img.style.transform = "unset";
              img.style.filter = "grayscale(100%) invert(100%)";
              img.src = "./src/lib/assets/icons/delete-red.svg";

              img.ontransitionend = () => {
                img.style.opacity = "1";
                delete_txt.style.display = "unset";
                imgcontainer.style.pointerEvents = "all";
                imgcontainer.style.userSelect = "all";
                deletebtnCont.style.opacity = "1";
              };

              delTransition.style.opacity = "0";
              delTransition.style.width = "0%";

              contextText.style.color = "red";
              contextText.innerText = "Failed to uninstall model";

              setTimeout(() => {
                contextText.style.opacity = "0";

                contextText.ontransitionend = () => {
                  contextText.style.color = "white";
                  contextText.innerText = context;
                  contextText.style.opacity = "1";
                };
              }, 3000);
              console.log("Failed to uninstall model");
            });
        };
      };
    };

    setTimeout(() => {
      contextStyles.opacity = "1";
    }, 200);

    mainContainer.onmouseenter = () => {
      modelCardBody.style.marginLeft = "5px";
      modelName.style.transform = "translateZ(50px)";
      modelName.style.textShadow = "black 5px 3px 10px";
      modelContext.style.transform = "translateZ(50px)";
      modelContext.style.textShadow = "black 5px 3px 10px";
      userContent.style.transform = "translateZ(50px)";
      userContent.style.textShadow = "black 5px 3px 10px";
    };

    mainContainer.onmouseleave = () => {
      modelCardBody.style.marginLeft = "0px";
      modelName.style.transform = "translateZ(0px)";
      modelName.style.textShadow = "none";
      modelContext.style.transform = "translateZ(0px)";
      modelContext.style.textShadow = "none";
      userContent.style.transform = "translateZ(0px)";
      userContent.style.textShadow = "none";
    };

    mainContainer.onclick = () => {
      if (!delbtnClicked) {
        if (!OnClick) {
          throw new Error(
            "The OnClick Event must be provided to switch models"
          );
        }

        mainContainer.style.transition = "all 2s ease-out";
        mainContainer.style.transform = "scale(0.95)";
        mainContainer.style.opacity = "0.6";

        OnClick(simplified_name.replace(" ", "").trim().toLowerCase()).catch(
          (e) => {
            console.log(e);
            throw new Error(
              "The OnClick Event must require one prop being modelName"
            );
          }
        );
      } else {
        delbtnClicked = false;
      }
    };
  }

  onMount(() => {
    load();
  });

  function dynamicTransition(node, params) {
    let { type, duration, delay, easing, start, opacity } = params;

    if (!type) {
      type = scale;
      duration = 0;
      delay = 0;
      start = 0;
      opacity = 0;
    }

    const transformRequest = (type) => {
      return type ? type : null;
    };

    const tr = transformRequest(type);
    return tr(node, { duration, delay, easing, start, opacity });
  }
</script>

{#if loadState}
  <div
    id="main-container-transition"
    style="width: {width}; height: {height}; background:none"
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
      opacity:
        transition?.out?.opacity && transition?.out?.type
          ? transition.out.opacity
          : 0,
      start:
        transition?.out?.start && transition?.out?.type
          ? transition.out.start
          : 0,
    }}
  >
    <CardContainer
      bind:isMouseEntered
      {intensity}
      style="border-radius: 20px; z-index:95; width:{width
        ? width + 'px'
        : width}; height: {height
        ? height + 'px'
        : height}px; margin:0; margin-bottom:10px;
    color: {color}; transition: all 1s ease-in-out;
    transform: scale(1); opacity:1;"
      id={mainId}
      {className}
    >
      <CardBody
        className=" "
        style="width:{width
          ? width + 'px'
          : width}; background-color: {background}; height:{height
          ? height + 'px'
          : height}; font-family: gilroy, sans-serif; transition: all 1s ease-in-out; {style}; margin-left:0px;"
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
              style="width:100%; height:100%; display:flex; justify-content:center; align-items:center; font-family: gilroy, sans-serif; transition:all .2s ease-out; position:absolute; bottom:0; pointer-events:none; user-select:none;"
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
            style="font-family: gilroy, sans-serif; max-width:300px; max-height:65px; padding:10px; margin-right:25px; text-align: right; -webkit-line-clamp: 2; -webkit-box-orient: vertical; display:-webkit-box;overflow:hidden; text-overflow:ellipsis; transition:all .5s ease-out; pointer-events:none; user-select:none;"
            id="model-context"
          >
            {description}
          </CardItem>
        </div>
        <div
          id="importance-layer"
          style="width:auto; height:auto; display:flex; justify-content:center; align-items:center; position:absolute; bottom:0; right:0; z-index:99;"
        ></div>

        <CardItem
          translateZ={-20}
          style="width:0%; height:100%;position:absolute; top:0; right:0; transform-origin: right; transition: all 1s ease-in-out; background-image:linear-gradient(to left, black 50%, transparent 100%); pointer-events:none; user-select:none; opacity:0; "
          id="del-transition"
        ></CardItem>
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
