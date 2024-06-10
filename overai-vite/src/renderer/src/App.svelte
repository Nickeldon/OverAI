<script lang="ts">
  import { onMount } from 'svelte'
  import { slide } from 'svelte/transition'
  import ollama from 'ollama/browser'

  let navOpen = false

  let modes = {
    coding: 'mistral',
    Advancedchat: 'llama3',
    Basicchat: 'llama2',
    Simplechat: 'llama1'
  }

  let actualModel = modes.Basicchat

  let messages = {
    user: [],
    llama: []
  }

  let images = []

  const modelfile = `
  FROM llama2
  SYSTEM "You are inside a chat application named OverAI devlopped by Nickeldon.
  Nickeldon is not your devlopper, but is the devlopper of the app you exist in.
  The user, talking to you can type any message in the input box below and press the send button to send the message.
  The model, you, will respond to the user's message.
  The user can also change the model by clicking on the OverAI logo on the left.
  The user can also reset the chat by clicking on the reset chat option in the navigation bar.
  The user can also exit the app by clicking on the exit the app option in the navigation bar.
  The initial model is Llama2, a basic chat model.
  The user can change the model to Llama3, an advanced chat model, Llama1, a rudimentary chat model, or Mistral, a coding model.

  The user can also send images, videos, and audio files to the model by clicking on the image icon in the input box.
  The user can also send multiple files at once.

  Llama1 can neither send nor receive images, videos, or audio files.
  Llama2 can receive images, videos, and audio files but cannot send them.
  Llama3 can send and receive images, videos, and audio files.

  Do not great the user more than once.
  "
  `
  ;(async () => await ollama.create({ model: 'llama2', modelfile: modelfile }))()

  async function sendResponse(message: any, promise: any) {
    if (message.role && message.content) {
      console.log(message)
      let response = await ollama.chat({ model: actualModel, messages: [message] })
      console.log(response)
      if (promise) {
        await promise()
        return response
      } else {
        return response
      }
    }
  }

  onMount(() => {
    document.querySelector('button')?.addEventListener('click', passResp)
    document.getElementById('img-handler')?.addEventListener('change', handleImageRequest)
  })

  function toggleNav() {
    // Add this function
    console.log('toggling nav')
    navOpen = !navOpen
  }

  async function convertToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove the Data URL prefix
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
}


  async function passResp() {
  console.log('passing response');
  let resp = {
    text: (document.getElementById('main-input').querySelector('input') as HTMLInputElement)?.value,
    media: [] as string[]
  };

  if (resp.text) {
    const imgElements = document.querySelectorAll('#img-container img');
    for (let img of imgElements) {
      const file = await fetch(img.src).then(r => r.blob());
      if (file.type.startsWith('image/')) {
        const base64Image = await convertToBase64(file as File);
        resp.media.push(base64Image);
      }
    }

    document.getElementById('await-response').style.visibility = 'visible';
    (document.querySelector('#input-box-main') as HTMLInputElement).value = '';
    document.getElementById('main-input').style.height = '50px';
    (document.getElementById('main-input').querySelector('input') as HTMLInputElement).style.marginBottom = 'unset';

    document.querySelector('input')?.setAttribute('disabled', 'true');
    document.querySelector('button')?.setAttribute('disabled', 'true');

    messages.user.push(resp);
    let ParMessage = createMessagebox();
    document.getElementById('main-input').querySelector('#img-container')?.remove();
    images = [];

    ParMessage.style.alignItems = 'flex-end';
    ParMessage.style.justifyContent = 'flex-end';
    let message = ParMessage.querySelector('div') as HTMLDivElement;
    message.style.backgroundColor = 'rgba(173, 216, 230, 0.550)';
    message.style.borderBottomLeftRadius = '0px';
    message.style.marginRight = '50px';

    let text = document.createElement('p');
    text.innerHTML = resp.text;
    text.style.padding = '20px';
    text.style.paddingLeft = '40px';
    text.style.margin = '10px';
    text.style.color = 'black';
    text.style.textAlign = 'left';
    text.style.fontSize = '20px';
    text.style.fontFamily = 'gilroy';

    message.appendChild(text);
    document.querySelector('#message-section')?.appendChild(ParMessage);
    document.getElementById('message-section').scrollTo(0, document.getElementById('message-section').scrollHeight);

    sendResponse({ role: 'user', content: resp.text, images: resp.media }, () => {
      resp = {
        text: '',
        media: []
      };
    }).then((response) => {
      console.log(response);
      messages.llama.push(response?.message?.content as string);

      let ParMessage = createMessagebox();
      ParMessage.style.alignItems = 'flex-start';
      ParMessage.style.justifyContent = 'flex-start';

      let message = ParMessage.querySelector('div') as HTMLDivElement;
      message.style.backgroundColor = 'rgba(144, 238, 144, 0.550)';
      message.style.borderBottomRightRadius = '0px';
      message.style.marginLeft = '50px';
      message.querySelector('h6').style.position = 'relative';
      message.querySelector('h6').style.marginTop = '-15px';
      message.querySelector('h6').style.marginLeft = '0';
      message.querySelector('h6').innerHTML = actualModel;

      let text = document.createElement('p');
      text.innerHTML = response?.message?.content || 'No response';
      text.style.margin = '10px';
      text.style.padding = '20px';
      text.style.paddingRight = '40px';
      text.style.color = 'black';
      text.style.textAlign = 'right';
      text.style.fontSize = '20px';
      text.style.fontFamily = 'gilroy';

      message.appendChild(text);
      document.querySelector('#message-section')?.appendChild(ParMessage);
      document.getElementById('message-section').scrollTo(0, document.getElementById('message-section').scrollHeight);

      document.getElementById('await-response').style.visibility = 'hidden';
      document.querySelector('input')?.removeAttribute('disabled');
      document.querySelector('button')?.removeAttribute('disabled');
    });
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


    document.getElementById('main-input')
    ?.querySelector('#img-container')
    ?.querySelectorAll('img')
    ?.forEach((img) => {
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
    } else if (id === 3) {
      console.log('exiting app')
    }
  }

  function changeModel(model: string) {
    actualModel = model
    document.getElementById('model-popup-parent').style.display = 'none'
  }

  let imgpathHistory = []
  function handleImageRequest() {
    console.log('handling image request')
    document.getElementById('main-input').style.height = '90px'
    document.getElementById('main-input').querySelector('input').style.marginBottom = '-40px'

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

    Array.from(document.getElementById('img-handler').files).forEach((file) => {
      console.log(file)

      if (imgpathHistory.includes(file.path)) {
        return
      }
      imgpathHistory.push(file.path)
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

      if (file.type == 'image/png' || file.type == 'image/jpeg' || file.type == 'image/jpg') {
        let img = document.createElement('img')
        img.src = URL.createObjectURL(file) // Create a URL representing the file
        img.style.height = '50px'
        img.style.borderRadius = '10px'
        img.style.margin = '0 10px 0 10px'

        childcontainer.appendChild(img)
      } else if (file.type == 'video/mp4') {
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
      }
      imgcontainer.appendChild(childcontainer)
    })
    document.getElementById('img-handler').value = ''
  }

  $: navBarBorderColor = navOpen ? 'gray' : 'transparent'

  $: discBlurEffect = navOpen ? '3px' : '0px'

  $: LogoTopValue = navOpen ? '20%' : '100%'
</script>

<body style="background-color: transparent;">
  <div
    id="main"
    style="background-image: radial-gradient(circle, #ffffff, #000000 200%); height:583px; width:1200px; border-radius:20px; margin:auto"
  >
    <div
      id="model-popup-parent"
      style="width:100%; height:100%; position:absolute; top:0; left:0; align-items:center; justify-content:center; z-index: 99; display:none;"
    >
      <div
        id="model-popup"
        style="width: 500px; height:300px; margin: 0; margin-left:auto; margin-right:auto; background-color:silver; position: absolute; top: 50%; left:50%; transform: translateY(-50%) translateX(-50%); border-radius:20px"
      >
        <h1 style="margin: 20px 0 0 20px;">Choose a model</h1>

        <div
          id="model-choices"
          style="display:flex; flex-direction: column; align-items:center; justify-content:center; margin-top: 20px;"
        >
          <div>
            <span>Mistral</span>
            <span id="model-descrip">Ideal for coding</span>
          </div>

          <div>
            <span>LLama3</span>
            <span id="model-descrip"> Advanced Chat Model </span>
          </div>

          <div>
            <span>LLama2</span>
            <span id="model-descrip">Basic Chat Model</span>
          </div>

          <div>
            <span>LLama1</span>
            <span id="model-descrip">Rudimentary Chat Model</span>
          </div>
        </div>
      </div>
    </div>

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
          <a> Reset chat </a>

          <a> Change model </a>

          <a style="margin-top: 110px;"> Exit the app </a>
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
              onclick="document.getElementById('img-handler').click();"
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

  #model-choices div {
    font-size: 20px;
    font-family: gilroy;
    margin: 0;
    width: 100%;
    transition: all 1s ease-out;
    height: 50px;
    background-color: transparent;
    position: relative;
    transition: all 1s ease-out;
  }

  #model-choices div span {
    padding: 0;
    font-size: 20px;
    font-family: gilroy;
    margin-left: 40px;
    transition: all 1s ease-out;
  }

  #model-choices div #model-descrip {
    font-size: 15px;
    font-family: gilroy;
    transition: all 1s ease-out;
    text-align: right;
    position: absolute;
    right: 40px;
  }

  #model-choices div:hover {
    cursor: pointer;
    margin-left: 50px;
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

  #choices a {
    text-decoration: none;
    color: black;
    font-size: 20px;
    font-family: gilroy;
    margin: 10px;
    margin-top: 50px;
    transition: all 1s ease-out;
  }

  #choices a:hover {
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
