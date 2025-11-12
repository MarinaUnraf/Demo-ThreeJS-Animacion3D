import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xacf4fc);
const canvas = document.getElementById("experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

//agregando la luz
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);
const sun = new THREE.DirectionalLight(0xffffff, 2);
scene.add(sun);
const helper = new THREE.DirectionalLightHelper(sun, 10);
//scene.add( helper );

// declarando el personaje y sus propiedades
let character = {
    instance: null,
    moveDistance: .5,
    jumpHeight: 1,
    isMoving: false,
    moveDuration: 0.2,
};


//creando el renderer
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
//renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

//binding del contenido con la escena

const modalContent = {
  cartel: {
    title: "unrafita sandbox",
    content:
      "... y llegamos al final del año y al final de Animación 3D. Tomemos un tiempo para observar hasta donde llegamos y lo que hemos logrado... Y sigamos adelante!",
  },
};
const modal = document.querySelector(".modal");
const modalTitle = document.querySelector(".modal-title");
const modalProjectdescritption = document.querySelector(
  ".modal-project-description"
);
const modalExitButton = document.querySelector(".modal-exit-button");

function showModal(id) {
  const content = modalContent[id];
  if (content) {
    modalTitle.textContent = content.title;
    modalProjectdescritption.textContent = content.content;
    modal.classList.toggle("hidden");
  }
}

function hideModal() {
  modal.classList.toggle("hidden");
}

let intersectObject = "";
const intersectObjects = [];
const intersectObjectsNames = ["cartel", "Character"];

//cargando el glb en la escena
const loader = new GLTFLoader();

loader.load(
  "./unrafita-sandbox-scenario-threejs.glb",
  function (glb) {
    glb.scene.traverse((child) => {
      if (intersectObjectsNames.includes(child.name)) {
        intersectObjects.push(child);
      }
      if (child.name === "Character") {
        character.instance = child;
      } 
    });
    scene.add(glb.scene);
    console.log(glb.scene);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

//seteando las camaras

const aspect = sizes.width / sizes.height;
const camera = new THREE.OrthographicCamera(
  -aspect * 5,
  aspect * 5,
  5,
  -5,
  0.1,
  1000
);

camera.position.x = 8;
camera.position.y = 2;
camera.position.z = 5;

// seteando orbitControls
const controls = new OrbitControls(camera, canvas);
controls.update();

//optimización de la camara
function onResize() {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  const aspect = sizes.width / sizes.height;
  (camera.left = -aspect * 5),
    (camera.right = aspect * 5),
    (camera.top = 5),
    (camera.bottom = -5),
    camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
}

//raycasting
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
function onPointerMove(event) {
  //calcula la posicion del raton en un dispositivo normalizando coordenadas
  //en el rango -1 a 1 para ambos ejes
  pointer.x = (event.clientX / sizes.width) * 2 - 1;
  pointer.y = -(event.clientY / sizes.height) * 2 + 1;
}

function onClick() {
  console.log(intersectObject);
  if (intersectObject !== "") {
    showModal(intersectObject);
  }
}

//movimiento del personaje

function characterMove(targetPosition, targetRotation) {
  character.isMoving = true;

  const t1 = gsap.timeline({
    onComplete: () => {
      character.isMoving = false;
    }
  })

  t1.to(character.instance.position, {
    x: targetPosition.x,
    z : targetPosition.z,
    duration: character.moveDuration
  })

  t1.to(character.instance.rotation, {
    y: targetRotation,
    duration: character.moveDuration
  },
 0)
 t1.to(character.instance.position, {
    y: targetPosition.y + character.jumpHeight,
    duration: character.moveDuration,
    yoyo: true,
    repeat: 1
  },
  0)
}
function onKeyDown(event) {
    if(character.isMoving) 
    return;

   const targetPosition = new THREE.Vector3().copy(character.instance.position);
   let targetRotation = 0;

  switch (event.key.toLowerCase()) {
    case "w":
    case "arrowup":
      targetPosition.z -= character.moveDistance;
      targetRotation = -Math.PI;
      break;
    case "a":
    case "arrowleft":
      targetPosition.x -= character.moveDistance;
      targetRotation = -Math.PI/2
      break;
    case "s":
    case "arrowdown":
      targetPosition.z += character.moveDistance;
      targetRotation = 0
      break;
    case "d":
    case "arrowright":
      targetPosition.x += character.moveDistance;
      targetRotation = Math.PI/2;
      break;
      default:
        return;
        
      }
  characterMove(targetPosition, targetRotation);
}

//eventos 

modalExitButton.addEventListener("click", hideModal);
window.addEventListener("resize", onResize);
window.addEventListener("click", onClick);
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("keydown", onKeyDown);

function animate() {
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(intersectObjects);

  if (intersects.length > 0) {
    document.body.style.cursor = "pointer";
  } else {
    document.body.style.cursor = "default";
    intersectObject = "";
  }

  for (let i = 0; i < intersects.length; i++) {
    intersectObject = intersects[0].object.parent.name;
  }
  //console.log(camera.position)
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
