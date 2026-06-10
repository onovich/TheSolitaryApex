import { ITEM_CATALOG } from "../../data/itemCatalog.js";
import { emitItemFeedback } from "./itemFeedbackSystem.js";

export function startChannelItem(state, itemDefinition) {
  state.itemState.channel = {
    itemId: itemDefinition.id,
    remainingFrames: itemDefinition.activation.channelFrames,
    totalFrames: itemDefinition.activation.channelFrames,
  };
}

export function tickChannelItem(state, runtime) {
  const channelState = state.itemState.channel;

  if (!channelState) {
    return;
  }

  const itemDefinition = ITEM_CATALOG[channelState.itemId];

  if (itemDefinition.activation.requiresSingleHandHang && !runtime.isSingleHandHang(state)) {
    state.itemState.channel = null;
    return;
  }

  channelState.remainingFrames -= 1;

  if (channelState.remainingFrames > 0) {
    return;
  }

  runtime.restoreStamina(state, itemDefinition.activation.restoreStamina);
  emitItemFeedback(state, itemDefinition);
  state.itemState.channel = null;
}
