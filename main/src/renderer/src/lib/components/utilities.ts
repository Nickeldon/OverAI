import ollama from "ollama/browser";

interface ListResponse {
  models: Array<{
    name: string;
    size: number;
    details: {
      parameter_size: number;
    };
  }>;
}

export let installedModels: string[] = [];

export async function getSpecificContext(modelName:string){
  let models: ListResponse = await ollama.list();

  let data

  console.log(models.models)

  Array.from(models.models).forEach((model) => {
    if((model.name).replace(':latest', '').toLowerCase().trim() == modelName.toLowerCase().trim()){
      data = ({
          parameters: model.details.parameter_size,
          size: model.size / 1000000000,
    })}
  });

  return data || undefined
}

/*---Taken from StackOverFlow (https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists)---*/
export async function waitForElm(selector) {
  return await new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}
/*------*/

export async function installModel(
  model: string,
  loadbar: HTMLDivElement,
  status: HTMLParagraphElement
) {
  console.log("installing model: ", model);
  let instProg = await ollama.pull({
    model: model,
    insecure: false,
    stream: true,
  });

  status.innerText = "Installing Model...";
  for await (let part of instProg) {
    let tot = part.total;
    let percent = Math.round((part.completed / tot) * 100);
    loadbar.style.width = percent + "%";
    status.innerText = part.status;
  }
}

export async function removeModelTempFiles(
  model: string,
  DOMcontainer: HTMLElement
) {
  let status = DOMcontainer.querySelector("p") as HTMLParagraphElement;
  status.innerHTML = "Deleting temporary files...";
  status.style.left = "19%";
  status.style.bottom = "15%";
  await ollama.delete({ model: model, stream: true });

  status.innerHTML = "Done";
}

export async function getAvailableModels() {
  let models: ListResponse = await ollama.list();

  let modes = [];
  installedModels = [];
  Array.from(models.models).forEach((model) => {
    modes.push({
      simplified_name: model.name.replace("OverAI:", "").replace(":latest", ""),
      name: model.name,
      description: {
        parameters: model.details.parameter_size,
        size: model.size / 1000000000,
        available: true,
      },
    });
  });
  installedModels = modes.map((model) => model.simplified_name);
  return modes as Array<modelQuery>;
}
