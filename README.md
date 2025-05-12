# aframe-components
Some useful A-Frame components.


## aframe-input
A-Frame component for handling input events.

## animation-text
A-Frame component for animating text.
```javascript
//引入
import AnimationText from "./animation-text.js";
AFRAME.registerComponent('animation-text', AnimationText)
```

```html
<!-- 使用 -->
<a-assets timeout="10000">
<a-asset-item id="BlackItalic" src="assets/fonts/MontserratAlternates-BlackItalic.ttf"></a-asset-item>
</a-assets>
<a-entity animation-text="font:#BlackItalic" position="0 0 -0.5"></a-entity>
```

## animation-ui
A-Frame component for animating UI elements.
```javascript
import AnimationUI from "./animation-ui.js";
AFRAME.registerComponent('animation-ui', AnimationUI)
```

```html
<a-entity
    class="button cantap confirm"
    position="0 -0.4 0.005"
    animation-ui="className:animationButton; factor:1.06; dur:200"
></a-entity>
```

## headset-control
A-Frame component for handling headset controls.
```javascript
import HeadsetControl from "./headset-control.js";
AFRAME.registerComponent('headset-control', HeadsetControl)
```

```html
<a-entity oculus-touch-controls="hand: left;" id="left-hand" headset-control="hand:left;"></a-entity>
<a-entity oculus-touch-controls="hand: right;" id="right-hand" headset-control="hand:right;"></a-entity>
```

## model-controls
A-Frame component for handling model controls.
```javascript
import ModelControls from "./model-controls.js";
AFRAME.registerComponent('model-controls', ModelControls)
```
```html
<a-entity id="map" position="0 0 0" scale="50 50 50" rotation="30.000 180 0" gltf-model="#map-model" model-controls="maxScale: 80;mode:rotation;scaleFactor: 2;moveSpeed:0.03"></a-entity>
```

## my camera
A-Frame component for handling my camera.
```javascript
import MyCamera from "./my-camera.js";
AFRAME.registerComponent('my-camera', MyCamera)
```
```html
<a-camera id="camera" npn-camera cursor="rayOrigin: mouse; fuse: false;" look-controls="touchEnabled:false;mouseEnabled:false;" raycaster="objects: .cantap">
</a-camera>
```

## npc-fix-animation
A-Frame component for fixing NPC animations.
让有动画位移的模型位置固定，只播放动画。
```javascript
import NpcFixAnimation from "./npc-fix-animation.js";
AFRAME.registerComponent('npc-fix-animation', NpcFixAnimation)
```
```html
<a-entity gltf-model="#npc-dyn-man-1-model" scale="1.45 1.45 1.45" npc-el visible="true" npc-fix-animation="clip:Armature">
</a-entity>
```

## npc-path-move
A-Frame component for moving NPCs along a path.
```javascript
import NpcPathMove from "./npc-path-move.js";
AFRAME.registerComponent('npc-path-move', NpcPathMove)
```
```html
<a-entity gltf-model="#npc-dyn-man-1-model" scale="1.45 1.45 1.45" npc-el visible="true" npc-fix-animation="clip:Armature" npc-path-move="pathPoints: 3.3 0 -1.9,3.3 0 16.2; speed: 1;offset:-1.6">
</a-entity>
```

## npc-visibility-manager
A-Frame component for managing NPC visibility.
动态显隐控制
```javascript
import NpcVisibilityManager from "./npc-visibility-manager.js";
AFRAME.registerComponent('npc-visibility-manager', NpcVisibilityManager)
```
```html
<a-scene id="scene" npc-visibility-manager1="range: 25; checkInterval: 30; element: npc-el;enabled:false">
</a-scene>
```
