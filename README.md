# OverAI
Local and offline AI interpreter to chat, share and generate images with an AI.

## Requirements
- [Ollama](https://ollama.com/download)
- [electron-vite](https://electron-vite.org/guide/)
- A computer :skull:

## How to install

1. Download Ollama from [this link](https://ollama.com/download)

2. Clone the OverAI repo and install the necessary dependencies
```
git clone https://github.com/Nickeldon/OverAI.git

npm run install //installs dependencies inside the root folder and inside the main folder
```

3. run the app
```
npm run dev
```

4. When OverAI is loaded, choose and downlaod an AI from the listed ones

5. Enjoy

### Notes
Notes: 
1. As everything is compiled locally, the AI process will create a heavy GPU load while in use
2. Only LLaVa can have an image input from the user
3. LLaMa 2 and LLaMa 3 both can generate images from the user's prompt (Coming soon)
4. Mistral is mostly used for coding tasks
5. The app may have various bugs as it is not finished yet (Way enough for testing though)
6. The User must have Ollama installed on the host's computer to use OverAI
7. As said earlier, no internet connectivity is needed for the app to operate correctly (Downloading models requires an internet connectivity :skull:)
