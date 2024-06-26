<script>
  import { onMount } from "svelte";
  import logo from "C:/Users/Mohamed/Documents/GitHub/OverAI/main/src/renderer/src/lib/components/sokora.svg?url";

  let svgBuff, svgelem;

  let promise 
  
  promise = new Promise((resolve, _) => {
    onMount(async () => {
      let res = await fetch(logo);
      svgBuff = await res.text();
      svgelem = new DOMParser().parseFromString(
        svgBuff,
        "image/svg+xml"
      ).documentElement;
      document.body.prepend(svgelem);
      resolve(null)
    });

    promise.then(() => {
      document.getElementById('#navbar-logo').appendChild(svgelem)
    });
  });
</script>

<body>
  <div id="navbar" style="width: 100%; height:100px; position:absolute; top:0;">
    <div
      id="navbar-logo"
      style="width: 100%; height: 100px; background-color:transparent; position:relative; display:flex; margin:auto; align-items: center; justify-content: center;"
    >
      <!--Will be added from the home.svelte script (Preavailable container)-->
    </div>
    <div
      id="navbar-links"
      style="width: 100%; height:100px; position:absolute; display:flex; justify-content: center; align-items:center;"
    >
      <a href="#">link 1</a>
      <a href="#">link 2</a>
      <a href="#">link 3</a>
      <a href="#">link 4</a>  
    </div>
  </div>
</body>

<style>
  #navbar-links a {
    margin: 30px;
    text-decoration: none;
    color: white;
  }
</style>
