
////////////////////////////////////////////////////////////////////////////////
//          基本設定
////////////////////////////////////////////////////////////////////////////////
var renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});
renderer.setClearColor(new THREE.Color('lightgrey'), 0)
// renderer.setPixelRatio( 1/2 );
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = 'absolute'
renderer.domElement.style.top = '0px'
renderer.domElement.style.left = '0px'
document.body.appendChild(renderer.domElement);
// array of functions for the rendering loop
var onRenderFcts = [];
// init scene and camera
var scene = new THREE.Scene();


var camera = new THREE.Camera();
scene.add(camera);

var arToolkitSource = new THREEx.ArToolkitSource({
    sourceType: 'webcam',
})
arToolkitSource.init(function onReady() {
    onResize()
})
// windowサイズの変更
window.addEventListener('resize', function () {
    onResize()
})
function onResize() {
    arToolkitSource.onResize()
    arToolkitSource.copySizeTo(renderer.domElement)
    if (arToolkitContext.arController !== null) {
        arToolkitSource.copySizeTo(arToolkitContext.arController.canvas)
    }
}

////////////////////////////////////////////////////////////////////////////////
//          AR認識
////////////////////////////////////////////////////////////////////////////////

// create atToolkitContext
var arToolkitContext = new THREEx.ArToolkitContext({
    cameraParametersUrl: 'assets/camera_para.dat',
    detectionMode: 'mono',
    maxDetectionRate: 60,
    canvasWidth: window.innerWidth,
    canvasHeight: window.innerHeight,
})
// initialize it
arToolkitContext.init(function onCompleted() {
    camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
})
// update artoolkit on every frame
onRenderFcts.push(function () {
    if (arToolkitSource.ready === false) return
    arToolkitContext.update(arToolkitSource.domElement)
})

var markerRoot = new THREE.Group
scene.add(markerRoot)
var artoolkitMarker = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
    type: 'pattern',
    patternUrl: 'assets/pattern-marker.patt',
    minConfidence: '0.7'
})
// build a smoothedControls
var smoothedRoot = new THREE.Group()
scene.add(smoothedRoot)
var smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot, {
    lerpPosition: 0.4,
    lerpQuaternion: 0.3,
    lerpScale: 1,
})
onRenderFcts.push(function (delta) {
    smoothedControls.update(markerRoot)
})

//////////////////////////////////////////////////////////////////////////////////
//		コンテンツ
//////////////////////////////////////////////////////////////////////////////////

var arWorldRoot = smoothedRoot
// add a torus knot
var geometry = new THREE.CubeGeometry(1, 1, 1);
var material = new THREE.MeshNormalMaterial({
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
});
var mesh = new THREE.Mesh(geometry, material);
mesh.position.y = geometry.parameters.height / 2
arWorldRoot.add(mesh);

var geometry = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 16);
var material = new THREE.MeshNormalMaterial();
var mesh = new THREE.Mesh(geometry, material);
mesh.position.y = 0.5
arWorldRoot.add(mesh);


//////////////////////////////////////////////////////////////////////////////////
//		コンテンツの描画
//////////////////////////////////////////////////////////////////////////////////

// 負荷表示
var stats = new Stats();
document.body.appendChild(stats.dom);
// render the scene
onRenderFcts.push(function () {
    renderer.render(scene, camera);
    stats.update();
})

// 描画
var lastTimeMsec = null
requestAnimationFrame(function animate(nowMsec) {
    // keep looping
    requestAnimationFrame(animate);
    // measure time
    lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60
    var deltaMsec = Math.min(200, nowMsec - lastTimeMsec)
    lastTimeMsec = nowMsec
    // call each update function
    onRenderFcts.forEach(function (onRenderFct) {
        onRenderFct(deltaMsec / 1000, nowMsec / 1000)
    })
})