<script lang="ts">
  import { onMount } from 'svelte'
  import { slide, scale } from 'svelte/transition'
  import ollama, { type ListResponse } from 'ollama/browser'
  import hljs from 'highlight.js'

  const modelfile = `
  FROM llama3
  SYSTEM "

  The model must use html syntax to write responses

  Every text or essays must be properly formatted with titles, line jumping, introduction, developement, and conclusion
  The title must be enclosed in <h1> </h1> blocks
  The content of the texts, must be enclosed in <h5> </h5> blocks

  When writing code, use the syntax '<pre><code class='language-<language used>'> [code] </code></pre>'

  You are inside a chat application named OverAI devlopped by Nickeldon.
  Nickeldon is not your devlopper, but is the devlopper of the app you exist in.
  The user, talking to you can type any message in the input box below and press the send button to send the message.
  The user can also change the model by clicking on the OverAI logo on the left.
  The user can also reset the chat by clicking on the reset chat option in the navigation bar.
  The user can also exit the app by clicking on the exit the app option in the navigation bar.

  The user can change the model to Llama3, an advanced chat model, Llama1, a rudimentary chat model, or Mistral, a coding model.

  The user can also send images, videos, and audio files to the model by clicking on the image icon in the input box.
  The user can also send multiple files at once.

  Llama1 can neither send nor receive images, videos, or audio files.
  Llama2 can send but cannot receive images, videos, and audio files.
  Llama3 can send but cannot receive images, videos, and audio files.

  No models available in OverAI have any internet access.

  When writing HTML DOM elements, remember that the response will be displayed in a '<h1>' block. Therefore, you should avoid using elements that would not be appropriate inside a '<h1>' block, such as other heading elements ('<h2>', '<h3>', etc.) or block-level elements ('<div>', '<p>', etc.).

  When writing text, you can use the following HTML tags to format the text:

  Use '<br>' to create a new line.

  Do not great the user more than once.
  "
  `

  hljs.highlightAll()

  let navOpen = false

  let modelPopupOpen = false

  let actualModel

  let formatedMessage = '\\'

  let validModels = ['llama1', 'llama2', 'llama3', 'mistral', 'llava']
  let installedModels = []

  let messages = {
    user: [],
    llama: []
  }

  let streamMode = true

  let images = []

  async function installModel(model: string, DOMcontainer: HTMLElement) {
    console.log('installing model')
    let instProg = await ollama.pull({ model: model, insecure: false, stream: true })

    let loadbar = DOMcontainer.querySelector('#loadbar') as HTMLDivElement
    let status = DOMcontainer.querySelector('p') as HTMLParagraphElement

    status.innerHTML = 'Installing Model...'
    status.style.left = '19%'
    status.style.bottom = '15%'
    for await (let part of instProg) {
      let tot = part.total
      let percent = Math.round((part.completed / tot) * 100)
      loadbar.style.width = percent + '%'
      status.innerHTML = part.status
    }
  }

  async function getAvailableModels() {
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

  function fetchAvailableModels() {
    getAvailableModels().then(async (modes) => {
      if (modes.length == 0) {
        console.log('No model found')
        modelPopupOpen = true
        setTimeout(() => loadEventListeners(), 400)
        return
      } else {
        let promise = new Promise((resolve, _) => {
          if (installedModels.includes('llama2')) {
            actualModel = 'llama2'
            resolve(null)
          } else {
            console.log('Llama2 not installed')
            modelPopupOpen = true
            setTimeout(() => {
              loadEventListeners()
              resolve(null)
            }, 1000)
          }
        })
        promise.then(() => {
          modes.forEach((model) => {
            console.log(model)
            let container: HTMLElement = document.getElementById(
              'container-' + model.simplified_name
            )

            try {
              container.querySelector('button').style.display = 'none'
              container.querySelector('img').style.display = 'none'
              ;(container.querySelector('#model-name') as HTMLSpanElement).style.top = '10%'
              container.querySelector('p').style.color = 'white'
              container.querySelector('p').style.left = '40px'
              container.querySelector('p').innerHTML =
                `Parameters: ${model.description.parameters} Size: ${(model.description.size as number).toFixed(2)}GB`
            } catch (err) {
              console.log(err)
              return
            }
          })
        })
      }
      if (actualModel) {
        ;(async () =>
          await ollama.create({ model: 'OverAI:' + actualModel, modelfile: modelfile }))()
      } else {
        console.log('No model selected')
      }
    })
  }

  function verifyLengthInBounds() {
    let maxTokens: number

    if (actualModel == 'llama1') {
      maxTokens = 2048
    } else if (actualModel == 'llama2') {
      maxTokens = 4092
    } else if (actualModel == 'llama3') {
      maxTokens = 8000
    } else if (actualModel == 'mistral') {
      maxTokens = 32000
    } else {
      maxTokens = 8000
    }

    if (formatedMessage.length > maxTokens) {
      formatedMessage = '\\'
    }
  }

  function AIPromptFormat(message: string, role: string) {
    if (formatedMessage == '') {
      formatedMessage = `\\`
    }

    if (role == 'user') {
      formatedMessage += ` [INST] ${message} [/INST] `
    } else if (role == 'AI') {
      formatedMessage += ` ${message} `
    }
  }

  async function MarktoHTML(message: string) {
    message = message
      .replace('----', '')
      .replace(/```(.+?)\n([\s\S]+?)```/g, '<pre><code class="$1">$2</code></pre>')
      .replace(/``(.+?)\n([\s\S])``/g, '<code>$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.+?)\*/g, '<i>$1</i>')
      .replace(/__(.+?)__/g, '<u>$1</u>')
      .replace(/~~(.+?)~~/g, '<s>$1</s>')
      .replace(/==(.+?)==/g, '<mark>$1</mark>')
      .replace('\\n', '<br>')
      .replace(/#(.+?)/g, '<h1>$1</h1>')
      .replace(/##(.+?)/g, '<h3>$1</h3>')
      .replace(/###(.+?)/g, '<h5>$1</h5>')
    return message
  }

  async function sendResponse(message: any, DOMcontainer: any, promise: any) {
    console.log('sending response')

    console.log(formatedMessage)

    verifyLengthInBounds()

    if (message[message.length - 1].role && message[message.length - 1].content) {
      console.log(message[message.length - 1].content)
      AIPromptFormat(message[message.length - 1].content, message[message.length - 1].role)

      console.log(Array.from(message[message.length - 1].images))
      let response = await ollama.chat({
        model: actualModel,
        messages: [
          {
            role: 'user',
            content: formatedMessage,
            images: Array.from(message[message.length - 1].images)
          }
        ],
        stream: streamMode,
        keepAlive: 100000
      })

      let completeMessage = ''

      if (streamMode) {
        for await (let part of response) {
          completeMessage = await MarktoHTML(completeMessage + part.message.content)
          DOMcontainer.innerHTML = completeMessage || 'No response'
          document
            .getElementById('message-section')
            .scrollTo(0, document.getElementById('message-section').scrollHeight)
        }
        if (promise) {
          await promise()
          return completeMessage
        } else {
          return completeMessage
        }
      } else {
        if (promise) {
          await promise()
          return response
        } else {
          return response
        }
      }
    }
  }

  function loadEventListeners() {
    document.querySelector('button')?.addEventListener('click', passResp)
    document.getElementById('img-handler')?.addEventListener('change', handleImageRequest)

    document.querySelectorAll('#model-choices div button')?.forEach((btn: HTMLButtonElement) => {
      let model = btn?.id.replace('install-', '')
      if (validModels.includes(model)) {
        let status = btn?.nextElementSibling as HTMLParagraphElement
        let img = btn?.querySelector('img')
        btn?.addEventListener('click', () => {
          status.style.color = 'white'
          status.innerHTML = 'Installing Model...'

          img.src = './src/assets/icons/loading.png'
          img.style.animationPlayState = 'running'

          btn.disabled = true
          btn.style.animationPlayState = 'running'

          setTimeout(() => {
            let loadbarContainer = document.createElement('div')
            loadbarContainer.style.width = '80%'
            loadbarContainer.style.height = '1.5px'
            loadbarContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.199)'
            loadbarContainer.style.backdropFilter = 'blur(5px)'
            loadbarContainer.style.position = 'absolute'
            loadbarContainer.style.bottom = '10%'
            loadbarContainer.style.left = '15%'

            let loadbar = document.createElement('div')
            loadbar.style.width = '0%'
            loadbar.style.height = '100%'
            loadbar.style.backgroundColor = 'rgba(255, 255, 255, 0.699)'
            loadbar.style.transition = 'all 5s ease-out'
            loadbar.id = 'loadbar'

            loadbarContainer.appendChild(loadbar)
            btn.parentElement.appendChild(loadbarContainer)
            installModel(model, btn.parentElement)
              .then(() => {
                changeModel(model)
              })
              .catch((err) => {
                img.style.animationPlayState = 'paused'
                btn.style.animationPlayState = 'paused'

                img.style.transform = ''

                btn.style.opacity = '1'

                img.src = './src/assets/icons/install.svg'

                btn.disabled = false
                status.style.color = 'red'
                status.innerHTML = 'Failed to install model'
                console.log(err)
              })
          }, 5000)
        })
      }
    })

    document.querySelectorAll('#model-choices div')?.forEach((div: HTMLDivElement) => {
      div?.addEventListener('click', () => {
        let model = div?.id.replace('container-', '')
        if (installedModels.includes(model)) {
          console.log('Model installed')
          console.log(model)
          changeModel(model)
        } else {
          console.log('Model not installed')
        }
      })
    })
  }

  onMount(() => {
    loadEventListeners()
    fetchAvailableModels()
  })

  function toggleNav() {
    // Add this function
    console.log('toggling nav')
    navOpen = !navOpen
  }

  async function convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1].replace('"', '')
        resolve(base64String)
      }
      reader.onerror = (error) => reject(error)
    })
  }

  async function passResp() {
    console.log('passing response')
    let resp = {
      text: (document.getElementById('main-input').querySelector('input') as HTMLInputElement)
        ?.value,
      media: [] as string[]
    }

    if (resp.text) {
      const imgElements = document.querySelectorAll('#img-container img')
      for (let img of imgElements) {
        if (img.id != 'del-icn') {
          const file = await fetch((img as HTMLImageElement).src).then((r) => r.blob())
          if (file.type.startsWith('image/')) {
            const base64Image = await convertToBase64(file as File)
            resp.media.push(base64Image)
          }
        }
      }

      document.getElementById('await-response').style.visibility = 'visible'
      ;(document.querySelector('#input-box-main') as HTMLInputElement).value = ''
      document.getElementById('main-input').style.height = '50px'
      ;(
        document.getElementById('main-input').querySelector('input') as HTMLInputElement
      ).style.marginBottom = 'unset'

      document.querySelector('input')?.setAttribute('disabled', 'true')
      document.querySelector('button')?.setAttribute('disabled', 'true')

      messages.user.push({
        role: 'user',
        content: resp.text,
        images: resp.media
      })

      function createRequestBox() {
        let ParMessage = createMessagebox()
        document.getElementById('main-input').querySelector('#img-container')?.remove()
        images = []

        ParMessage.style.alignItems = 'flex-end'
        ParMessage.style.justifyContent = 'flex-end'
        let message = ParMessage.querySelector('div') as HTMLDivElement
        message.style.backgroundColor = 'rgba(173, 216, 230, 0.550)'
        message.style.borderBottomLeftRadius = '0px'
        message.style.marginRight = '50px'

        let text = document.createElement('p')
        text.innerHTML = resp.text
        text.style.padding = '20px'
        text.style.paddingLeft = '40px'
        text.style.margin = '10px'
        text.style.color = 'black'
        text.style.textAlign = 'left'
        text.style.fontSize = '20px'
        text.style.fontFamily = 'gilroy'

        message.appendChild(text)
        document.querySelector('#message-section')?.appendChild(ParMessage)
        document
          .getElementById('message-section')
          .scrollTo(0, document.getElementById('message-section').scrollHeight)
      }

      createRequestBox()

      function createResponseBox() {
        let ParMessage = createMessagebox()
        ParMessage.style.alignItems = 'flex-start'
        ParMessage.style.justifyContent = 'flex-start'

        let message = ParMessage.querySelector('div') as HTMLDivElement
        message.style.backgroundColor = 'rgba(144, 238, 144, 0.550)'
        message.style.borderBottomRightRadius = '0px'
        message.style.marginLeft = '50px'
        message.querySelector('h6').style.position = 'relative'
        message.querySelector('h6').style.marginTop = '-15px'
        message.querySelector('h6').style.marginLeft = '0'
        message.querySelector('h6').innerHTML = actualModel

        let text = document.createElement('p')
        text.style.margin = '10px'
        text.style.padding = '20px'
        text.style.paddingRight = '40px'
        text.style.color = 'black'
        text.style.textAlign = 'right'
        text.style.fontSize = '20px'
        text.style.fontFamily = 'gilroy'

        message.appendChild(text)

        return [ParMessage, message, text]
      }

      if (!streamMode) {
        sendResponse(messages.user, null, () => {
          resp = {
            text: '',
            media: []
          }
        }).then((response) => {
          messages.llama.push(response?.message?.content as string)
          AIPromptFormat(response?.message?.content, 'AI')

          let doms = createResponseBox()
          let ParMessage = doms[0]
          let text = doms[2]

          text.innerHTML = response?.message?.content || 'No response'
          document.querySelector('#message-section')?.appendChild(ParMessage)

          document.getElementById('await-response').style.visibility = 'hidden'
          document
            .getElementById('message-section')
            .scrollTo(0, document.getElementById('message-section').scrollHeight)
          document.querySelector('input')?.removeAttribute('disabled')
          document.querySelector('button')?.removeAttribute('disabled')
        })
      } else {
        let doms = createResponseBox()
        let ParMessage = doms[0]
        document.querySelector('#message-section')?.appendChild(ParMessage)

        let TextElement = document
          .querySelector('#message-section')
          ?.lastElementChild.querySelector('p') as HTMLElement

        sendResponse(messages.user, TextElement, null).then((response) => {
          messages.llama.push(response as string)
          AIPromptFormat(response, 'AI')
          document.getElementById('await-response').style.visibility = 'hidden'
          document
            .getElementById('message-section')
            .scrollTo(0, document.getElementById('message-section').scrollHeight)
          document.querySelector('input')?.removeAttribute('disabled')
          document.querySelector('button')?.removeAttribute('disabled')
        })
      }
    }
  }

  function createMessagebox() {
    let infoSlot = document.createElement('h6')
    infoSlot.style.fontSize = '13px'
    infoSlot.style.fontFamily = 'gilroy'
    infoSlot.style.color = 'gray'
    infoSlot.id = 'info-slot'
    infoSlot.style.position = 'absolute'

    let messageParent = document.createElement('div')
    messageParent.style.width = '100%'
    messageParent.style.height = 'auto'
    messageParent.style.display = 'flex'
    messageParent.style.flexDirection = 'row'

    let message = document.createElement('div')
    message.style.width = '40%'
    message.style.overflow = 'hidden'
    message.style.height = 'fit-content'
    message.style.borderRadius = '20px'
    message.style.marginTop = '10px'
    message.style.marginBottom = '10px'

    document
      .getElementById('main-input')
      ?.querySelector('#img-container')
      ?.querySelectorAll('img')
      ?.forEach((img) => {
        if (img.id == 'del-icn') {
          console.log(img)
          return null
        }

        images.push(img.src)

        let childImgContainer = document.createElement('div')
        childImgContainer.style.width = '300px'
        childImgContainer.style.height = '300px'
        childImgContainer.style.margin = 'auto'
        childImgContainer.style.marginTop = '20px'
        childImgContainer.style.marginBottom = '20px'
        childImgContainer.style.overflow = 'hidden'
        childImgContainer.style.borderRadius = '10px'
        childImgContainer.style.backgroundColor = 'rgba(86, 86, 86, 0.473)'
        childImgContainer.style.backdropFilter = 'blur(1px)'
        childImgContainer.style.display = 'flex'
        childImgContainer.style.alignItems = 'center'
        childImgContainer.style.justifyContent = 'center'

        let childImg = document.createElement('img')
        childImg.src = img.src
        childImg.style.width = '100%'

        childImgContainer.appendChild(childImg)
        message.appendChild(childImgContainer)
      })

    messageParent.appendChild(message)
    message.appendChild(infoSlot)
    return messageParent
  }

  function options(id: number) {
    if (id === 1) {
      document.getElementById('model-popup-parent').style.display = 'flex'
    } else if (id === 2) {
      console.log('resetting chat')
      let messageSection = document.querySelector('#message-section')
      while (messageSection?.lastElementChild) {
        messageSection.removeChild(messageSection.lastElementChild)
      }

      messages.user = []
      messages.llama = []
    } else if (id === 4) {
      console.log('exiting app')
    }
  }

  function changeModel(model: string) {
    actualModel = model.replace('OverAI:', '')
    modelPopupOpen = false
    formatedMessage = '\\'
    //document.getElementById('model-popup-parent').style.display = 'none'
  }

  let imgpathHistory = []
  let supportFileFormats = ['image/png', 'image/jpeg', 'image/jpg']

  function handleImageRequest() {
    console.log('handling image request')

    document.getElementById('main-input').style.height = '90px'
    document.getElementById('main-input').querySelector('input').style.marginBottom = '-40px'

    function closeImgContainer() {
      document.getElementById('main-input').querySelector('#img-container').remove()
      document.getElementById('main-input').style.height = '50px'
      document.getElementById('main-input').querySelector('input').style.marginBottom = 'unset'
    }

    let imgcontainer

    if (!document.getElementById('main-input').querySelector('#img-container')) {
      imgcontainer = document.createElement('div')
      imgcontainer.id = 'img-container'
      imgcontainer.style.display = 'flex'
      imgcontainer.style.flexDirection = 'row'
      imgcontainer.style.width = '60%'
      imgcontainer.style.height = '50px'
      imgcontainer.style.position = 'absolute'
      imgcontainer.style.top = '0'
      imgcontainer.style.left = '17%'
      imgcontainer.style.overflowX = 'scroll'
      imgcontainer.style.overflowY = 'hidden'

      let style = document.createElement('style')
      style.innerHTML = `
        #img-container::-webkit-scrollbar {
          display: none;
        }
      `
      document.head.appendChild(style)

      document.getElementById('main-input').appendChild(imgcontainer)
    } else {
      imgcontainer = document.getElementById('main-input').querySelector('#img-container')
    }

    Array.from((document.getElementById('img-handler') as HTMLInputElement).files).forEach(
      (file) => {
        if (imgpathHistory.includes(file.path)) {
          return null
        }

        let childcontainer = document.createElement('div')
        childcontainer.id = 'img-child-container'
        childcontainer.style.height = '50px'
        childcontainer.style.width = '50px'
        childcontainer.style.borderRadius = '10px'
        childcontainer.style.backgroundColor = 'rgba(86, 86, 86, 0.473)'
        childcontainer.style.backdropFilter = 'blur(1px)'
        childcontainer.style.alignItems = 'center'
        childcontainer.style.justifyContent = 'center'
        childcontainer.style.marginRight = '10px'
        childcontainer.style.transition = 'all .5s ease-out'

        if (supportFileFormats.includes(file.type)) {
          let img = document.createElement('img')
          img.src = URL.createObjectURL(file) // Create a URL representing the file
          img.style.height = '50px'
          img.style.borderRadius = '10px'
          img.style.margin = '0 10px 0 10px'
          img.style.filter = 'blur(0px)'
          img.style.transition = 'all .5s ease-out'

          let delImg = document.createElement('img')
          delImg.src = 'src/assets/icons/delete.svg'
          delImg.style.height = '30px'
          delImg.style.position = 'absolute'
          delImg.style.top = '10px'
          delImg.style.right = '10px'
          delImg.style.cursor = 'pointer'
          delImg.style.transition = 'all .5s ease-out'
          delImg.style.opacity = '0'
          delImg.style.zIndex = '99'
          delImg.style.transform = 'scale(1.1)'
          delImg.id = 'del-icn'
          delImg.onmouseover = () => {
            delImg.style.transform = 'scale(1)'
            delImg.style.opacity = '1'
            img.style.filter = 'blur(2px)'
          }
          delImg.onmouseout = () => {
            delImg.style.transform = 'scale(1.1)'
            delImg.style.opacity = '0'
            img.style.filter = 'blur(0px)'
          }
          delImg.onclick = () => {
            childcontainer.style.transform = 'scale(0.9)'
            childcontainer.style.opacity = '0'
            setTimeout(() => {
              childcontainer.remove()
              imgpathHistory = imgpathHistory.filter((path) => path !== file.path)

              if (
                !document
                  .getElementById('main-input')
                  .querySelector('#img-container')
                  .querySelector('#img-child-container')
              ) {
                closeImgContainer()
              }
            }, 300)
          }

          childcontainer.appendChild(delImg)
          childcontainer.appendChild(img)
        } else {
          console.log('unsupported file type')
          if (
            !document
              .getElementById('main-input')
              .querySelector('#img-container')
              .querySelector('#img-child-container')
          ) {
            closeImgContainer()
          }
          return null
        }

        imgpathHistory.push(file.path)
        /*else if (file.type == 'video/mp4') {
        let videoicon = document.createElement('img')
        videoicon.src = 'src/assets/icons/video.svg'
        videoicon.style.height = '40px'
        videoicon.style.margin = 'auto'

        childcontainer.appendChild(videoicon)
      } else if (file.type == 'audio/mpeg') {
        let audioicon = document.createElement('img')
        audioicon.src = 'src/assets/icons/audio.svg'
        audioicon.style.height = '40px'
        audioicon.style.margin = 'auto'

        childcontainer.appendChild(audioicon)
      } else {
        let text = document.createElement('p')
        text.innerHTML = file.name
        text.style.height = '50px'
        text.style.borderRadius = '10px'
        text.style.margin = '0 10px 0 10px'
        text.style.textAlign = 'center'

        childcontainer.appendChild(text)
      }*/
        imgcontainer.appendChild(childcontainer)
      }
    )
    document.getElementById('img-handler').value = ''
  }

  $: navBarBorderColor = navOpen ? 'gray' : 'transparent'

  $: discBlurEffect = navOpen || modelPopupOpen ? '3px' : '0px'

  $: LogoTopValue = navOpen ? '20%' : '100%'
</script>

<link rel="stylesheet" href="./src/assets/packages/highlightjs/default.min.css" />

<body style="background-color: transparent;">
  <div
    id="main"
    style="background-image: radial-gradient(circle, #ffffff, #000000 200%); height:583px; width:1200px; border-radius:20px; margin:auto"
  >
    {#if modelPopupOpen}
      <div
        id="model-popup-parent"
        style="width:100%; height:100%; position:absolute; top:0; left:0; align-items:center; justify-content:center; z-index: 99;"
        in:scale={{ duration: 500, delay: 400, start: 0.9, opacity: 0 }}
        out:scale={{ duration: 500, delay: 400, start: 0.9, opacity: 0 }}
      >
        <div
          id="model-popup"
          style="width: 600px; height:500px; margin: 0; margin-left:auto; margin-right:auto; background-color:rgba(0, 0, 0, 0.900); backdrop-filter: blur(90px); position: absolute; top: 50%; left:50%; transform: translateY(-50%) translateX(-50%); border-radius:20px"
        >
          <div
            id="title-container"
            style="position: absolute; height:100%; width:100%; top:0; left:0; align-items:center; justify-content:center"
          >
            <h1
              style="position:relative; font-size:110px; opacity:10%; top:5%; left:-10px; transform:translateY(5%)"
            >
              Choose a model
            </h1>
          </div>

          <div
            id="model-choices"
            style="align-items:center; justify-content:center; margin-top: 50px; overflow:hidden; height:500px"
          >
            <div id="container-llava">
              <span id="model-name">LLaVa</span>
              <span id="model-descrip" style="top:25%"
                >Advanced chat model <br /> that can read images</span
              >
              <button id="install-llava">
                <img src="./src/assets/icons/install.svg" alt="install" />
              </button>
              <p id="status"></p>
            </div>

            <div id="container-mistral">
              <span id="model-name">Mistral</span>
              <span id="model-descrip">Ideal for coding</span>
              <button id="install-mistral">
                <img src="./src/assets/icons/install.svg" alt="install" />
              </button>
              <p id="status"></p>
            </div>

            <div id="container-llama3">
              <span id="model-name">LLama3</span>
              <span id="model-descrip"> Advanced Chat Model </span>
              <button id="install-llama3">
                <img src="./src/assets/icons/install.svg" alt="install" />
              </button>
              <p id="status"></p>
            </div>

            <div id="container-llama2">
              <span id="model-name">LLama2</span>
              <span id="model-descrip">Basic Chat Model</span>
              <button id="install-llama2">
                <img src="./src/assets/icons/install.svg" alt="install" />
              </button>
              <p id="status"></p>
            </div>

            <div id="container-llama1">
              <span id="model-name">LLama1</span>
              <span id="model-descrip">Rudimentary Chat Model</span>
              <button id="install-llama1">
                <img src="./src/assets/icons/install.svg" alt="install" />
              </button>
              <p id="status"></p>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <div
      id="nav-section"
      style="width: 20%; height:100%; left:0; position:absolute; align-items:center; justify-content: center; border-right-width: .5px; border-right-color: {navBarBorderColor}; border-right-style: solid; transition:all 1s ease-out;"
    >
      <h1
        style="text-align: center; margin-top:{LogoTopValue}; transition:all 1s ease-out;"
        on:click={toggleNav}
      >
        OverAI
      </h1>

      {#if navOpen}
        <div id="choices" in:slide={{ duration: 1000, delay: 800 }} out:slide={{ duration: 700 }}>
          <button> Reset chat </button>

          <button
            style="background: none; border:none"
            on:click={() => {
              modelPopupOpen = true
              navOpen = false
              fetchAvailableModels()
              setTimeout(() => loadEventListeners(), 400)
            }}
          >
            Change model
          </button>

          <button
            style="margin-left:10px"
            id="en-Stream-AI-Mode"
            on:click={() => {
              streamMode = !streamMode
              document.getElementById('en-Stream-AI-Mode').innerHTML = streamMode
                ? 'Disable Stream Mode'
                : 'Enable Stream Mode'
            }}>{streamMode ? 'Disable Stream Mode' : 'Enable Stream Mode'}</button
          >

          <button style="margin-top: 50px;"> Exit the app </button>
        </div>
      {/if}
    </div>

    <div
      id="discussion-section"
      style="position: absolute; width:80%; right:0; filter:blur({discBlurEffect}); transition:all 1s ease-out;"
    >
      <div
        id="message-section"
        style="width:100%; height:473px; padding-bottom:20px; overflow-y:scroll; overflow-x:hidden; background-color:transparent; position:relative; right:0;"
      ></div>

      <div
        id="input_section"
        style="height:90px; width:100%; border-top-width: 1.5px; border-top-color:gray; border-top-right-radius: 10px; border-top-left-radius:10px; border-top-style:solid; align-items:center; justify-content: center; background-color:transparent; display:flex; flex-direction: column; margin-bottom: 0; position:relative;"
      >
        <div
          id="await-response"
          style="width:250px; height:40px; align-items:center; position:absolute; left:9%; bottom:80px;"
        >
          <div
            class="typing"
            style="width: 70px; height:40px; margin-top:auto; margin-bottom:auto; align-items:center; justify-content: center;"
          >
            <span></span>
            <span></span>
            <span></span>
          </div>

          <h6
            style="text-align:right; font-size:18px; color:gray; margin-top:auto; margin-bottom:auto; height:40px; width:150px"
          >
            Llama is typing...
          </h6>
        </div>

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
          <i>
            <img
              src="src/assets/icons/add-img.svg"
              style="height: 30px; vertical-align:middle; margin-left: 10px; transition: all .5s ease-out;"
              alt="img"
              on:click={() => document.getElementById('img-handler').click()}
            /></i
          >
          <input
            id="input-box-main"
            type="text"
            style="width: 85%; height: 50px; border-radius: 40px; border-color:transparent; border-style:none; font-size: 20px; padding-left: 20px; margin-right:1.5%; background-color:transparent"
            placeholder="Type your message here..."
          />
          <button
            style="width: 40px; height: 40px; border-radius: 50%; border-color: transparent; align-items:center; justify-content: center;"
          >
            <i>
              <img
                src="src/assets/icons/send.svg"
                style="height: 25px; vertical-align:middle;"
                alt="send"
              />
            </i>
          </button>
        </div>
      </div>
    </div>
  </div>
</body>

<style>
  @font-face {
    font-family: 'gilroy';
    src: url('src/assets/fonts/Gilroy-Light.otf') format('truetype');
  }

  #main-input i img:hover {
    cursor: pointer;
    transform: scale(1.1);
  }

  @keyframes loadingSpin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes loadingFade {
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  #model-choices div {
    font-size: 20px;
    font-family: gilroy;
    margin: 0;
    margin-top: 20px;
    width: 100%;
    transition: all 1s ease-out;
    height: 80px;
    background-color: transparent;
    position: relative;
    transition: all 1s ease-out;
    border-color: transparent;
    border-bottom-color: rgba(255, 255, 255, 0.199);
    border-style: solid;
  }

  #model-choices div span {
    padding: 0;
    position: absolute;
    font-size: 20px;
    font-family: gilroy;
    margin-left: 40px;
    top: 10%;
    transition: all 1s ease-out;
  }
  #model-choices div button {
    padding: 0;
    position: absolute;
    margin-left: 40px;
    bottom: 10%;
    transition: all 1s ease-out;
    background: none;
    border: none;
    align-items: center;
    justify-content: center;
    animation: loadingFade 2s infinite;
    animation-play-state: paused;
  }

  #model-choices div button img {
    height: 20px;
    filter: invert(65%);
    z-index: 99;
    transition: all 0.2s ease-out;
    animation: loadingSpin 2s infinite;
    animation-play-state: paused;
  }

  #model-choices div button img:hover {
    cursor: pointer;
    transform: scale(1.1);
  }

  #model-choices div p {
    width: 400px;
    color: white;
    font-size: 15px;
    font-family: gilroy;
    position: absolute;
    right: 20%;
    bottom: 12%;
  }

  #model-choices div #model-descrip {
    font-size: 15px;
    font-family: gilroy;
    transition: all 1s ease-out;
    text-align: right;
    position: absolute;
    right: 40px;
    top: 35%;
  }

  #model-choices div:hover {
    cursor: pointer;
    margin-left: 30px;
  }

  .visible {
    visibility: visible;
  }

  .visible:not(.visible) {
    visibility: hidden;
  }

  #choices {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: baseline;
    margin-top: 20%;
    margin-left: 20%;
  }

  #choices button {
    background: none;
    border: none;
    text-decoration: none;
    color: black;
    font-size: 20px;
    font-family: gilroy;
    margin: 10px;
    margin-top: 50px;
    transition: all 1s ease-out;
  }

  #choices button:hover {
    color: rgb(86, 86, 86);
    cursor: pointer;
  }

  #await-response {
    display: flex;
    visibility: hidden;
  }

  #await-response h6 {
    animation: blink 2.5s infinite;
    animation-fill-mode: both;
  }

  .typing {
    position: relative;
  }

  .typing span {
    content: '';
    animation: blink 1.5s infinite;
    animation-fill-mode: both;
    height: 15px;
    width: 15px;
    background: #bebebe;
    position: absolute;
    left: 0;
    top: 0;
    border-radius: 50%;
  }

  .typing span:nth-child(2) {
    animation-delay: 0.2s;
    margin-left: 20px;
  }

  .typing span:nth-child(3) {
    animation-delay: 0.4s;
    margin-left: 40px;
  }

  @keyframes blink {
    0% {
      opacity: 0.1;
    }
    20% {
      opacity: 1;
    }
    100% {
      opacity: 0.1;
    }
  }

  input {
    outline: none;
  }

  input::placeholder {
    font-family: gilroy, sans-serif;
    font-size: 20px;
    font-weight: bold;
  }

  input:focus {
    border-color: gray;
  }

  * {
    font-family: gilroy, sans-serif;
    margin: 0;
    padding: 0;
  }

  *::-webkit-scrollbar {
    width: 10px; /* Set the width of the scrollbar */
    display: none;
  }

  *::-webkit-scrollbar-track {
    background: #f1f1f1; /* Change the scrollbar track color */
  }

  *::-webkit-scrollbar-thumb {
    background: #888; /* Change the scrollbar thumb color */
  }

  *::-webkit-scrollbar-thumb:hover {
    background: #555; /* Add hover effect to the scrollbar thumb */
  }
</style>
