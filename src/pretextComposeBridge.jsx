import './pretextComposeBridge.css';
import { getDefaultPretextBoxes, serializePretextBoxes } from './pretextLayoutAdapter.js';

function getTargetOrigin() {
  return window.location.origin === 'null' ? '*' : window.location.origin;
}

function isAcceptedMessageOrigin(origin) {
  if (window.location.origin === 'null') {
    return origin === 'null' || origin === '';
  }
  return origin === window.location.origin;
}

export function mountComposePretextEditor(container, options = {}) {
  let latestBoxes = getDefaultPretextBoxes(options.customLayout, options.textValues);
  const frame = document.createElement('iframe');
  frame.className = 'compose-pretext-iframe';
  frame.src = './pretext-editor.html?embedded=1';
  frame.title = 'Pretext editor';
  frame.setAttribute('loading', 'eager');
  frame.setAttribute('allow', 'clipboard-read; clipboard-write');
  container.replaceChildren(frame);

  const sendInit = () => {
    frame.contentWindow?.postMessage(
      {
        type: 'memories:pretext:init',
        boxes: latestBoxes,
      },
      getTargetOrigin(),
    );
  };

  const handleMessage = (event) => {
    if (!isAcceptedMessageOrigin(event.origin)) return;
    if (event.source !== frame.contentWindow) return;
    const payload = event.data;
    if (!payload || typeof payload !== 'object') return;

    if (payload.type === 'memories:pretext:ready') {
      sendInit();
      return;
    }

    if (payload.type === 'memories:pretext:change' && Array.isArray(payload.boxes)) {
      latestBoxes = payload.boxes;
    }
  };

  frame.addEventListener('load', sendInit);
  window.addEventListener('message', handleMessage);

  return {
    unmount() {
      frame.removeEventListener('load', sendInit);
      window.removeEventListener('message', handleMessage);
      frame.remove();
    },
    sendCommand(command) {
      frame.contentWindow?.postMessage(
        {
          type: 'memories:pretext:command',
          command,
        },
        getTargetOrigin(),
      );
    },
    getBoxes() {
      return latestBoxes;
    },
    getSerializedLayout() {
      return serializePretextBoxes(latestBoxes);
    },
  };
}
