import { MapController } from '@deck.gl/core';

export default class CtrlController extends MapController {
  isFunctionKeyPressed(event) {
    const isCtrl = event.srcEvent.ctrlKey || event.srcEvent.metaKey;
    return isCtrl;
  }
}
