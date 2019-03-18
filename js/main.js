//===================================================================
// three.js の設定
//===================================================================
var scene = new THREE.Scene()
var renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
})
renderer.setClearColor(new THREE.Color("black"), 0)
renderer.setSize(window.innerHeight, window.innerWidth)
renderer.domElement.style.position = "absolute"
renderer.domElement.style.top = "0px"
renderer.domElement.style.left = "0px"
document.body.appendChild(renderer.domElement)
var camera = new THREE.Camera()
scene.add(camera)
var light = new THREE.DirectionalLight(0xffffff)
light.position.set(0, 0, 2)
scene.add(light)

//===================================================================
// リサイズ処理
//===================================================================

// リサイズ関数
function onResize(){
    console.log("onResize" + window.innerHeight + ' ' + window.innerWidth)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    source.onResizeElement()
    source.copyElementSizeTo(renderer.domElement)
    if(context.arController !== null){
        source.copyElementSizeTo(context.arController.canvas)
    }
}
window.addEventListener("resize", function() {
    onResize();
})

//===================================================================
// arToolkitSource（マーカトラッキングするメディアソース）
//===================================================================
var source = new THREEx.ArToolkitSource({
    sourceType: "webcam",
    sourceUrl : null,
    sourceWidth: window.innerWidth,
    sourceHeight: window.innerHeight,
    displayWidth: window.innerWidth,
    displayHeight: window.innerHeight
})
source.init(function onReady() {
    onResize()
})

//===================================================================
// arToolkitContext（カメラパラメータ、マーカ検出設定）
//===================================================================
var context = new THREEx.ArToolkitContext({
    debug: true,
    cameraParametersUrl: "assets/camera_para.dat",
    detectionMode: "mono",
    imageSmoothingEnabled: true,
    maxDetectionRate: 60,
    canvasWidth: window.innerWidth,
    canvasHeight: window.innerHeight
})
context.init(function onCompleted(){
    camera.projectionMatrix.copy(context.getProjectionMatrix())
    onResize()
})


//===================================================================
// ArMarkerControls（マーカと、マーカ検出時の表示オブジェクト）
//===================================================================
// https://jeromeetienne.github.io/AR.js/three.js/examples/marker-training/examples/generator.html
var marker1 = new THREE.Group()
var controls = new THREEx.ArMarkerControls(context, marker1, {
    type: "pattern",
    patternUrl: "assets/pattern-marker.patt",
})
scene.add(marker1)
// モデル（メッシュ）
var geo = new THREE.CubeGeometry(1, 1, 1)
var mat = new THREE.MeshNormalMaterial({
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
})
var mesh1 = new THREE.Mesh(geo, mat)
mesh1.name = "cube"
mesh1.position.set(0, 0.5, 0)
marker1.add(mesh1)

//===================================================================
// Tween アニメーション
//===================================================================
//-------------------------------
// mesh1 について（cubeが転がる）
//-------------------------------
var twIni1 = {posZ: 0, rotX: 0};                      // 初期パラメータ
var twVal1 = {posZ: 0, rotX: 0};                      // tweenによって更新されるパラメータ
var twFor1 = {posZ: -2, rotX: -Math.PI};              // ターゲットパラメータ
function tween1() {                                   // 「行き」のアニメーション
    var tween = new TWEEN.Tween(twVal1)                 // tweenオブジェクトを作成
        .to(twFor1, 2000)                                   // ターゲットと到達時間
        .easing(TWEEN.Easing.Back.Out)                      // イージング
        .onUpdate(function() {                              // フレーム更新時の処理
            mesh1.position.z = twVal1.posZ;                   // 位置を変更
            mesh1.rotation.x = twVal1.rotX;                   // 回転を変更
        })
        .onComplete(function() {                            // アニメーション完了時の処理
            tween1_back();                                    // 「帰り」のアニメーションを実行
        })
        .delay(0)                                           // 開始までの遅延時間
        .start();                                           // tweenアニメーション開始
}
function tween1_back() {                              // 「帰り」のアニメーション
    var tween = new TWEEN.Tween(twVal1)
        .to(twIni1, 2000)                                   // ターゲットを初期パラメータに設定
        .easing(TWEEN.Easing.Back.InOut)
        .onUpdate(function() {
            mesh1.position.z = twVal1.posZ;
            mesh1.rotation.x = twVal1.rotX;
        })
        .onComplete(function() {
            // なにもしない
        })
        .delay(100)
        .start();
}

//===================================================================
// マウスダウン（タップ）によるピッキング処理
//===================================================================
window.addEventListener("touchstart", function(ret) {
    console.log("touchstart")
    var mouseX = ret.clientX
    var mouseY = ret.clientY
    mouseX =  (mouseX / window.innerWidth)  * 2 - 1
    mouseY = -(mouseY / window.innerHeight) * 2 + 1
    var pos = new THREE.Vector3(mouseX, mouseY, 1);     // マウスベクトル
    pos.unproject(camera);                              // スクリーン座標系をカメラ座標系に変換
    // レイキャスタを作成（始点, 向きのベクトル）
    var ray = new THREE.Raycaster(camera.position, pos.sub(camera.position).normalize());
    var obj = ray.intersectObjects(scene.children, true);   // レイと交差したオブジェクトの取得
    if(obj.length > 0) {                                // 交差したオブジェクトがあれば
        picked(obj[0].object.name);                       // ピックされた対象に応じた処理を実行
    }
});
// ピックされた対象に応じた処理
function picked(objName) {
    switch(objName) {
        case "cube":                                      // cubeなら
            tween1();                                       // cubeのアニメーションを実行
            break;
        default:
            break;
    }
}

//===================================================================
// レンダリング・ループ
//===================================================================
function renderScene() {                              // レンダリング関数
    requestAnimationFrame(renderScene);                 // ループを要求
    if(source.ready === false){
        return
    }
    context.update(source.domElement);                  // ARToolkitのコンテキストを更新
    TWEEN.update();                                     // Tweenアニメーションを更新
    renderer.render(scene, camera);                     // レンダリング実施
}
renderScene();                                        // 最初に1回だけレンダリングをトリガ
