//===================================================================
// three.js の各種設定
//===================================================================
var scene = new THREE.Scene();                        // シーンの作成
var renderer = new THREE.WebGLRenderer({              // レンダラの作成
    antialias: true,                                    // アンチエイリアス有効
    alpha: true,                                        // canvasに透明度バッファを持たせる
});
renderer.setClearColor(new THREE.Color("black"), 0);  // レンダラの背景色
renderer.setSize(window.innerHeight, window.innerWidth);                           // レンダラのサイズ
renderer.domElement.style.position = "absolute";      // レンダラの位置は絶対値
renderer.domElement.style.top = "0px";                // レンダラの上端
renderer.domElement.style.left = "0px";               // レンダラの左端
document.body.appendChild(renderer.domElement);       // レンダラの DOM を body に入れる
var camera = new THREE.Camera();                      // カメラの作成
scene.add(camera);                                    // カメラをシーンに追加
var light = new THREE.DirectionalLight(0xffffff);     // 平行光源（白）を作成
light.position.set(0, 0, 2);                          // カメラ方向から照らす
scene.add(light);                                     // シーンに光源を追加

//===================================================================
// arToolkitSource（マーカトラッキングするメディアソース）
//===================================================================
var source = new THREEx.ArToolkitSource({             // arToolkitSourceの作成
    sourceType: "webcam",                               // Webカメラを使う（スマホもこれでOK）
});
source.init(function onReady() {                      // ソースを初期化し、準備ができたら
    onResize();                                         // リサイズ処理
});

//===================================================================
// arToolkitContext（カメラパラメータ、マーカ検出設定）
//===================================================================
var context = new THREEx.ArToolkitContext({           // arToolkitContextの作成
    debug: false,                                       // デバッグ用キャンバス表示（デフォルトfalse）
    cameraParametersUrl: "assets/camera_para.dat",             // カメラパラメータファイル
    detectionMode: "mono",                              // 検出モード（color/color_and_matrix/mono/mono_and_matrix）
    imageSmoothingEnabled: true,                        // 画像をスムージングするか（デフォルトfalse）
    maxDetectionRate: 60,                               // マーカの検出レート（デフォルト60）
    canvasWidth: source.parameters.sourceWidth,         // マーカ検出用画像の幅（デフォルト640）
    canvasHeight: source.parameters.sourceHeight,       // マーカ検出用画像の高さ（デフォルト480）
});
context.init(function onCompleted(){                  // コンテクスト初期化が完了したら
    camera.projectionMatrix.copy(context.getProjectionMatrix());   // 射影行列をコピー
});

//===================================================================
// リサイズ処理
//===================================================================
window.addEventListener("resize", function() {        // ウィンドウがリサイズされたら
    onResize();                                         // リサイズ処理
});
// リサイズ関数
function onResize(){
    source.onResizeElement();                           // トラッキングソースをリサイズ
    source.copyElementSizeTo(renderer.domElement);      // レンダラも同じサイズに
    if(context.arController !== null){                  // arControllerがnullでなければ
        source.copyElementSizeTo(context.arController.canvas);  // それも同じサイズに
    }
}

//===================================================================
// ArMarkerControls（マーカと、マーカ検出時の表示オブジェクト）
//===================================================================
//-------------------------------
// その１（hiroマーカ＋立方体）
//-------------------------------
// マーカ
// ネットでhiroマーカの画像を得て、以下の AR.js のマーカトレーニングサイトで patt を作成
// https://jeromeetienne.github.io/AR.js/three.js/examples/marker-training/examples/generator.html
var marker1 = new THREE.Group();                      // マーカをグループとして作成
var controls = new THREEx.ArMarkerControls(context, marker1, {    // マーカを登録
    type: "pattern",                                    // マーカのタイプ
    patternUrl: "assets/pattern-marker.patt",                            // マーカファイル
});
scene.add(marker1);                                   // マーカをシーンに追加
// モデル（メッシュ）
var geo = new THREE.CubeGeometry(1, 1, 1);            // cube ジオメトリ（サイズは 1x1x1）
var mat = new THREE.MeshNormalMaterial({              // マテリアルの作成
    transparent: true,                                  // 透過
    opacity: 0.5,                                       // 不透明度
    side: THREE.DoubleSide,                             // 内側も描く
});
var mesh1 = new THREE.Mesh(geo, mat);                 // メッシュを生成
mesh1.name = "cube";                                  // メッシュの名前（後でピッキングで使う）
mesh1.position.set(0, 0.5, 0);                        // 初期位置
marker1.add(mesh1);                                   // メッシュをマーカに追加

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
    var mouseX = ret.clientX;                           // マウスのx座標
    var mouseY = ret.clientY;                           // マウスのy座標
    mouseX =  (mouseX / window.innerWidth)  * 2 - 1;    // -1 ～ +1 に正規化されたx座標
    mouseY = -(mouseY / window.innerHeight) * 2 + 1;    // -1 ～ +1 に正規化されたy座標
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
    if(source.ready === false)    { return; }             // メディアソースの準備ができていなければ抜ける
    context.update(source.domElement);                  // ARToolkitのコンテキストを更新
    TWEEN.update();                                     // Tweenアニメーションを更新
    renderer.render(scene, camera);                     // レンダリング実施
}
renderScene();                                        // 最初に1回だけレンダリングをトリガ
