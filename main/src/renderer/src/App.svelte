<script lang="ts">
  import { onMount } from "svelte";
  import { slide, scale, fly } from "svelte/transition";
  import { quintOut } from 'svelte/easing';  
  import ollama from "ollama/browser";
  import {
    createRequestBox,
    createResponseBox,
  } from "./lib/components/message.ts";

  import { marked } from "marked";

  import { modelFiles, validModels } from "./lib/components/model.ts";
  import {
    getAvailableModels,
    installModel,
    installedModels,
    removeModelTempFiles,
    getSpecificContext,
  } from "./lib/components/utilities.ts";

  import { getCodeBlock } from "./lib/components/codeblock.ts";
  import ModelCard from "./lib/components/modelCard.svelte";
  import Option from "./lib/components/option.svelte";

  const userData = JSON.parse(localStorage.getItem("userData")) || {
    lastModel: null,
    streamMode: true,
    useStock: false,
    removeTempFiles: false,
  };

  localStorage.setItem("userData", JSON.stringify(userData));

  function updateUserData() {
    localStorage.setItem("userData", JSON.stringify(userData));
  }

  let navOpen = false;

  let useStock = false;

  let modelPopupOpen = false;

  let autoSelectAtInstall = false;

  let modelPopupKey = {};

  let removeTempFiles = false;

  let actualModel;

  let formatedMessage = "\\";

  let messages = {
    user: [],
    llama: [],
  };

  let responseStatus:boolean = false;

  let useBasicOptions = false;

  let streamMode = true;

  let options: Array<optionObject> = [
    {
      name: "Reset chat",
      event: () => {
        let messageSection = document.querySelector("#message-section");
        while (messageSection?.lastElementChild) {
          messageSection.removeChild(messageSection.lastElementChild);
        }

        messages.user = [];
        messages.llama = [];
      },
      type: "promise",
    },
    {
      name: "Change model",
      event: () => {
        openModelPopUpMenu();
        navOpen = false;
        fetchAvailableModels();
        setTimeout(() => loadEventListeners(), 400);
      },
      type: "promise",
    },

    {
      name: "More options",
      event: openAddopt,
      type: "promise",
    },

    {
      name: "Exit the app",
      style: "margin-top:100px;",
      type: "promise",
      event: () => {
        console.log("app closed");
      },
    },
  ];

  let addit_opt: Array<optionObject> = [
    {
      name: `${!useStock ? "Use Stock Model" : "Use Custom Model"}`,
      event: () => {
        useStock = !useStock;
      },
      values: ["Use Stock Model", "Use Custom Model"],
      type: "incrementation",
    },
    {
      name: `${streamMode ? "Disable Stream Mode" : "Enable Stream Mode"}`,
      event: () => {
        streamMode = !streamMode;
      },
      values: ["Disable Stream Mode", "Enable Stream Mode"],
      type: "incrementation",
    },
    {
      name: "Auto Select after Install",
      value: autoSelectAtInstall ? "False" : "True",
      event: () => {
        streamMode = !streamMode;
      },
      values: ["False", "True"],
      type: "incrementation",
    },
  ];

  function openAddopt() {
    navOpen = false;
    useBasicOptions = false;
    setTimeout(() => {
      navOpen = true;
    }, 1100);
  }

  function openModelPopUpMenu() {
    //let differ = 50;
    //let delayDiffer = validModels.length * differ;
    modelPopupOpen = true;
    setTimeout(() => {
      let styles = document.getElementById("model-popup-parent").style;

      styles.opacity = "1";
      styles.transform = "scale(1)";
      document.getElementById("back-filter").style.backgroundColor =
        "rgba(0, 0, 0, 0.5)";
      document.getElementById("back-filter").style.backdropFilter = "blur(3px)";
    }, 300);
  }

  function fetchAvailableModels() {
    getAvailableModels().then(async (modes) => {
      if (modes.length == 0) {
        console.log("No model found");
        openModelPopUpMenu();
        setTimeout(() => loadEventListeners(), 400);
        return;
      } else {
        let promise = new Promise((resolve, _) => {
          if (
            installedModels.includes(
              userData.lastModel.trim().replace(" ", "").toLowerCase()
            )
          ) {
            console.log(userData);
            actualModel = userData.lastModel
              .trim()
              .replace(" ", "")
              .toLowerCase();
            resolve(null);
          } else if (installedModels.includes("llama2")) {
            actualModel = "llama2";
            resolve(null);
          } else {
            console.log("Llama2 not installed");
            setTimeout(() => {
              resolve(null);
            }, 10);
          }
        });
        promise.then(() => {
          modes.forEach((model) => {
            console.log(model);

            try {
              validModels.forEach((obj) => {
                if (
                  obj.name.toLowerCase().replace(" ", "") ==
                  model.simplified_name
                ) {
                  console.log("true");
                  obj.context = `Parameters: ${model.description.parameters.replace("B", " B")}illion | Size: ${model.description.size.toFixed(2)}GB`;
                }
              });

              setTimeout(() => {
                loadEventListeners();
              }, 1000);
            } catch (err) {
              if (err instanceof TypeError) {
                return;
              } else {
                console.log(err);
                return;
              }
            }
          });
        });
      }
      if (actualModel) {
        (async () =>
          await ollama.create({
            model: !useStock ? "OverAI:" + actualModel : actualModel,
            modelfile: modelFiles[actualModel.toLowerCase()],
          }))();
      } else {
        console.log("No model selected");
      }
    });
  }

  function verifyLengthInBounds() {
    let maxTokens: number;

    if (actualModel == "llama1") {
      maxTokens = 2048;
    } else if (actualModel == "llama2") {
      maxTokens = 4092;
    } else if (actualModel == "llama3") {
      maxTokens = 8000;
    } else if (actualModel == "mistral") {
      maxTokens = 32000;
    } else {
      maxTokens = 8000;
    }

    if (formatedMessage.length > maxTokens) {
      formatedMessage = "\\";
    }
  }

  function AIPromptFormat(message: string, role: string) {
    if (formatedMessage == "") {
      formatedMessage = `\\`;
    }

    if (role == "user") {
      formatedMessage += ` [INST] ${message} [/INST] `;
    } else if (role == "AI") {
      formatedMessage += ` ${message} `;
    }
  }

  //async function MarktoHTML(message: string) {
  //message = message
  //.replace("----", "")
  //.replace(
  ///```(.+?)\n([\s\S]+?)```/g,
  //'<pre><code class="$1">$2</code></pre>'
  //)
  //.replace(/``(.+?)\n([\s\S])``/g, "<code>$1</code>")
  //.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
  //.replace(/\*(.+?)\*/g, "<i>$1</i>")
  //.replace(/__(.+?)__/g, "<u>$1</u>")
  //.replace(/~~(.+?)~~/g, "<s>$1</s>")
  //.replace(/==(.+?)==/g, "<mark>$1</mark>")
  //.replace("\\n", "<br>")
  //.replace(/#(.+?)/g, "<h1>$1</h1>")
  //.replace(/##(.+?)/g, "<h3>$1</h3>")
  //.replace(/###(.+?)/g, "<h5>$1</h5>");
  //  return message;
  //}

  function verifycodeblocks(
    DOMContainer: HTMLParagraphElement,
    message: string
  ) {
    let codeObject =
      message.match(/```(.+?)\n([\s\S]+?)```/g) ||
      message.match(/```\n([\s\S]+?)```/g) ||
      [];

    if (codeObject.length > 0) {
      let promise: Promise<any> = null;
      message = message.replace(codeObject[0], "");
      let code =
        codeObject[0].match(/```\n([\s\S]+?)```/) ||
        codeObject[0].match(/```.*\n([\s\S]+?)```/) ||
        codeObject[0].match(/\[code\]\n([\s\S]+?)\[\/code\]/);

      console.log(code);
      console.log(codeObject);

      if (code) {
        console.log(code);
        let codeText = code[1] || "";

        let text: HTMLParagraphElement = document.createElement("p");
        text.style.margin = "10px";
        text.style.padding = "20px";
        text.style.paddingRight = "40px";
        text.style.color = "black";
        text.style.textAlign = "right";
        text.style.fontSize = "20px";
        text.style.fontFamily = "gilroy";
        text.id = "cont-text";

        promise = new Promise((resolve, _) => {
          let codeBlock = getCodeBlock({
            code: codeText,
            language: codeObject[0].match(/```(.+?)\n/)
              ? codeObject[0].match(/```(.+?)\n/)[1]
              : null,
          });
          setTimeout(() => {
            DOMContainer.innerHTML = DOMContainer.innerHTML.replace(
              codeText,
              ""
            );
            setTimeout(() => {
              console.log(codeBlock);
              DOMContainer.parentElement.appendChild(codeBlock);
              setTimeout(() => {
                DOMContainer.parentElement.appendChild(text);
                resolve(null);
              }, 100);
            }, 100);
          }, 50);
        });
        promise.then(() => {
          return [message as string, text as HTMLParagraphElement];
        });
      }
      return [message as string, DOMContainer as HTMLParagraphElement];
    }
    return [message as string, DOMContainer as HTMLParagraphElement];
  }

  async function sendResponse(
    message: any,
    DOMcontainer: HTMLParagraphElement,
    promise: any
  ) {
    verifyLengthInBounds();

    if (
      message[message.length - 1].role &&
      message[message.length - 1].content
    ) {
      AIPromptFormat(
        message[message.length - 1].content,
        message[message.length - 1].role
      );

      let response = await ollama.chat({
        model: !useStock ? "OverAI:" + actualModel : actualModel,
        messages: [
          {
            role: "user",
            content: formatedMessage,
            images: Array.from(message[message.length - 1].images),
          },
        ],
        stream: streamMode,
        keepAlive: 100000,
      });

      let completeMessage = "";

      DOMcontainer.style.textAlign = "justfiy";

      if (streamMode) {
        for await (let part of response) {
          completeMessage += part.message.content;
          DOMcontainer.innerHTML = await marked.parse(
            completeMessage.replace(
              /^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/,
              ""
            ),
            { breaks: true, gfm: true, silent: false }
          );

          completeMessage = completeMessage
            .replace("[code]", "")
            .replace("[/code]", "");

          [completeMessage, DOMcontainer] = verifycodeblocks(
            DOMcontainer,
            completeMessage
          ) as [string, HTMLParagraphElement];

          //console.log(DOMcontainer.id);

          document
            .getElementById("message-section")
            .scrollTo(
              0,
              document.getElementById("message-section").scrollHeight
            );
        }
        if (promise) {
          await promise();
          return completeMessage;
        } else {
          return completeMessage;
        }
      } else {
        response.message.content = await marked.parse(
          response.message.content.replace(
            /^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/,
            ""
          )
        );
        if (promise) {
          await promise();
          return response;
        } else {
          return response;
        }
      }
    }
  }

  function changeUserInterState(forceState: string = null) {
    let bruteForceState: boolean;
    forceState
      ? (bruteForceState = String(forceState).toLowerCase() === "true")
      : (bruteForceState = null);
    document.querySelectorAll("button")?.forEach((btn: HTMLButtonElement) => {
      forceState
        ? (btn.disabled = !btn.disabled)
        : (btn.disabled = bruteForceState);
    });
    document.querySelectorAll("input")?.forEach((input: HTMLInputElement) => {
      input.disabled = !input.disabled;
    });
  }

  function loadEventListeners() {
    document.querySelector("#send-btn")?.addEventListener("click", passResp);
    document
      .getElementById("img-handler")
      ?.addEventListener("change", handleImageRequest);
  }

  onMount(() => {
    loadEventListeners();
    fetchAvailableModels();
  });

  async function onModelInstallClick(
    modelName: string,
    loadBar: HTMLDivElement,
    status: HTMLParagraphElement
  ) {
    try {
      await installModel(modelName, loadBar, status);

      if (autoSelectAtInstall) await changeModel(modelName);
      if (removeTempFiles) {
        removeModelTempFiles(modelName, loadBar);
      }

      return await getSpecificContext(modelName);
    } catch (e) {
      throw new Error("install failed");
    }
  }

  function toggleNav() {
    console.log("toggling nav");
    useBasicOptions = true;
    navOpen = !navOpen;
  }

  async function convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string)
          .split(",")[1]
          .replace('"', "");
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  async function passResp() {
    console.log("passing response");
    let resp = {
      text: (
        document
          .getElementById("main-input")
          .querySelector("input") as HTMLInputElement
      )?.value,
      media: [] as string[],
    };

    if (resp.text) {
      changeUserInterState("true");

      const imgElements = document.querySelectorAll("#img-container img");
      for (let img of imgElements) {
        if (img.id != "del-icn") {
          const file = await fetch((img as HTMLImageElement).src).then((r) =>
            r.blob()
          );
          if (file.type.startsWith("image/")) {
            const base64Image = await convertToBase64(file as File);
            resp.media.push(base64Image);
          }
        }
      }

      //document.getElementById("await-response").style.visibility = "visible";
      responseStatus = true;
      (document.querySelector("#input-box-main") as HTMLInputElement).value =
        "";
      document.getElementById("main-input").style.height = "50px";
      (
        document
          .getElementById("main-input")
          .querySelector("input") as HTMLInputElement
      ).style.marginBottom = "unset";

      messages.user.push({
        role: "user",
        content: resp.text,
        images: resp.media,
      });

      createRequestBox(
        document.getElementById("main-input") as HTMLDivElement,
        document.getElementById("message-section") as HTMLDivElement,
        resp
      );

      if (!streamMode) {
        sendResponse(messages.user, null, () => {
          resp = {
            text: "",
            media: [],
          };
        }).then((response) => {
          messages.llama.push(response?.message?.content as string);
          AIPromptFormat(response?.message?.content, "AI");

          let doms = createResponseBox(
            document.getElementById("main-input") as HTMLDivElement,
            actualModel
          );
          let ParMessage = doms[0];
          let text = doms[2];

          text.innerHTML = response?.message?.content || "No response";
          document.querySelector("#message-section")?.appendChild(ParMessage);

          //document.getElementById("await-response").style.visibility = "hidden";
          responseStatus = false
          document
            .getElementById("message-section")
            .scrollTo(
              0,
              document.getElementById("message-section").scrollHeight
            );

          changeUserInterState("false");
        });
      } else {
        let doms = createResponseBox(
          document.getElementById("main-input") as HTMLDivElement,
          actualModel
        );
        let ParMessage = doms[0];
        document.querySelector("#message-section")?.appendChild(ParMessage);

        let TextElement = document
          .querySelector("#message-section")
          ?.lastElementChild.querySelector("p") as HTMLParagraphElement;

        sendResponse(messages.user, TextElement, null).then((response) => {
          messages.llama.push(response as string);
          AIPromptFormat(response, "AI");
          //document.getElementById("await-response").style.visibility = "hidden";
          responseStatus = false

          document
            .getElementById("message-section")
            .scrollTo(
              0,
              document.getElementById("message-section").scrollHeight
            );
          changeUserInterState("false");
        });
      }
    }
  }

  async function changeModel(model: string) {
    document.getElementById("back-filter").style.backdropFilter = "none";
    document.getElementById("back-filter").style.background = "none";

    actualModel = model.replace("OverAI:", "");
    formatedMessage = "\\";

    userData.lastModel = actualModel;
    updateUserData();

    console.log(localStorage);

    if (actualModel) {
      await ollama.create({
        model: "OverAI:" + actualModel,
        modelfile: modelFiles[actualModel.toLowerCase()],
      });

      modelPopupOpen = false;
    } else {
      console.log("No model selected");
      openModelPopUpMenu();
    }
  }

  let imgpathHistory = [];
  let supportFileFormats = ["image/png", "image/jpeg", "image/jpg"];

  function handleImageRequest() {
    imgpathHistory = [];
    console.log("handling image request");

    document.getElementById("main-input").style.height = "90px";
    document
      .getElementById("main-input")
      .querySelector("input").style.marginBottom = "-40px";

    function closeImgContainer() {
      document
        .getElementById("main-input")
        .querySelector("#img-container")
        .remove();
      document.getElementById("main-input").style.height = "50px";
      document
        .getElementById("main-input")
        .querySelector("input").style.marginBottom = "unset";
    }

    let imgcontainer;

    if (
      !document.getElementById("main-input").querySelector("#img-container")
    ) {
      imgcontainer = document.createElement("div");
      imgcontainer.id = "img-container";
      imgcontainer.style.display = "flex";
      imgcontainer.style.flexDirection = "row";
      imgcontainer.style.width = "60%";
      imgcontainer.style.height = "50px";
      imgcontainer.style.position = "absolute";
      imgcontainer.style.top = "0";
      imgcontainer.style.left = "17%";
      imgcontainer.style.overflowX = "scroll";
      imgcontainer.style.overflowY = "hidden";

      let style = document.createElement("style");
      style.innerHTML = `
        #img-container::-webkit-scrollbar {
          display: none;
        }
      `;
      document.head.appendChild(style);

      document.getElementById("main-input").appendChild(imgcontainer);
    } else {
      imgcontainer = document
        .getElementById("main-input")
        .querySelector("#img-container");
    }

    let imageHandler = document.getElementById(
      "img-handler"
    ) as HTMLInputElement;

    Array.from(imageHandler.files).forEach((file) => {
      if (imgpathHistory.includes(file.path)) {
        if (
          !document
            .getElementById("main-input")
            .querySelector("#img-container")
            .querySelector("#img-child-container")
        ) {
          closeImgContainer();
        }
        return null;
      }

      let childcontainer = document.createElement("div");
      childcontainer.id = "img-child-container";
      childcontainer.style.height = "50px";
      childcontainer.style.width = "auto";
      childcontainer.style.borderRadius = "10px";
      childcontainer.style.backgroundColor = "rgba(86, 86, 86, 0.473)";
      childcontainer.style.backdropFilter = "blur(1px)";
      childcontainer.style.alignItems = "center";
      childcontainer.style.justifyContent = "center";
      childcontainer.style.marginRight = "10px";
      childcontainer.style.transition = "all .5s ease-out";

      if (supportFileFormats.includes(file.type)) {
        let img = document.createElement("img");
        img.src = URL.createObjectURL(file); // Create a URL representing the file
        img.style.height = "50px";
        img.style.borderRadius = "10px";
        img.style.margin = "0 10px 0 10px";
        img.style.filter = "blur(0px)";
        img.style.transition = "all .5s ease-out";

        let delImgCont = document.createElement("div");
        delImgCont.style.position = "absolute";
        delImgCont.style.top = "0";
        delImgCont.style.right = "0";
        delImgCont.style.width = "100%";
        delImgCont.style.height = "100%";
        delImgCont.style.display = "flex";
        delImgCont.style.alignItems = "center";
        delImgCont.style.justifyContent = "center";
        delImgCont.style.zIndex = "2";
        delImgCont.style.cursor = "pointer";

        let delImg = document.createElement("img");
        delImg.src = "src/lib/assets/icons/delete.svg";
        delImg.style.height = "30px";
        delImg.style.position = "relative";
        delImg.style.margin = "auto";
        delImg.style.transition = "all .5s ease-out";
        delImg.style.opacity = "0";
        delImg.style.zIndex = "1";
        delImg.style.pointerEvents = "none";
        delImg.style.transform = "scale(1.1)";
        delImg.id = "del-icn";

        delImgCont.onmouseover = () => {
          delImg.style.transform = "scale(1)";
          delImg.style.opacity = "1";
          img.style.filter = "blur(2px)";
        };
        delImgCont.onmouseout = () => {
          delImg.style.transform = "scale(1.1)";
          delImg.style.opacity = "0";
          img.style.filter = "blur(0px)";
        };
        delImgCont.onclick = () => {
          childcontainer.style.transform = "scale(0.9)";
          childcontainer.style.opacity = "0";
          setTimeout(() => {
            childcontainer.remove();
            imgpathHistory = imgpathHistory.filter(
              (path) => path !== file.path
            );

            if (
              !document
                .getElementById("main-input")
                .querySelector("#img-container")
                .querySelector("#img-child-container")
            ) {
              closeImgContainer();
            }
          }, 300);
        };

        delImgCont.appendChild(delImg);
        childcontainer.appendChild(delImgCont);
        childcontainer.appendChild(img);
      } else {
        console.log("unsupported file type");
        if (
          !document
            .getElementById("main-input")
            .querySelector("#img-container")
            .querySelector("#img-child-container")
        ) {
          closeImgContainer();
        }
        return null;
      }

      imgpathHistory.push(file.path);
      imgcontainer.appendChild(childcontainer);
    });
    imageHandler.value = "";
  }

  window.addEventListener("keydown", (event) => {
    if (event.key == "Escape") {
      document.getElementById("back-filter").style.backdropFilter = "none";
      document.getElementById("back-filter").style.background = "none";
      navOpen = false;
      modelPopupOpen = false;
      document.getElementById("focus-dummy").focus();
    }
  });

  $: navBarBorderColor = navOpen ? "gray" : "transparent";

  $: discBlurEffect = navOpen || modelPopupOpen ? "3px" : "0px";

  $: LogoTopValue = navOpen ? "20%" : "100%";
</script>

<link
  rel="stylesheet"
  href="./src/lib/assets/packages/highlightjs/default.min.css"
/>

<body style="background-color: transparent;">
  <!--Very bad coding practice, but I cannot unfocus an element is HTML-->
  <input
    type="button"
    id="focus-dummy"
    style="pointer-events:none; user-select:none; opacity:0; position:absolute; width:1px; height:1px; top:0; right:0"
  />
  <div
    id="main"
    style="background-image: radial-gradient(circle, #ffffff, #000000 200%); height:583px; width:1200px; border-radius:20px; margin:auto"
  >
    {#if modelPopupOpen}
      {#key modelPopupKey}
        <div
          id="model-popup-parent"
          style="width:100%; height:100%; position:absolute; top:0; left:0; 
          align-items:center; justify-content:center; z-index: 98;
          opacity:0; transform:scale(0.9); transition:all .5s ease-in-out;"
          out:scale={{ duration: 500, start: 0.9, opacity: 0 }}
        >
          <div
            id="model-popup"
            style="margin: 0; margin-left:auto; margin-right:auto; 
          background-color:rgba(0, 0, 0, 0.900); backdrop-filter: blur(90px);
          top: 50%; left:50%; transform: translateY(-50%) translateX(-50%); border-radius:20px;
          width:auto; height:80%; margin:auto;
          display:block; overflow-y:scroll;
          overflow-x:hidden; align-items:center; justify-content:center;
          position:absolute; z-index:99; box-shadow: 0 0 10px 1px rgba(170, 170, 170, 0.4)"
          >
            {#each validModels as model}
              <ModelCard
                name="{model.name} {model.additionalName}"
                simplified_name={model.name}
                description={model.description}
                OnInstall={onModelInstallClick}
                OnClick={async (modelName) => {
                  await changeModel(modelName);
                }}
                OnFinish={() => {
                  console.log("install completed");
                  return null;
                }}
                context={installedModels.includes(
                  model.name.trim().replace(" ", "").toLowerCase()
                )
                  ? model.context || "No data available"
                  : null}
                loadBar={{
                  initialStatus: "loading",
                  ready: false,
                }}
                id="{model.id},"
                style="border-top: 1px solid #000; border-top-right-radius: 20px; border-top-left-radius:20px; border-bottom-left-radius: 20px; border-bottom: none;"
                width="500"
                height="130"
                intensity="3, 30"
                background="rgba(255, 255, 255, 0.190)"
                color="white"
                ButtonReactivity={{
                  invert: ["65%", "100%"],
                  scale: [1, 1.1],
                }}
                transition={{
                  in: {
                    type: blur,
                    duration: 500,
                    delay: 0,
                    opacity: 0,
                    start: 0,
                  },
                  out: {
                    type: scale,
                    duration: 1500,
                    delay: 0,
                    opacity: 0,
                    start: 0.95,
                  },
                }}
              />
            {/each}
          </div>
          <div
            id="title-container"
            style="position: absolute; height:80%; width:50%; top:50%; left:50%; transform: translate(-40%, -50%); align-items:center; justify-content:center; pointer-events:none; user-select:none; z-index:1"
          >
            <h1
              style="position:relative; font-size:110px; opacity:5%; color:lightgray; top:5%; left:-10px; transform:translateY(5%)"
            >
              Choose a model
            </h1>
          </div>
        </div>
      {/key}
    {/if}

    <div
      id="nav-section"
      style="width: 20%; height:100%; left:0; position:absolute; align-items:center; justify-content: center; border-right-width: .5px; border-right-color: {navBarBorderColor}; border-right-style: solid; transition:all 1s ease-out;"
    >
      <button id="app-name" on:click={toggleNav}>
        <h1 style="text-align: center; margin-top:{LogoTopValue};">OverAI</h1>
      </button>

      {#if navOpen}
        <div
          id="choices"
          in:slide={{ duration: 1000, delay: 700 }}
          out:slide={{ duration: 700 }}
        >
          {#if useBasicOptions}
            {#each options as opt (opt.name)}
              <Option
                name=""
                value={opt.name}
                onClick={opt.event || (() => {})}
                _id={Math.random().toString(36).substring(7)}
                style={opt.style || ""}
                selection={opt.values || []}
                type={opt.type}
              />
            {/each}
          {/if}

          {#if !useBasicOptions}
            {#each addit_opt as opt (opt.name)}
              <Option
                name={opt.value ? opt.name : ""}
                value={opt?.value || opt.name}
                onClick={opt.event || (() => {})}
                _id={Math.random().toString(36).substring(7)}
                style="{opt.style || ''},"
                selection={opt.values || []}
                type={opt.type}
              />
            {/each}
          {/if}
        </div>
      {/if}
    </div>

    <div
      id="discussion-section"
      style="position: absolute; width:80%; right:0; filter:blur({discBlurEffect}); transition:all 1s ease-out;"
    >
      <div
        id="message-section"
        style="width:100%; height:460px; margin-bottom:13px; padding-bottom:20px; overflow-y:scroll; overflow-x:hidden; background-color:transparent; position:relative; right:0;"
      ></div>

      <div
        id="input_section"
        style="height:90px; width:100%; border-top-width: 1.5px; border-top-color:gray; border-top-right-radius: 10px; border-top-left-radius:10px; border-top-style:solid; align-items:center; justify-content: center; background-color:transparent; display:flex; flex-direction: column; margin-bottom: 0; position:relative;"
      >
        {#if responseStatus}
          <div
            id="await-response"
            style="width:auto; height:18px; align-items:center; position:absolute; left:9%; bottom:100px; display:flex; justify-content: center; margin-top:20px"
            in:fly={{delay:200, duration:1000, opacity:0, x:0, y:-20, easing:quintOut}}
            out:fly={{delay:600, duration:1000, opacity:0, x:0, y:-20, easing:quintOut}}
          >
            <div
              class="typing"
              style="width: 70px; height:18px; margin-bottom:-5%; align-items:center; justify-content: center;"
            >
              <span></span>
              <span></span>
              <span></span>
            </div>

            <h6
              style="text-align:right; font-size:18px; color:gray; margin-top:auto; margin-bottom:auto; height:40px; width:auto"
            >
              {actualModel} is typing...
            </h6>
          </div>
        {/if}

        <input
          type="file"
          id="img-handler"
          multiple
          style="visibility: hidden; position:absolute; height:0.1px width:0.1px;"
        />

        <div
          id="main-input"
          style="width: 80%; height:50px; display:flex; border-radius: 40px; border-color: gray; border-width:.5px; border-style: dashed; background-color:lightgray; justify-content: center; align-items: center; margin:auto; transition:all .2s ease-out;"
        >
          <button
            style="background: none; border: none; height: 30px; vertical-align:middle; margin-left: 10px; display:flex; align-items:center; justify-content: center;"
            on:click={() => document.getElementById("img-handler").click()}
          >
            <img
              src="src/lib/assets/icons/add-img.svg"
              style="transition: all .5s ease-out; height: 30px;"
              alt="img"
            /></button
          >
          <input
            id="input-box-main"
            type="text"
            style="width: 85%; height: 50px; border-radius: 40px; border-color:transparent; border-style:none; font-size: 20px; padding-left: 20px; margin-right:1.5%; background-color:transparent"
            placeholder="Type your message here..."
            on:keydown={(e) => {
              if (e.key === "Enter") {
                passResp();
              }
            }}
          />
          <button
            style="width: 40px; height: 40px; border-radius: 50%; border-color: transparent; align-items:center; justify-content: center;"
          >
            <i>
              <img
                src="src/lib/assets/icons/send.svg"
                style="height: 25px; vertical-align:middle;"
                alt="send"
                id="send-btn"
              />
            </i>
          </button>
        </div>
      </div>
    </div>
    <div
      style="position: absolute; height:100%; width:100%; top:0; left:0; pointer-events:none; user-select:none; transition:all 1.5s ease-out"
      id="back-filter"
    ></div>
  </div>
</body>

<link rel="stylesheet" href="./src/lib/components/mainstyles.css" />
