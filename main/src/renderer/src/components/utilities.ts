import ollama from 'ollama/browser'

interface ListResponse {
  models: Array<{
    name: string
    size: number
    details: {
      parameter_size: number
    }
  }>
}

export let installedModels:string[] = []

export async function installModel(model: string, DOMcontainer: HTMLElement) {
  console.log('installing model')
  let instProg = await ollama.pull({ model: model, insecure: false, stream: true })

  let loadbar = DOMcontainer.querySelector('#loadbar') as HTMLDivElement
  let status = DOMcontainer.querySelector('p') as HTMLParagraphElement

  status.innerHTML = 'Installing Model...'
  status.style.left = '15%'
  status.style.bottom = '16%'
  for await (let part of instProg) {
    let tot = part.total
    let percent = Math.round((part.completed / tot) * 100)
    loadbar.style.width = percent + '%'
    status.innerHTML = part.status
  }
}

export async function removeModelTempFiles(model: string, DOMcontainer:HTMLElement) {

  let status = DOMcontainer.querySelector('p') as HTMLParagraphElement
  status.innerHTML = 'Deleting temporary files...'
  status.style.left = '19%'
  status.style.bottom = '15%'
  await ollama.delete({ model: model, stream: true })

  status.innerHTML = 'Done'
}

export async function getAvailableModels() {
  let models: ListResponse = await ollama.list()

  let modes = []
  installedModels = []
  Array.from(models.models).forEach((model) => {
    modes.push({
      simplified_name: model.name.replace('OverAI:', '').replace(':latest', ''),
      name: model.name,
      description: {
        parameters: model.details.parameter_size,
        size: model.size / 1000000000,
        available: true
      }
    })
  })
  installedModels = modes.map((model) => model.simplified_name)
  return modes
}
