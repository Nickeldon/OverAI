import { waitForElm } from "./utilities";

export let images = [];

export function createMessagebox(InputBox: HTMLDivElement) {
  let infoSlot = document.createElement("h6");
  infoSlot.style.fontSize = "13px";
  infoSlot.style.fontFamily = "gilroy";
  infoSlot.style.color = "gray";
  infoSlot.id = "info-slot";
  infoSlot.style.position = "absolute";

  let messageParent = document.createElement("div");
  messageParent.style.width = "100%";
  messageParent.style.height = "auto";
  messageParent.style.display = "flex";
  messageParent.style.flexDirection = "row";

  let message = document.createElement("div");
  message.style.width = "40%";
  message.style.overflow = "hidden";
  message.style.height = "fit-content";
  message.style.borderRadius = "20px";
  message.style.marginTop = "10px";
  message.style.marginBottom = "10px";

  InputBox?.querySelector("#img-container")
    ?.querySelectorAll("img")
    ?.forEach((img) => {
      if (img.id == "del-icn") {
        console.log(img);
        return null;
      }

      images.push(img.src);

      let childImgContainer = document.createElement("div");
      childImgContainer.style.width = "300px";
      childImgContainer.style.height = "300px";
      childImgContainer.style.margin = "auto";
      childImgContainer.style.marginTop = "20px";
      childImgContainer.style.marginBottom = "20px";
      childImgContainer.style.overflow = "hidden";
      childImgContainer.style.borderRadius = "10px";
      childImgContainer.style.backgroundColor = "rgba(86, 86, 86, 0.473)";
      childImgContainer.style.backdropFilter = "blur(1px)";
      childImgContainer.style.display = "flex";
      childImgContainer.style.alignItems = "center";
      childImgContainer.style.justifyContent = "center";

      let childImg = document.createElement("img");
      childImg.src = img.src;
      childImg.style.width = "100%";

      childImgContainer.appendChild(childImg);
      message.appendChild(childImgContainer);
    });

  messageParent.appendChild(message);
  message.appendChild(infoSlot);
  return messageParent;
}

export function createResponseBox(InputBox: HTMLDivElement, model: string) {
  let ParMessage = createMessagebox(InputBox);
  ParMessage.style.alignItems = "flex-start";
  ParMessage.style.justifyContent = "flex-start";
  ParMessage.style.marginTop = "20px";
  ParMessage.style.opacity = '0'
  ParMessage.style.transition = "all .6s ease-out, opacity 1s ease-out";
  ParMessage.id = 'main-container-response'

  let message = ParMessage.querySelector("div") as HTMLDivElement;
  message.style.backgroundColor = "rgba(144, 238, 144, 0.550)";
  message.style.borderBottomRightRadius = "0px";
  message.style.marginLeft = "50px";
  message.style.height = "auto";

  let infoSlot = message.querySelector("h6");
  infoSlot.style.position = "relative";
  infoSlot.style.marginTop = "-10px";
  infoSlot.style.marginLeft = "-12%";
  infoSlot.innerHTML = `Model: ${model}`;

  let text = document.createElement("p");
  text.style.margin = "10px";
  text.style.padding = "20px";
  text.style.paddingRight = "40px";
  text.style.color = "black";
  text.style.textAlign = "right";
  text.style.fontSize = "20px";
  text.style.fontFamily = "gilroy";

  ParMessage.appendChild(infoSlot);
  message.appendChild(text);

  waitForElm("#main-container-response").then(() => {
    setTimeout(() => {
      ParMessage.style.marginTop = "0px";
      ParMessage.style.opacity = '1'
    }, 800);
  });

  return [ParMessage, message, text];
}

export function createRequestBox(
  InputBox: HTMLDivElement,
  MessageContainer: HTMLDivElement,
  resp: any
) {
  let ParMessage = createMessagebox(InputBox);
  ParMessage.style.marginTop = "20px";
  ParMessage.style.opacity = '0'
  ParMessage.style.transition = "all .6s ease-out, opacity 1s ease-out";
  ParMessage.id = "main-container-message";

  InputBox.querySelector("#img-container")?.remove();
  images = [];

  ParMessage.style.alignItems = "flex-end";
  ParMessage.style.justifyContent = "flex-end";
  let message = ParMessage.querySelector("div") as HTMLDivElement;
  message.style.backgroundColor = "rgba(173, 216, 230, 0.550)";
  message.style.borderBottomLeftRadius = "0px";
  message.style.marginRight = "50px";

  let text = document.createElement("p");
  text.innerHTML = resp.text;
  text.style.padding = "20px";
  text.style.paddingLeft = "40px";
  text.style.margin = "10px";
  text.style.color = "black";
  text.style.textAlign = "left";
  text.style.fontSize = "20px";
  text.style.fontFamily = "gilroy";

  message.appendChild(text);
  MessageContainer?.appendChild(ParMessage);
  MessageContainer?.scrollTo(0, MessageContainer.scrollHeight);

  waitForElm("#main-container-message").then(() => {
    setTimeout(() => {
      ParMessage.style.marginTop = "0px";
      ParMessage.style.opacity = '1'
    }, 0);
  });
}
