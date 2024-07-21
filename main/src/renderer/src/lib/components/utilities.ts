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

export async function getSpecificContext(modelName: string) {
  let models: ListResponse = await ollama.list();

  let data;

  console.log(models.models);

  Array.from(models.models).forEach((model) => {
    if (
      model.name.replace(":latest", "").toLowerCase().trim() ==
      modelName.toLowerCase().trim()
    ) {
      data = {
        parameters: model.details.parameter_size,
        size: model.size / 1000000000,
      };
    }
  });

  return data || undefined;
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
  status: HTMLParagraphElement,
  speedContainer: HTMLParagraphElement /*,
  unitContainer:HTMLSpanElement*/
) {
  console.log("installing model: ", model);
  let instProg = await ollama.pull({
    model: model,
    insecure: false,
    stream: true,
  });

  status.innerText = "Installing Model...";

  let speeds = [0, 0];
  let speed = "0b/s";
  let tot = 0;
  let temp_curr = 0;
  let curr = 0;

  const getSpeedUnits = (value: number) => {
    let pow: number = value.toString().length - 1;
    let unit: string;
    let S_fig = 2;
    //console.log(pow);
    if (pow >= 9) {
      unit = "Gb";
      S_fig = pow - 8;
    } else if (pow >= 6) {
      unit = "Mb";
      S_fig = pow - 5;
    } else if (pow >= 3) {
      unit = "Kb";
      S_fig = pow - 2;
    } else {
      unit = "b";
    }

    console.log(S_fig)
    return [`${unit}/s`, value / Math.pow(10, pow), S_fig] as [
      string,
      number,
      number,
    ];
  };

  /*setInterval(() => {
    temp_curr = curr;
    //console.log(curr);
    setTimeout(() => {
      //console.log(curr);
      if (curr >= temp_curr) {
        let data = getSpeedUnits(curr - temp_curr);
        speed = `${data[1].toFixed(2)}${data[0]}`;
        speeds[1] = Number(data[1].toFixed(2));
      } else {
        speed = "0b/s";
        speeds[1] = 0;
      }
    }, 2000);
  }, 1000);*/

  async function speedInterval() {
    temp_curr = curr;

    await new Promise((resolve, _) => {
      setTimeout(() => {
        resolve(null);
      });
    });

    setTimeout(() => {
      let curr_2 = curr;

      if (curr_2 > temp_curr) {
        let data = getSpeedUnits(curr_2 - temp_curr);
        speed = `${data[1].toFixed(data[2])}${data[0]}`;
        speeds[1] = Number(data[1].toFixed(2));
      } else {
        speeds[1] = 0;
      }
      setTimeout(() => {
        speedInterval();
      }, 500);
    }, 1000);
  }

  setInterval(() => {
    if (speeds[0] != speeds[1]) {
      if (speeds[0] < speeds[1]) {
        speeds[1] += 0.01;
      } else {
        speeds[1] -= 0.01;
      }
    }
    speed = `${speeds[1].toFixed(2)}`;
    speedContainer.innerHTML = `${speed} <span style="color:rgb(220, 85, 85)">${curr >= temp_curr ? getSpeedUnits(curr - temp_curr)[0] : "b/s"}</span>`;
  }, 100);

  speedInterval();

  for await (let part of instProg) {
    tot = part.total;
    curr = part.completed;
    let percent = Math.round((curr / tot) * 100);
    loadbar.style.width = percent + "%";
    status.innerText = part.status;
  }
}

export async function deleteModel(modelName: string) {
  let models: ListResponse = await ollama.list();
  console.log(models);
  Array.from(models.models).forEach(async (model) => {
    if (
      model.name == modelName ||
      model.name == `OverAI:${modelName}` ||
      model.name == `${modelName}:latest`
    ) {
      await ollama.delete({ model: model.name });
    }
  });
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
  let models: ListResponse = await ollama.list()

  let modes = [];
  installedModels = [];
  Array.from(models.models).forEach((model) => {
    modes.push({
      simplified_name: model.name.replace("OverAI:", "").replace(":latest", ""),
      name: model.name,
      description: {
        parameters: model.details.parameter_size,
        size: model.size / 1e9,
        available: true,
      },
    });
  });
  installedModels = modes.map((model) => model.simplified_name);
  return modes as Array<modelQuery>;
}
